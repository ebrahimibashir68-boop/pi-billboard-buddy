import { useCallback, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createPiPayment } from "@/lib/pi-sdk";
import {
  approvePiPayment,
  completePiPayment,
} from "@/lib/pi-payments.functions";

type Props = {
  amount: number;
  memo: string;
  metadata?: Record<string, unknown>;
  label?: string;
  className?: string;
};

type Status = "idle" | "pending" | "success" | "error";

export function PiPayButton({
  amount,
  memo,
  metadata = {},
  label,
  className,
}: Props) {
  const approve = useServerFn(approvePiPayment);
  const complete = useServerFn(completePiPayment);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const pay = useCallback(async () => {
    setStatus("pending");
    setMessage(null);
    try {
      await createPiPayment(
        { amount, memo, metadata },
        {
          onReadyForServerApproval: async (paymentId) => {
            const r = await approve({ data: { paymentId } });
            if (!r.ok) {
              setStatus("error");
              setMessage(r.error);
            }
          },
          onReadyForServerCompletion: async (paymentId, txid) => {
            const r = await complete({ data: { paymentId, txid } });
            if (!r.ok) {
              setStatus("error");
              setMessage(r.error);
            } else {
              setStatus("success");
              setMessage(`Paid ${amount} π · txid ${txid.slice(0, 8)}…`);
            }
          },
          onCancel: () => {
            setStatus("idle");
            setMessage("Payment cancelled");
          },
          onError: (err) => {
            console.error("[Pi pay]", err);
            setStatus("error");
            setMessage(err.message ?? "Payment failed");
          },
        },
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Payment failed";
      console.error("[Pi pay]", e);
      setStatus("error");
      setMessage(msg);
    }
  }, [amount, memo, metadata, approve, complete]);

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={pay}
        disabled={status === "pending"}
        className={
          className ??
          "px-6 py-3 rounded-full bg-[image:var(--gradient-neon)] font-medium text-primary-foreground glow-pink hover:opacity-90 transition disabled:opacity-60"
        }
      >
        {status === "pending"
          ? "Processing…"
          : (label ?? `Pay ${amount} π`)}
      </button>
      {message && (
        <p
          className={`text-xs font-mono ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}