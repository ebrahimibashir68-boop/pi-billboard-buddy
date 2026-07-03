import { useCallback, useEffect, useState } from "react";
import { Settings, Wallet, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authenticateWithPi } from "@/lib/pi-sdk";

type Settings = {
  desktopSite: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  notifications: boolean;
  sandbox: boolean;
};

const DEFAULTS: Settings = {
  desktopSite: false,
  reduceMotion: false,
  highContrast: false,
  notifications: false,
  sandbox: false,
};

const STORAGE_KEY = "piboards.settings.v1";
const WALLET_KEY = "piboards.wallet.v1";

function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULTS;
  }
}

function applySettings(s: Settings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("motion-reduce", s.reduceMotion);
  root.classList.toggle("contrast-more", s.highContrast);

  const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute(
      "content",
      s.desktopSite ? "width=1280" : "width=device-width, initial-scale=1",
    );
  }
}

export function SettingsMenu() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [wallet, setWallet] = useState<string | null>(null);
  const [walletBusy, setWalletBusy] = useState(false);

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    applySettings(s);
    try {
      setWallet(window.localStorage.getItem(WALLET_KEY));
    } catch {
      /* ignore */
    }
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      applySettings(next);
      return next;
    });
  }, []);

  const connectWallet = useCallback(async () => {
    setWalletBusy(true);
    try {
      const res = await authenticateWithPi();
      const label = res.user?.username ? `@${res.user.username}` : res.user?.uid ?? "connected";
      window.localStorage.setItem(WALLET_KEY, label);
      setWallet(label);
    } catch (e) {
      console.error("[Pi wallet]", e);
    } finally {
      setWalletBusy(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    window.localStorage.removeItem(WALLET_KEY);
    setWallet(null);
  }, []);

  const resetAll = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setSettings(DEFAULTS);
    applySettings(DEFAULTS);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Open settings"
          className="h-10 w-10 grid place-items-center rounded-full border border-border bg-background/60 backdrop-blur hover:bg-secondary transition"
        >
          <Settings className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Site settings</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={settings.desktopSite}
          onCheckedChange={(v) => update({ desktopSite: Boolean(v) })}
        >
          Desktop site
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={settings.reduceMotion}
          onCheckedChange={(v) => update({ reduceMotion: Boolean(v) })}
        >
          Reduce motion
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={settings.highContrast}
          onCheckedChange={(v) => update({ highContrast: Boolean(v) })}
        >
          High contrast
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>App</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={settings.notifications}
          onCheckedChange={(v) => update({ notifications: Boolean(v) })}
        >
          Campaign notifications
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={settings.sandbox}
          onCheckedChange={(v) => update({ sandbox: Boolean(v) })}
        >
          Pi sandbox mode
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Pi wallet</DropdownMenuLabel>
        {wallet ? (
          <>
            <div className="px-2 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-accent" />
              Connected as <span className="text-foreground font-medium">{wallet}</span>
            </div>
            <DropdownMenuItem onSelect={disconnectWallet}>
              Disconnect wallet
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem
            disabled={walletBusy}
            onSelect={(e) => {
              e.preventDefault();
              void connectWallet();
            }}
          >
            <Wallet className="h-4 w-4" />
            {walletBusy ? "Connecting…" : "Connect Pi wallet"}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={resetAll}>Reset to defaults</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}