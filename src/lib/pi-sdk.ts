// Minimal Pi Browser SDK typings + loader.
// Docs: https://pi-apps.github.io/pi-sdk-docs/quick-start/genai/Authentication

export type PiAuthResult = {
  accessToken: string;
  user: { uid: string; username: string };
};

export type PiPaymentData = {
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
};

export type PiPaymentCallbacks = {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, payment?: unknown) => void;
};

type PiSDK = {
  init: (opts: { version: string; sandbox?: boolean }) => Promise<void> | void;
  authenticate: (
    scopes: string[],
    onIncompletePaymentFound: (payment: unknown) => void,
  ) => Promise<PiAuthResult>;
  createPayment: (
    paymentData: PiPaymentData,
    callbacks: PiPaymentCallbacks,
  ) => void;
};

declare global {
  interface Window {
    Pi?: PiSDK;
  }
}

const SDK_URL = "https://sdk.minepi.com/pi-sdk.js";
let loadPromise: Promise<PiSDK> | null = null;

function loadScript(): Promise<PiSDK> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Pi SDK requires a browser environment"));
  }
  if (window.Pi) return Promise.resolve(window.Pi);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<PiSDK>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SDK_URL}"]`,
    );
    const script = existing ?? document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => {
      if (window.Pi) resolve(window.Pi);
      else reject(new Error("Pi SDK failed to attach to window"));
    };
    script.onerror = () => reject(new Error("Failed to load Pi SDK script"));
    if (!existing) document.head.appendChild(script);
  });

  return loadPromise;
}

let initPromise: Promise<PiSDK> | null = null;

export function getPi(): Promise<PiSDK> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const Pi = await loadScript();
    // Pi.init may return a Promise or void — await defensively.
    const sandbox = import.meta.env.VITE_PI_SANDBOX === "true";
    await Promise.resolve(Pi.init({ version: "2.0", sandbox }));
    return Pi;
  })();
  return initPromise;
}

export async function authenticateWithPi(): Promise<PiAuthResult> {
  const Pi = await getPi();
  return Pi.authenticate(["username", "payments"], (payment) => {
    console.warn("[Pi] Incomplete payment found:", payment);
  });
}

export async function createPiPayment(
  paymentData: PiPaymentData,
  callbacks: PiPaymentCallbacks,
): Promise<void> {
  const Pi = await getPi();
  Pi.createPayment(paymentData, callbacks);
}