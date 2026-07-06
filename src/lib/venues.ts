// Client-safe venue inventory used by both UI and AI distribution.
export type Venue = {
  id: string;
  name: string;
  category: "stadium_jumbotron" | "arena_led_ribbon" | "street_billboard";
  region: string;
  city: string;
  slot_seconds: number;
  rate_pi_per_slot: number;
  avg_impressions_per_slot: number;
};

export const VENUES: Venue[] = [
  { id: "sofi-la", name: "SoFi Stadium", category: "stadium_jumbotron", region: "north-america", city: "Los Angeles", slot_seconds: 15, rate_pi_per_slot: 4.2, avg_impressions_per_slot: 62000 },
  { id: "metlife-nj", name: "MetLife Stadium", category: "stadium_jumbotron", region: "north-america", city: "East Rutherford", slot_seconds: 15, rate_pi_per_slot: 3.8, avg_impressions_per_slot: 58000 },
  { id: "campnou-bcn", name: "Camp Nou", category: "stadium_jumbotron", region: "europe", city: "Barcelona", slot_seconds: 15, rate_pi_per_slot: 5.0, avg_impressions_per_slot: 78000 },
  { id: "allianz-mun", name: "Allianz Arena", category: "stadium_jumbotron", region: "europe", city: "Munich", slot_seconds: 15, rate_pi_per_slot: 4.4, avg_impressions_per_slot: 65000 },
  { id: "tokyodome-tyo", name: "Tokyo Dome", category: "stadium_jumbotron", region: "asia", city: "Tokyo", slot_seconds: 15, rate_pi_per_slot: 4.0, avg_impressions_per_slot: 45000 },
  { id: "o2-lon", name: "O2 Arena", category: "arena_led_ribbon", region: "europe", city: "London", slot_seconds: 30, rate_pi_per_slot: 2.6, avg_impressions_per_slot: 19000 },
  { id: "msg-nyc", name: "Madison Square Garden", category: "arena_led_ribbon", region: "north-america", city: "New York", slot_seconds: 30, rate_pi_per_slot: 3.1, avg_impressions_per_slot: 20000 },
  { id: "maracana-rio", name: "Maracanã", category: "stadium_jumbotron", region: "south-america", city: "Rio de Janeiro", slot_seconds: 15, rate_pi_per_slot: 3.4, avg_impressions_per_slot: 71000 },
  { id: "times-sq", name: "Times Square Spectacular", category: "street_billboard", region: "north-america", city: "New York", slot_seconds: 8, rate_pi_per_slot: 1.8, avg_impressions_per_slot: 12000 },
  { id: "shibuya-jp", name: "Shibuya Crossing", category: "street_billboard", region: "asia", city: "Tokyo", slot_seconds: 8, rate_pi_per_slot: 1.6, avg_impressions_per_slot: 14000 },
  { id: "piccadilly-lon", name: "Piccadilly Lights", category: "street_billboard", region: "europe", city: "London", slot_seconds: 8, rate_pi_per_slot: 1.4, avg_impressions_per_slot: 9000 },
  { id: "marina-sg", name: "Marina Bay LEDs", category: "street_billboard", region: "asia", city: "Singapore", slot_seconds: 8, rate_pi_per_slot: 1.3, avg_impressions_per_slot: 7500 },
];

export const VENUE_CATEGORIES = [
  { id: "stadium_jumbotron", label: "Stadium jumbotrons" },
  { id: "arena_led_ribbon", label: "Arena LED ribbons" },
  { id: "street_billboard", label: "Street billboards" },
] as const;

export const REGIONS = [
  { id: "north-america", label: "North America" },
  { id: "europe", label: "Europe" },
  { id: "asia", label: "Asia" },
  { id: "south-america", label: "South America" },
] as const;

export const stellarExplorerUrl = (publicKey: string) =>
  `https://stellar.expert/explorer/testnet/account/${publicKey}`;
export const stellarTxUrl = (hash: string) =>
  `https://stellar.expert/explorer/testnet/tx/${hash}`;