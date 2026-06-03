import { createFileRoute } from "@tanstack/react-router";
import heroStadium from "@/assets/hero-stadium.jpg";
import cityBillboards from "@/assets/city-billboards.jpg";
import arenaLed from "@/assets/arena-led.jpg";
import { PiAuthButton } from "@/components/PiAuthButton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PiBoards — AI Ads on Live Venues, Powered by Pi" },
      { name: "description", content: "Design, target, and run AI-generated ads on stadium screens, arena LEDs and global billboards. Settled in Pi." },
      { property: "og:title", content: "PiBoards — AI Ads on Live Venues, Powered by Pi" },
      { property: "og:description", content: "Design, target, and run AI-generated ads on stadium screens, arena LEDs and global billboards. Settled in Pi." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen text-foreground">
      <Nav />
      <Hero />
      <Ticker />
      <HowItWorks />
      <Venues />
      <PiSection />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/40 border-b border-border">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-lg bg-[image:var(--gradient-neon)] glow-indigo grid place-items-center font-bold">π</span>
          <span className="font-semibold tracking-tight">PiBoards</span>
        </a>
        <nav className="hidden md:flex gap-8 text-sm text-muted-foreground">
          <a href="#how" className="hover:text-foreground transition">How it works</a>
          <a href="#venues" className="hover:text-foreground transition">Venues</a>
          <a href="#pi" className="hover:text-foreground transition">Pi Network</a>
          <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
        </nav>
        <PiAuthButton />
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img src={heroStadium} alt="" width={1920} height={1280} className="h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      </div>

      <div className="mx-auto max-w-7xl px-6 pt-24 pb-32 md:pt-32 md:pb-40">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 backdrop-blur px-3 py-1 text-xs text-muted-foreground mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" style={{ animation: "pulse-neon 1.6s ease-in-out infinite" }} />
          Live on 12,400+ screens worldwide
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] max-w-5xl">
          Run ads on every <span className="text-gradient-neon">stadium</span>,<br />
          paid in <span className="text-gradient-neon">Pi</span>.
        </h1>

        <p className="mt-8 max-w-2xl text-lg md:text-xl text-muted-foreground">
          PiBoards turns a prompt into a broadcast-ready ad and ships it to LED ribbons,
          jumbotrons, arena facades, and street billboards — auctioned in real time by AI,
          settled instantly through the Pi Network.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <a href="#cta" className="px-6 py-3 rounded-full bg-[image:var(--gradient-neon)] font-medium text-primary-foreground glow-pink hover:opacity-90 transition">
            Start with 100 π
          </a>
          <a href="#how" className="px-6 py-3 rounded-full border border-border bg-card/40 backdrop-blur font-medium hover:bg-card transition">
            See how it works →
          </a>
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl">
          {[
            ["12.4k", "Screens"],
            ["83", "Countries"],
            ["410M", "Weekly impressions"],
            ["~0.4s", "AI render time"],
          ].map(([n, l]) => (
            <div key={l}>
              <div className="text-3xl md:text-4xl font-bold text-gradient-neon">{n}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Ticker() {
  const items = [
    "SoFi Stadium · Los Angeles",
    "Camp Nou · Barcelona",
    "Tokyo Dome · Tokyo",
    "O2 Arena · London",
    "Maracanã · Rio",
    "MetLife Stadium · NJ",
    "Allianz Arena · Munich",
    "Marina Bay · Singapore",
    "Madison Square Garden · NYC",
    "Stade de France · Paris",
  ];
  const row = [...items, ...items];
  return (
    <div className="border-y border-border bg-card/30 backdrop-blur overflow-hidden py-5">
      <div className="flex gap-12 whitespace-nowrap font-mono text-sm text-muted-foreground" style={{ animation: "ticker 40s linear infinite", width: "max-content" }}>
        {row.map((v, i) => (
          <span key={i} className="flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Prompt the AI", d: "Describe your brand, your audience, your moment. The AI drafts copy, motion frames, and a stadium-ready spot in seconds." },
    { n: "02", t: "Target a venue", d: "Filter by sport, country, crowd size, time-of-game, even weather. Bid live or schedule weeks ahead." },
    { n: "03", t: "Go live in π", d: "Pay in Pi. The campaign auto-deploys to screens, syncs to broadcast windows, and reports impressions on-chain." },
  ];
  return (
    <section id="how" className="mx-auto max-w-7xl px-6 py-28">
      <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
        <h2 className="text-4xl md:text-6xl font-bold max-w-2xl">From a sentence to a sold-out stadium.</h2>
        <p className="text-muted-foreground max-w-sm">An end-to-end pipeline that used to take an agency three weeks — now a coffee break.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((s) => (
          <div key={s.n} className="group relative rounded-2xl border border-border bg-card/60 backdrop-blur p-8 hover:border-primary transition">
            <div className="font-mono text-sm text-accent">{s.n}</div>
            <h3 className="mt-4 text-2xl font-semibold">{s.t}</h3>
            <p className="mt-3 text-muted-foreground leading-relaxed">{s.d}</p>
            <div className="absolute inset-x-0 bottom-0 h-px bg-[image:var(--gradient-neon)] opacity-0 group-hover:opacity-100 transition" />
          </div>
        ))}
      </div>
    </section>
  );
}

function Venues() {
  return (
    <section id="venues" className="mx-auto max-w-7xl px-6 py-28">
      <div className="grid md:grid-cols-2 gap-8 items-stretch">
        <div className="relative rounded-3xl overflow-hidden border border-border group">
          <img src={cityBillboards} alt="Global outdoor billboards" loading="lazy" width={1600} height={1024} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          <div className="absolute bottom-0 p-8">
            <div className="font-mono text-xs uppercase tracking-widest text-accent">Outdoor · Global</div>
            <h3 className="mt-2 text-3xl font-bold">Times Square to Shibuya</h3>
            <p className="mt-2 text-muted-foreground max-w-md">Programmatic access to 9,800+ digital out-of-home screens in 60 cities.</p>
          </div>
        </div>
        <div className="relative rounded-3xl overflow-hidden border border-border group">
          <img src={arenaLed} alt="Arena courtside LED ribbon" loading="lazy" width={1280} height={800} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          <div className="absolute bottom-0 p-8">
            <div className="font-mono text-xs uppercase tracking-widest text-accent">Live Sports · 24 leagues</div>
            <h3 className="mt-2 text-3xl font-bold">Courtside, pitchside, ringside</h3>
            <p className="mt-2 text-muted-foreground max-w-md">Slot into LED ribbons synced with the game clock — own the replay.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function PiSection() {
  return (
    <section id="pi" className="relative py-28">
      <div className="absolute inset-0 -z-10 opacity-50" style={{ background: "var(--gradient-arena)" }} />
      <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-[1.2fr_1fr] gap-16 items-center">
        <div>
          <div className="font-mono text-sm text-accent uppercase tracking-widest">Pi Network · Native</div>
          <h2 className="mt-3 text-4xl md:text-6xl font-bold">Settled in <span className="text-gradient-neon">π</span>, transparent on-chain.</h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl">
            Every impression, every bid, every payout is anchored to the Pi Network.
            Connect your Pi wallet once — the AI auctioneer handles the rest, 24/7.
          </p>
          <ul className="mt-8 space-y-3 text-muted-foreground">
            {[
              "Sign in with your Pi identity",
              "Pay-per-impression denominated in π",
              "Smart-contract escrow until the screen confirms playback",
              "Audit log readable by any pioneer",
            ].map((t) => (
              <li key={t} className="flex gap-3"><span className="text-accent">→</span>{t}</li>
            ))}
          </ul>
        </div>

        <div className="relative rounded-3xl border border-border bg-card/70 backdrop-blur p-8 glow-indigo">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
            <span>CAMPAIGN_ID 0x4f2a…91c</span>
            <span className="text-accent">● LIVE</span>
          </div>
          <div className="mt-6 text-5xl font-bold text-gradient-neon">128.40 π</div>
          <div className="text-sm text-muted-foreground">spent · this hour</div>

          <div className="mt-8 space-y-3 font-mono text-sm">
            {[
              ["21:04:12", "MetLife · NJ", "+0.82 π"],
              ["21:04:09", "O2 · London", "+0.41 π"],
              ["21:04:07", "Shibuya Crossing", "+0.18 π"],
              ["21:04:04", "Camp Nou · BCN", "+1.20 π"],
            ].map(([t, v, p]) => (
              <div key={t} className="flex items-center justify-between rounded-lg bg-background/40 px-3 py-2 border border-border">
                <span className="text-muted-foreground">{t}</span>
                <span className="flex-1 ml-4">{v}</span>
                <span className="text-accent">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    { name: "Pioneer", price: "10", desc: "Test a creative on 5 screens for a single matchday.", perks: ["AI ad generator", "5 screen impressions", "Basic analytics"] },
    { name: "Stadium", price: "500", desc: "Run a full campaign across a regional league.", perks: ["Unlimited AI renders", "Up to 200 venues", "Live bidding engine", "Pi wallet payouts"], featured: true },
    { name: "Global", price: "Custom", desc: "World-cup-grade reach, multi-language, broadcast sync.", perks: ["12,000+ venues", "Dedicated AI tuning", "On-chain audit dashboard", "24/7 ops desk"] },
  ];
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 py-28">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-bold">Priced like the future, paid in π.</h2>
        <p className="mt-4 text-muted-foreground">No agency fees. No CPM games. You pay what the screen costs, plus a fair AI fee.</p>
      </div>
      <div className="mt-14 grid md:grid-cols-3 gap-6">
        {tiers.map((t) => (
          <div key={t.name} className={`relative rounded-2xl border p-8 backdrop-blur transition ${t.featured ? "border-transparent bg-card glow-pink" : "border-border bg-card/50 hover:border-primary"}`}>
            {t.featured && (
              <div className="absolute inset-0 -z-10 rounded-2xl p-px bg-[image:var(--gradient-neon)]">
                <div className="h-full w-full rounded-2xl bg-card" />
              </div>
            )}
            <div className="font-mono text-xs uppercase tracking-widest text-accent">{t.name}</div>
            <div className="mt-4 flex items-baseline gap-1">
              {t.price === "Custom" ? <span className="text-4xl font-bold">Custom</span> : (<><span className="text-5xl font-bold">{t.price}</span><span className="text-xl text-muted-foreground">π / day</span></>)}
            </div>
            <p className="mt-3 text-muted-foreground">{t.desc}</p>
            <ul className="mt-6 space-y-2 text-sm">
              {t.perks.map((p) => <li key={p} className="flex gap-2"><span className="text-accent">✓</span>{p}</li>)}
            </ul>
            <a href="#cta" className={`mt-8 inline-block w-full text-center px-4 py-2.5 rounded-full font-medium transition ${t.featured ? "bg-[image:var(--gradient-neon)] text-primary-foreground hover:opacity-90" : "border border-border hover:bg-secondary"}`}>
              Choose {t.name}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="cta" className="mx-auto max-w-5xl px-6 py-28">
      <div className="relative rounded-[2rem] border border-border bg-card/70 backdrop-blur overflow-hidden p-12 md:p-16 text-center">
        <div className="absolute inset-0 -z-10 opacity-60" style={{ background: "var(--gradient-arena)" }} />
        <h2 className="text-4xl md:text-6xl font-bold">Your brand. Their screen. <span className="text-gradient-neon">Tonight.</span></h2>
        <p className="mt-5 text-muted-foreground max-w-xl mx-auto">Join the waitlist and we'll mint the first 100 π of impressions on the house.</p>
        <form className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            required
            placeholder="you@brand.com"
            className="flex-1 px-5 py-3 rounded-full bg-background/60 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button type="submit" className="px-6 py-3 rounded-full bg-[image:var(--gradient-neon)] font-medium text-primary-foreground glow-pink hover:opacity-90 transition">
            Get early access
          </button>
        </form>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col md:flex-row justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded bg-[image:var(--gradient-neon)] grid place-items-center text-xs font-bold">π</span>
          <span>PiBoards © 2026 — built on the Pi Network.</span>
        </div>
        <div className="flex gap-6 font-mono">
          <a href="#" className="hover:text-foreground">Docs</a>
          <a href="#" className="hover:text-foreground">Pi SDK</a>
          <a href="#" className="hover:text-foreground">Terms</a>
        </div>
      </div>
    </footer>
  );
}
