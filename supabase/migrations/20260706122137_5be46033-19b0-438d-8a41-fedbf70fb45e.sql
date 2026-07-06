
-- Campaigns
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand text NOT NULL,
  pitch text NOT NULL,
  ad_type text NOT NULL CHECK (ad_type IN ('text','image','both')),
  venues text[] NOT NULL DEFAULT '{}',
  regions text[] NOT NULL DEFAULT '{}',
  budget_pi numeric(18,4) NOT NULL CHECK (budget_pi > 0),
  spent_pi numeric(18,4) NOT NULL DEFAULT 0,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','funded','running','settled','refunded','failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own campaigns" ON public.campaigns FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Creatives
CREATE TABLE public.campaign_creatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  headline text,
  body text,
  image_url text,
  model text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_creatives TO authenticated;
GRANT ALL ON public.campaign_creatives TO service_role;
ALTER TABLE public.campaign_creatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own creatives" ON public.campaign_creatives FOR ALL
  USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.owner_id = auth.uid()));

-- Contracts (Stellar testnet escrow)
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL UNIQUE REFERENCES public.campaigns(id) ON DELETE CASCADE,
  escrow_public_key text NOT NULL,
  network text NOT NULL DEFAULT 'stellar-testnet',
  funding_tx_hash text,
  terms_hash text NOT NULL,
  terms_json jsonb NOT NULL,
  state text NOT NULL DEFAULT 'draft' CHECK (state IN ('draft','funded','running','settled','refunded','failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO authenticated;
GRANT ALL ON public.contracts TO service_role;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own contracts" ON public.contracts FOR ALL
  USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.owner_id = auth.uid()));

-- Contract events (fund, claim, refund, etc.)
CREATE TABLE public.contract_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  amount_pi numeric(18,4),
  tx_hash text,
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.contract_events TO authenticated;
GRANT ALL ON public.contract_events TO service_role;
ALTER TABLE public.contract_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own events" ON public.contract_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.contracts co
    JOIN public.campaigns ca ON ca.id = co.campaign_id
    WHERE co.id = contract_id AND ca.owner_id = auth.uid()
  ));

-- Schedule slots (AI-planned billboard plays)
CREATE TABLE public.schedule_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  venue_id text NOT NULL,
  venue_name text NOT NULL,
  region text,
  slot_start timestamptz NOT NULL,
  duration_sec integer NOT NULL,
  cost_pi numeric(18,4) NOT NULL,
  impressions_est integer NOT NULL DEFAULT 0,
  played boolean NOT NULL DEFAULT false,
  played_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedule_slots TO authenticated;
GRANT ALL ON public.schedule_slots TO service_role;
ALTER TABLE public.schedule_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own slots" ON public.schedule_slots FOR ALL
  USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.owner_id = auth.uid()));

CREATE INDEX idx_slots_campaign_start ON public.schedule_slots(campaign_id, slot_start);
CREATE INDEX idx_events_contract ON public.contract_events(contract_id, created_at DESC);
