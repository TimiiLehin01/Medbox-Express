"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type State = "verifying" | "success" | "failed";

function CallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const reference = params.get("reference") || params.get("trxref");
  const [state, setState] = useState<State>("verifying");

  useEffect(() => {
    if (!reference) {
      setState("failed");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/payments/verify?reference=${encodeURIComponent(reference)}`,
        );
        const data = await res.json();
        if (cancelled) return;

        if (res.ok && data.status === "success") {
          localStorage.removeItem("cart");
          setState("success");
        } else {
          setState("failed");
        }
      } catch {
        if (!cancelled) setState("failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reference]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        {state === "verifying" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-blue-600" />
            <h1 className="text-xl font-bold mb-1">Confirming your payment</h1>
            <p className="text-gray-600">Please don&apos;t close this page.</p>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h1 className="text-xl font-bold mb-1">Payment successful</h1>
            <p className="text-gray-600 mb-6">
              Your order has been sent to the pharmacy.
            </p>
            <Button onClick={() => router.push("/consumer/orders")}>
              View my orders
            </Button>
          </>
        )}

        {state === "failed" && (
          <>
            <XCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
            <h1 className="text-xl font-bold mb-1">Payment not completed</h1>
            <p className="text-gray-600 mb-6">
              We couldn&apos;t confirm a payment for this order. You have not
              been charged unless your bank says otherwise.
            </p>
            <Button onClick={() => router.push("/consumer/checkout")}>
              Back to checkout
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackContent />
    </Suspense>
  );
}
