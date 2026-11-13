import { merchant } from "@/data/merchant";
import { mockPaymentProvider } from "@/lib/payments/mock-provider";
import { parsePaymentCheck } from "@/lib/payments/validation";
import { verifyPayment } from "@/lib/payments/verification-engine";

const headers = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => undefined);
  const payment = parsePaymentCheck(body);
  const requestedMerchant = (body as { merchantId?: unknown } | undefined | null)?.merchantId;
  if (!payment || (requestedMerchant !== undefined && requestedMerchant !== merchant.id)) {
    return Response.json({ error: "Invalid payment details." }, { status: 400, headers });
  }

  const outcome = await verifyPayment(
    { ...payment, merchantId: merchant.id },
    mockPaymentProvider,
    new Date().toISOString(),
  );
  return Response.json(outcome, { status: outcome.status === "unavailable" ? 503 : 200, headers });
}
