
-- 1. campaign_creatives extensions
ALTER TABLE public.campaign_creatives
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'image' CHECK (kind IN ('image','text','video','template')),
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS template_id text,
  ADD COLUMN IF NOT EXISTS overlay_json jsonb NOT NULL DEFAULT '{}';

-- 2. roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','partner_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read own roles" ON public.user_roles;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- 3. ad_partners
CREATE TABLE public.ad_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  regions text[] NOT NULL DEFAULT '{}',
  venue_categories text[] NOT NULL DEFAULT '{}',
  adapter text NOT NULL DEFAULT 'simulated' CHECK (adapter IN ('simulated','broadsign','vistar','hivestack','place_exchange')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','coming_soon')),
  api_key_secret_name text,
  logo_emoji text DEFAULT '📺',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ad_partners TO authenticated, anon;
GRANT ALL ON public.ad_partners TO service_role;
ALTER TABLE public.ad_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read partners" ON public.ad_partners FOR SELECT USING (true);

-- 4. partner_registrations
CREATE TABLE public.partner_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.ad_partners(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  UNIQUE (advertiser_id, partner_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_registrations TO authenticated;
GRANT ALL ON public.partner_registrations TO service_role;
ALTER TABLE public.partner_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own registrations" ON public.partner_registrations FOR ALL
  USING (auth.uid() = advertiser_id)
  WITH CHECK (auth.uid() = advertiser_id);

-- 5. partner_admin_assignments
CREATE TABLE public.partner_admin_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.ad_partners(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, partner_id)
);
GRANT SELECT ON public.partner_admin_assignments TO authenticated;
GRANT ALL ON public.partner_admin_assignments TO service_role;
ALTER TABLE public.partner_admin_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own partner assignments" ON public.partner_admin_assignments FOR SELECT
  USING (auth.uid() = user_id);

-- 6. ad_submissions
CREATE TABLE public.ad_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  creative_id uuid NOT NULL REFERENCES public.campaign_creatives(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.ad_partners(id) ON DELETE CASCADE,
  advertiser_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_check text NOT NULL DEFAULT 'pending' CHECK (ai_check IN ('pending','passed','flagged')),
  ai_notes text,
  ai_flags text[] NOT NULL DEFAULT '{}',
  partner_review text NOT NULL DEFAULT 'pending' CHECK (partner_review IN ('pending','approved','rejected','skipped')),
  partner_notes text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.ad_submissions TO authenticated;
GRANT ALL ON public.ad_submissions TO service_role;
ALTER TABLE public.ad_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "advertiser reads own submissions" ON public.ad_submissions FOR SELECT
  USING (auth.uid() = advertiser_id);
CREATE POLICY "advertiser inserts submissions" ON public.ad_submissions FOR INSERT
  WITH CHECK (auth.uid() = advertiser_id);
CREATE POLICY "partner admin reads assigned submissions" ON public.ad_submissions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.partner_admin_assignments pa
    WHERE pa.user_id = auth.uid() AND pa.partner_id = ad_submissions.partner_id
  ));
CREATE POLICY "partner admin updates assigned submissions" ON public.ad_submissions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.partner_admin_assignments pa
    WHERE pa.user_id = auth.uid() AND pa.partner_id = ad_submissions.partner_id
  ));

-- 7. seed partners
INSERT INTO public.ad_partners (slug, name, description, regions, venue_categories, adapter, status, logo_emoji) VALUES
  ('jcdecaux', 'JCDecaux', 'Global out-of-home leader, street furniture and transit.', ARRAY['europe','asia','north-america','south-america'], ARRAY['street_billboard','arena_led_ribbon'], 'simulated', 'active', '🌍'),
  ('clear-channel', 'Clear Channel Outdoor', 'Digital billboards across North America and Europe.', ARRAY['north-america','europe'], ARRAY['street_billboard'], 'simulated', 'active', '📡'),
  ('lamar', 'Lamar Advertising', 'US highway and roadside billboards.', ARRAY['north-america'], ARRAY['street_billboard'], 'simulated', 'active', '🛣️'),
  ('outfront', 'Outfront Media', 'Urban and transit displays in the US.', ARRAY['north-america'], ARRAY['street_billboard','arena_led_ribbon'], 'simulated', 'active', '🚇'),
  ('stroer', 'Ströer', 'Leading OOH network in Germany and DACH.', ARRAY['europe'], ARRAY['street_billboard'], 'simulated', 'active', '🇩🇪'),
  ('oohmedia', 'oOh!media', 'Australia and New Zealand outdoor network.', ARRAY['asia'], ARRAY['street_billboard','arena_led_ribbon'], 'simulated', 'active', '🇦🇺'),
  ('focus-media', 'Focus Media', 'China elevator and building screens.', ARRAY['asia'], ARRAY['street_billboard'], 'simulated', 'active', '🇨🇳'),
  ('broadsign-reach', 'Broadsign Reach', 'Programmatic DOOH SSP.', ARRAY['north-america','europe','asia','south-america'], ARRAY['street_billboard','arena_led_ribbon','stadium_jumbotron'], 'broadsign', 'active', '⚡'),
  ('vistar', 'Vistar Media', 'Programmatic DOOH marketplace.', ARRAY['north-america','europe','asia'], ARRAY['street_billboard','arena_led_ribbon'], 'vistar', 'active', '🎯'),
  ('hivestack', 'Hivestack', 'Global DOOH programmatic platform.', ARRAY['north-america','europe','asia','south-america'], ARRAY['street_billboard','stadium_jumbotron'], 'hivestack', 'active', '🐝'),
  ('place-exchange', 'Place Exchange', 'DOOH SSP for omnichannel demand.', ARRAY['north-america'], ARRAY['street_billboard'], 'place_exchange', 'active', '🔁'),
  ('spectacular-nyc', 'Times Square Spectacular Co.', 'Iconic Times Square LED spectaculars.', ARRAY['north-america'], ARRAY['street_billboard'], 'simulated', 'active', '🗽')
ON CONFLICT (slug) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_registrations_advertiser ON public.partner_registrations(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_submissions_advertiser ON public.ad_submissions(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_submissions_partner ON public.ad_submissions(partner_id, partner_review);
