import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PLATFORM_FEE_PCT = 0.08;

export const listLocations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("billboard_locations")
      .select("*, ad_partners(name, slug, logo_emoji, adapter)")
      .eq("active", true)
      .order("daily_impressions", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getLocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: loc, error } = await supabase
      .from("billboard_locations")
      .select("*, ad_partners(id, name, slug, logo_emoji, adapter)")
      .eq("slug", data.slug)
      .single();
    if (error || !loc) throw new Error("Location not found");
    const [{ data: campaigns }, { data: bookings }] = await Promise.all([
      supabase.from("campaigns").select("id, brand, status").eq("owner_id", userId).order("created_at", { ascending: false }),
      supabase.from("location_bookings").select("*").eq("location_id", loc.id).order("starts_at", { ascending: true }),
    ]);
    return { location: loc, campaigns: campaigns ?? [], bookings: bookings ?? [] };
  });

const BookInput = z.object({
  campaign_id: z.string().uuid(),
  location_id: z.string().uuid(),
  hours: z.number().int().min(1).max(720),
  starts_at: z.string(),
});

export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => BookInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: loc, error: le } = await supabase
      .from("billboard_locations")
      .select("*")
      .eq("id", data.location_id)
      .single();
    if (le || !loc) throw new Error("Location not found");
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id, owner_id")
      .eq("id", data.campaign_id)
      .single();
    if (!campaign || campaign.owner_id !== userId) throw new Error("Campaign not found");
    const { data: creative } = await supabase
      .from("campaign_creatives")
      .select("id")
      .eq("campaign_id", data.campaign_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const starts = new Date(data.starts_at);
    const ends = new Date(starts.getTime() + data.hours * 3_600_000);
    const subtotal = Number(loc.hourly_rate_pi) * data.hours;
    const fee = +(subtotal * PLATFORM_FEE_PCT).toFixed(2);
    const total = +(subtotal + fee).toFixed(2);
    const { data: partner } = await supabase.from("ad_partners").select("adapter").eq("id", loc.partner_id).single();
    const status = partner?.adapter === "simulated" ? "approved" : "pending";

    const { data: booking, error: be } = await supabase
      .from("location_bookings")
      .insert({
        advertiser_id: userId,
        campaign_id: data.campaign_id,
        creative_id: creative?.id ?? null,
        location_id: loc.id,
        partner_id: loc.partner_id,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        hours_booked: data.hours,
        quoted_price_pi: total,
        status,
        decided_at: status === "approved" ? new Date().toISOString() : null,
      })
      .select("*")
      .single();
    if (be || !booking) throw new Error(be?.message ?? "Booking failed");

    const num = `INV-${Date.now().toString(36).toUpperCase()}`;
    await supabase.from("invoices").insert({
      booking_id: booking.id,
      advertiser_id: userId,
      partner_id: loc.partner_id,
      number: num,
      subtotal_pi: subtotal,
      platform_fee_pi: fee,
      total_pi: total,
      status: "issued",
    });

    return booking;
  });

export const listMyBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: bookings }, { data: invoices }] = await Promise.all([
      supabase
        .from("location_bookings")
        .select("*, billboard_locations(name, city, country, hero_emoji, slug), ad_partners(name, logo_emoji), campaigns(brand)")
        .eq("advertiser_id", userId)
        .order("created_at", { ascending: false }),
      supabase.from("invoices").select("*").eq("advertiser_id", userId).order("issued_at", { ascending: false }),
    ]);
    return { bookings: bookings ?? [], invoices: invoices ?? [] };
  });

export const payInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ invoice_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: inv, error } = await supabase
      .from("invoices")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", data.invoice_id)
      .eq("advertiser_id", userId)
      .select("*, location_bookings(id, hours_booked, starts_at, location_id, partner_id)")
      .single();
    if (error || !inv) throw new Error(error?.message ?? "Payment failed");

    const booking = (inv as unknown as { location_bookings: { id: string; hours_booked: number; starts_at: string; location_id: string; partner_id: string } }).location_bookings;
    if (booking) {
      const { data: loc } = await supabase.from("billboard_locations").select("slot_seconds, daily_impressions").eq("id", booking.location_id).single();
      const slotSec = loc?.slot_seconds ?? 15;
      const daily = loc?.daily_impressions ?? 100000;
      const perPlay = Math.max(1, Math.round((daily / (24 * 3600)) * slotSec));
      const start = new Date(booking.starts_at).getTime();
      const playsPerHour = 4;
      const rows: Array<{ booking_id: string; location_id: string; partner_id: string; advertiser_id: string; played_at: string; duration_seconds: number; impressions: number }> = [];
      for (let h = 0; h < booking.hours_booked; h++) {
        for (let p = 0; p < playsPerHour; p++) {
          const t = new Date(start + h * 3_600_000 + p * (3_600_000 / playsPerHour));
          rows.push({
            booking_id: booking.id,
            location_id: booking.location_id,
            partner_id: booking.partner_id,
            advertiser_id: userId,
            played_at: t.toISOString(),
            duration_seconds: slotSec,
            impressions: perPlay,
          });
        }
      }
      if (rows.length > 0) await supabase.from("plays").insert(rows);
      await supabase.from("location_bookings").update({ status: "running" }).eq("id", booking.id);
    }
    return inv;
  });

export const getBookingPlays = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ booking_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: plays, error } = await supabase
      .from("plays")
      .select("*")
      .eq("booking_id", data.booking_id)
      .order("played_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    const total_impressions = (plays ?? []).reduce((n, p) => n + (p.impressions ?? 0), 0);
    return { plays: plays ?? [], total_impressions };
  });
