
-- More global billboard companies
INSERT INTO public.ad_partners (slug, name, description, regions, venue_categories, adapter, status, logo_emoji) VALUES
  ('ocean-outdoor', 'Ocean Outdoor', 'UK & Nordics premium DOOH — Piccadilly Lights operator.', ARRAY['europe'], ARRAY['street_billboard'], 'simulated', 'active', '🇬🇧'),
  ('global-media', 'Global (Outdoor)', 'UK roadside and rail advertising network.', ARRAY['europe'], ARRAY['street_billboard'], 'simulated', 'active', '🚆'),
  ('intersection', 'Intersection', 'US urban digital OOH including LinkNYC kiosks.', ARRAY['north-america'], ARRAY['street_billboard'], 'simulated', 'active', '🏙️'),
  ('branded-cities', 'Branded Cities', 'Iconic spectaculars across North America.', ARRAY['north-america'], ARRAY['street_billboard'], 'simulated', 'active', '✨'),
  ('daktronics', 'Daktronics Networks', 'Stadium and jumbotron LED systems worldwide.', ARRAY['north-america','europe','asia'], ARRAY['stadium_jumbotron','arena_led_ribbon'], 'simulated', 'active', '🏟️'),
  ('apg-sga', 'APG|SGA', 'Switzerland OOH leader.', ARRAY['europe'], ARRAY['street_billboard'], 'simulated', 'active', '🇨🇭'),
  ('talon', 'Talon Outdoor', 'Global independent OOH specialist.', ARRAY['europe','north-america','asia'], ARRAY['street_billboard'], 'simulated', 'active', '🦅'),
  ('pattison', 'Pattison Outdoor', 'Canada largest outdoor advertising network.', ARRAY['north-america'], ARRAY['street_billboard'], 'simulated', 'active', '🇨🇦'),
  ('astral', 'Astral Out-of-Home', 'Bell Media Canadian DOOH.', ARRAY['north-america'], ARRAY['street_billboard'], 'simulated', 'active', '🌟'),
  ('tam-media', 'TAM Media', 'Latin America OOH network.', ARRAY['south-america'], ARRAY['street_billboard'], 'simulated', 'active', '🌎'),
  ('interbest', 'Interbest', 'Netherlands premium roadside.', ARRAY['europe'], ARRAY['street_billboard'], 'simulated', 'active', '🇳🇱'),
  ('alma-media', 'Alma Media Outdoor', 'Nordic outdoor advertising.', ARRAY['europe'], ARRAY['street_billboard'], 'simulated', 'active', '❄️'),
  ('adshel', 'Adshel MENA', 'Middle East and North Africa OOH.', ARRAY['africa'], ARRAY['street_billboard'], 'simulated', 'active', '🕌'),
  ('focus-elevator', 'Focus Elevator Media', 'Elevator screens across Chinese tier-1 cities.', ARRAY['asia'], ARRAY['street_billboard'], 'simulated', 'active', '🛗'),
  ('jcdecaux-airports', 'JCDecaux Airports', 'Airport advertising in 200+ terminals worldwide.', ARRAY['europe','north-america','asia','south-america','africa'], ARRAY['street_billboard'], 'simulated', 'active', '✈️')
ON CONFLICT (slug) DO NOTHING;

-- Billboard inventory (real-world famous locations)
CREATE TABLE public.billboard_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.ad_partners(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  region text NOT NULL,
  venue_category text NOT NULL,
  latitude numeric(9,6),
  longitude numeric(9,6),
  width_m numeric(6,2),
  height_m numeric(6,2),
  resolution text,
  daily_impressions integer NOT NULL DEFAULT 0,
  hourly_rate_pi numeric(10,2) NOT NULL DEFAULT 10.0,
  slot_seconds integer NOT NULL DEFAULT 15,
  description text,
  hero_emoji text DEFAULT '📍',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.billboard_locations TO authenticated, anon;
GRANT ALL ON public.billboard_locations TO service_role;
ALTER TABLE public.billboard_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read locations" ON public.billboard_locations FOR SELECT USING (true);

-- Location bookings
CREATE TABLE public.location_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  creative_id uuid REFERENCES public.campaign_creatives(id) ON DELETE SET NULL,
  location_id uuid NOT NULL REFERENCES public.billboard_locations(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.ad_partners(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  hours_booked integer NOT NULL,
  quoted_price_pi numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','running','completed','cancelled')),
  partner_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.location_bookings TO authenticated;
GRANT ALL ON public.location_bookings TO service_role;
ALTER TABLE public.location_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "advertiser own bookings" ON public.location_bookings FOR SELECT
  USING (auth.uid() = advertiser_id);
CREATE POLICY "advertiser create bookings" ON public.location_bookings FOR INSERT
  WITH CHECK (auth.uid() = advertiser_id);
CREATE POLICY "advertiser cancel bookings" ON public.location_bookings FOR UPDATE
  USING (auth.uid() = advertiser_id);
CREATE POLICY "partner admin reads bookings" ON public.location_bookings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.partner_admin_assignments pa
                 WHERE pa.user_id = auth.uid() AND pa.partner_id = location_bookings.partner_id));
CREATE POLICY "partner admin decides bookings" ON public.location_bookings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.partner_admin_assignments pa
                 WHERE pa.user_id = auth.uid() AND pa.partner_id = location_bookings.partner_id));

-- Proof-of-play log
CREATE TABLE public.plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.location_bookings(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.billboard_locations(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.ad_partners(id) ON DELETE CASCADE,
  advertiser_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  played_at timestamptz NOT NULL DEFAULT now(),
  duration_seconds integer NOT NULL DEFAULT 15,
  impressions integer NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT ON public.plays TO authenticated;
GRANT ALL ON public.plays TO service_role;
ALTER TABLE public.plays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "advertiser reads own plays" ON public.plays FOR SELECT
  USING (auth.uid() = advertiser_id);
CREATE POLICY "partner reads assigned plays" ON public.plays FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.partner_admin_assignments pa
                 WHERE pa.user_id = auth.uid() AND pa.partner_id = plays.partner_id));

-- Invoices
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.location_bookings(id) ON DELETE CASCADE,
  advertiser_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.ad_partners(id) ON DELETE CASCADE,
  number text NOT NULL UNIQUE,
  subtotal_pi numeric(12,2) NOT NULL,
  platform_fee_pi numeric(12,2) NOT NULL,
  total_pi numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'issued' CHECK (status IN ('issued','paid','void')),
  issued_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "advertiser reads own invoices" ON public.invoices FOR SELECT
  USING (auth.uid() = advertiser_id);
CREATE POLICY "advertiser pays own invoices" ON public.invoices FOR UPDATE
  USING (auth.uid() = advertiser_id);
CREATE POLICY "partner reads invoices" ON public.invoices FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.partner_admin_assignments pa
                 WHERE pa.user_id = auth.uid() AND pa.partner_id = invoices.partner_id));

CREATE INDEX idx_locations_partner ON public.billboard_locations(partner_id);
CREATE INDEX idx_locations_region ON public.billboard_locations(region);
CREATE INDEX idx_bookings_advertiser ON public.location_bookings(advertiser_id);
CREATE INDEX idx_bookings_partner ON public.location_bookings(partner_id, status);
CREATE INDEX idx_plays_booking ON public.plays(booking_id);
CREATE INDEX idx_invoices_advertiser ON public.invoices(advertiser_id);

-- Seed famous billboard locations. Partner slugs referenced must already exist.
INSERT INTO public.billboard_locations (partner_id, slug, name, city, country, region, venue_category, latitude, longitude, width_m, height_m, resolution, daily_impressions, hourly_rate_pi, slot_seconds, description, hero_emoji)
SELECT p.id, v.slug, v.name, v.city, v.country, v.region, v.venue_category, v.lat, v.lng, v.w, v.h, v.res, v.imp, v.rate, v.slot, v.description, v.emoji
FROM (VALUES
  ('spectacular-nyc',  'times-square-one',      'One Times Square Spectacular',    'New York',       'USA',           'north-america', 'street_billboard',   40.756100::numeric, -73.986200::numeric,  23.16::numeric, 100.58::numeric, '2688x11648', 350000, 250.0::numeric, 15, 'The New Year Eve ball drop tower spectacular.', '🗽'),
  ('spectacular-nyc',  'times-square-nasdaq',   'Nasdaq Tower Times Square',        'New York',       'USA',           'north-america', 'street_billboard',   40.756400::numeric, -73.986000::numeric,  36.60::numeric,  27.40::numeric, '10000x2000', 280000, 220.0::numeric, 15, 'Curved 7-story LED wrapping the Nasdaq building.', '📈'),
  ('intersection',     'linknyc-manhattan',     'LinkNYC Kiosk Network — Midtown',  'New York',       'USA',           'north-america', 'street_billboard',   40.754000::numeric, -73.984000::numeric,   1.20::numeric,   2.10::numeric, '1080x1920',   85000,  35.0::numeric, 15, '2000+ kiosks across the five boroughs.', '📶'),
  ('branded-cities',   'sunset-strip-la',       'Sunset Strip Spectacular',         'Los Angeles',    'USA',           'north-america', 'street_billboard',   34.089700::numeric,-118.385500::numeric,  15.20::numeric,  10.60::numeric, '2560x1440',  120000, 120.0::numeric, 15, 'Hollywood West Sunset Boulevard iconic display.', '🌴'),
  ('lamar',            'las-vegas-strip',       'Las Vegas Strip Digital',          'Las Vegas',      'USA',           'north-america', 'street_billboard',   36.114600::numeric,-115.172800::numeric,  14.00::numeric,   8.00::numeric, '1920x1080',  180000, 140.0::numeric, 15, 'High-traffic Strip roadside display.', '🎰'),
  ('daktronics',       'sofi-jumbotron',        'SoFi Stadium Infinity Screen',     'Inglewood',      'USA',           'north-america', 'stadium_jumbotron',  33.953500::numeric,-118.339200::numeric,  36.00::numeric,  24.00::numeric, '4K',          70000, 300.0::numeric, 30, 'Center-hung dual-sided oculus jumbotron.', '🏟️'),
  ('daktronics',       'msg-jumbotron',         'Madison Square Garden Jumbotron',  'New York',       'USA',           'north-america', 'stadium_jumbotron',  40.750500::numeric, -73.993400::numeric,  14.00::numeric,  10.00::numeric, '4K',          20000, 260.0::numeric, 30, 'MSG center-hung LED cube.', '🏀'),
  ('ocean-outdoor',    'piccadilly-lights',     'Piccadilly Lights',                'London',         'UK',            'europe',        'street_billboard',   51.510100::numeric,  -0.134200::numeric,  30.00::numeric,  10.00::numeric, '10752x3072', 220000, 230.0::numeric, 10, 'Iconic curved LED at Piccadilly Circus.', '🇬🇧'),
  ('global-media',     'london-cromination',    'Cromination Cromwell Road',        'London',         'UK',            'europe',        'street_billboard',   51.494000::numeric,  -0.183000::numeric,   6.00::numeric,   3.00::numeric, '2560x1440',   90000,  45.0::numeric, 10, 'West London arterial roadside.', '🚗'),
  ('jcdecaux',         'champs-elysees',        'Champs-Élysées Digital',           'Paris',          'France',        'europe',        'street_billboard',   48.869500::numeric,   2.307800::numeric,   3.00::numeric,   4.00::numeric, '1080x1920',  160000, 140.0::numeric, 10, 'Premium avenue digital furniture.', '🇫🇷'),
  ('stroer',           'berlin-alexanderplatz', 'Alexanderplatz Mega Screen',       'Berlin',         'Germany',       'europe',        'street_billboard',   52.521900::numeric,  13.413200::numeric,  12.00::numeric,   8.00::numeric, '2048x1152',  110000,  95.0::numeric, 10, 'East Berlin transit hub spectacular.', '🇩🇪'),
  ('apg-sga',          'zurich-hb',             'Zürich HB Digital Wall',           'Zürich',         'Switzerland',   'europe',        'street_billboard',   47.378200::numeric,   8.540300::numeric,   9.00::numeric,   3.00::numeric, '3840x1080',   70000,  85.0::numeric, 10, 'Main station concourse LED wall.', '🇨🇭'),
  ('focus-media',      'shanghai-nanjing-rd',   'Nanjing Road Mega LED',            'Shanghai',       'China',         'asia',          'street_billboard',   31.235400::numeric, 121.475700::numeric,  40.00::numeric,  20.00::numeric, '8K',         500000, 260.0::numeric, 15, 'Waitan-facing pedestrian street spectacular.', '🇨🇳'),
  ('oohmedia',         'sydney-george-st',      'George Street Digital',            'Sydney',         'Australia',     'asia',          'street_billboard', -33.868900::numeric, 151.207300::numeric,   6.00::numeric,   9.00::numeric, '1440x2160',   95000, 110.0::numeric, 10, 'CBD pedestrian corridor.', '🇦🇺'),
  ('jcdecaux',         'shibuya-crossing',      'Shibuya Crossing Q-Front',         'Tokyo',          'Japan',         'asia',          'street_billboard',   35.659500::numeric, 139.700600::numeric,  20.00::numeric,  30.00::numeric, '4K',         600000, 260.0::numeric, 15, 'World famous scramble crossing screen.', '🇯🇵'),
  ('focus-media',      'ginza-yon-chome',       'Ginza Yon-chome Sony Building',    'Tokyo',          'Japan',         'asia',          'street_billboard',   35.671700::numeric, 139.764700::numeric,  10.00::numeric,  15.00::numeric, '4K',         180000, 180.0::numeric, 15, 'Ginza luxury district LED.', '👘'),
  ('jcdecaux',         'hk-nathan-road',        'Nathan Road Neon Cluster',         'Hong Kong',      'Hong Kong',     'asia',          'street_billboard',   22.298000::numeric, 114.172100::numeric,   8.00::numeric,  12.00::numeric, '1440x2160',  200000, 150.0::numeric, 10, 'TST tourist corridor.', '🇭🇰'),
  ('focus-media',      'hk-k11-musea',          'K11 Musea Facade',                 'Hong Kong',      'Hong Kong',     'asia',          'street_billboard',   22.294400::numeric, 114.173100::numeric,  25.00::numeric,  70.00::numeric, '4K',         160000, 220.0::numeric, 15, 'Victoria Harbour waterfront art mall facade.', '🎨'),
  ('adshel',           'burj-khalifa-facade',   'Burj Khalifa LED Facade',          'Dubai',          'UAE',           'africa',        'street_billboard',   25.197100::numeric,  55.274400::numeric,  60.00::numeric, 250.00::numeric, 'Facade-mapped',400000, 320.0::numeric, 30, 'World tallest tower LED facade.', '🕌'),
  ('adshel',           'dubai-sheikh-zayed',    'Sheikh Zayed Road Digital',        'Dubai',          'UAE',           'africa',        'street_billboard',   25.194200::numeric,  55.269800::numeric,  14.00::numeric,   8.00::numeric, '1920x1080',  240000, 180.0::numeric, 10, 'Downtown Dubai arterial roadside.', '🛣️'),
  ('tam-media',        'sao-paulo-paulista',    'Avenida Paulista Spectacular',     'São Paulo',      'Brazil',        'south-america', 'street_billboard',  -23.561400::numeric, -46.655800::numeric,  12.00::numeric,   8.00::numeric, '2560x1440',  150000, 100.0::numeric, 10, 'Financial district digital spectacular.', '🇧🇷'),
  ('pattison',         'toronto-yonge-dundas',  'Yonge-Dundas Square',              'Toronto',        'Canada',        'north-america', 'street_billboard',   43.656200::numeric, -79.380600::numeric,  10.00::numeric,  15.00::numeric, '2160x3840',  180000, 130.0::numeric, 10, 'Downtown Toronto pedestrian square.', '🇨🇦'),
  ('jcdecaux-airports','lhr-t5-arrivals',       'Heathrow Terminal 5 Arrivals',     'London',         'UK',            'europe',        'street_billboard',   51.470200::numeric,  -0.454300::numeric,   5.00::numeric,   3.00::numeric, '3840x2160',   75000, 140.0::numeric, 10, 'Premium international arrivals hall.', '✈️'),
  ('jcdecaux-airports','jfk-t4-departures',     'JFK Terminal 4 Departures',        'New York',       'USA',           'north-america', 'street_billboard',   40.643100::numeric, -73.782300::numeric,   4.00::numeric,   2.30::numeric, '3840x2160',   80000, 130.0::numeric, 10, 'International terminal departures gate.', '🛫')
) AS v(partner_slug, slug, name, city, country, region, venue_category, lat, lng, w, h, res, imp, rate, slot, description, emoji)
JOIN public.ad_partners p ON p.slug = v.partner_slug
ON CONFLICT (slug) DO NOTHING;
