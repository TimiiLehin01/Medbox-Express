const BASE = "https://api.paystack.co";

function authHeaders() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key)
    throw new Error("PAYSTACK_SECRET_KEY is not set in the environment");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

export async function initializeTransaction(params: {
  email: string;
  amountNaira: number;
  reference: string;
  callbackUrl: string;
}) {
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email: params.email,
      amount: Math.round(params.amountNaira * 100), // Paystack uses kobo
      reference: params.reference,
      callback_url: params.callbackUrl,
      currency: "NGN",
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message || "Paystack initialize failed");
  }
  return json.data as { authorization_url: string; reference: string };
}

export async function verifyTransaction(reference: string) {
  const res = await fetch(
    `${BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: authHeaders(), cache: "no-store" },
  );

  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message || "Paystack verify failed");
  }
  return json.data as {
    status: string;
    amount: number;
    currency: string;
    reference: string;
  };
}
