import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { fundWithFriendbot, generateEscrowKeypair, getAccountBalance, hashTerms } from "@/lib/stellar.server";

const IdInput = z.object({ campaign_id: z.string().uuid() });

export const createContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => IdInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: campaign, error: cErr } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", data.campaign_id)
      .single();
    if (cErr || !campaign) throw new Error("Campaign not found");
    if (campaign.owner_id !== userId) throw new Error("Forbidden");

    const kp = generateEscrowKeypair();
    const terms = {
      version: 1,
      network: "stellar-testnet",
      escrow: kp.publicKey,
      advertiser: userId,
      brand: campaign.brand,
      budget_pi: Number(campaign.budget_pi),
      venues: campaign.venues,
      regions: campaign.regions,
      starts_at: campaign.starts_at,
      ends_at: campaign.ends_at,
      created_at: new Date().toISOString(),
    };
    const termsText = JSON.stringify(terms);
    const termsHash = await hashTerms(termsText);

    const funding = await fundWithFriendbot(kp.publicKey);
    const funded = "hash" in funding;
    const state = funded ? "funded" : "draft";

    const { data: contract, error } = await supabase
      .from("contracts")
      .insert({
        campaign_id: campaign.id,
        escrow_public_key: kp.publicKey,
        network: "stellar-testnet",
        funding_tx_hash: funded ? funding.hash : null,
        terms_hash: termsHash,
        terms_json: terms,
        state,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await supabase.from("contract_events").insert([
      {
        contract_id: contract.id,
        event_type: "contract.created",
        payload: { terms_hash: termsHash, escrow: kp.publicKey },
      },
      ...(funded
        ? [{
            contract_id: contract.id,
            event_type: "escrow.funded",
            tx_hash: funding.hash,
            amount_pi: Number(campaign.budget_pi),
            payload: { source: "friendbot" },
          }]
        : [{
            contract_id: contract.id,
            event_type: "escrow.fund_failed",
            payload: { error: (funding as { error: string }).error },
          }]),
    ]);

    if (funded) {
      await supabase.from("campaigns").update({ status: "funded" }).eq("id", campaign.id);
    }

    return { contract, funded, escrow: kp.publicKey };
  });

export const refreshContractBalance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ contract_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: contract } = await supabase
      .from("contracts")
      .select("escrow_public_key")
      .eq("id", data.contract_id)
      .single();
    if (!contract) throw new Error("Contract not found");
    const balance = await getAccountBalance(contract.escrow_public_key);
    return { balance_xlm: balance };
  });