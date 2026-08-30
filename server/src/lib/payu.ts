import crypto from "node:crypto";

/**
 * PayU hosted-checkout integration.
 *
 * With PAYU_KEY / PAYU_SALT unset the whole feature is dormant and the shop
 * keeps using the direct-UPI QR flow, exactly as before.
 */
export interface PayuConfig {
  key: string;
  salt: string;
  /** "test" points at PayU's sandbox, anything else at production. */
  mode: string;
}

export function payuConfig(): PayuConfig | null {
  const key = process.env.PAYU_KEY;
  const salt = process.env.PAYU_SALT;
  if (!key || !salt) return null;
  return { key, salt, mode: process.env.PAYU_MODE ?? "test" };
}

export function payuPaymentUrl(config: PayuConfig): string {
  return config.mode === "live"
    ? "https://secure.payu.in/_payment"
    : "https://test.payu.in/_payment";
}

function verifyApiUrl(config: PayuConfig): string {
  return config.mode === "live"
    ? "https://info.payu.in/merchant/postservice?form=2"
    : "https://test.payu.in/merchant/postservice?form=2";
}

function sha512(input: string): string {
  return crypto.createHash("sha512").update(input).digest("hex");
}

/** PayU wants the amount as a plain decimal string, e.g. "649.00". */
export function payuAmount(inr: number): string {
  return inr.toFixed(2);
}

export interface PayuRequestFields {
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
}

/**
 * Request hash:
 * sha512(key|txnid|amount|productinfo|firstname|email|udf1..udf5||||||salt)
 * We send no UDFs, so those five slots are empty.
 */
export function buildRequestParams(
  config: PayuConfig,
  f: PayuRequestFields
): Record<string, string> {
  const hashString = [
    config.key,
    f.txnid,
    f.amount,
    f.productinfo,
    f.firstname,
    f.email,
    "", "", "", "", "", // udf1..udf5
    "", "", "", "", "", // reserved
    config.salt,
  ].join("|");

  return {
    key: config.key,
    txnid: f.txnid,
    amount: f.amount,
    productinfo: f.productinfo,
    firstname: f.firstname,
    email: f.email,
    phone: f.phone,
    surl: f.surl,
    furl: f.furl,
    hash: sha512(hashString),
  };
}

/**
 * Response hash is the request hash reversed:
 * sha512(salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|key)
 * `additionalCharges`, when present, is prepended to the whole string.
 */
export function isResponseHashValid(
  config: PayuConfig,
  body: Record<string, string | undefined>
): boolean {
  const get = (k: string) => body[k] ?? "";
  const base = [
    config.salt,
    get("status"),
    "", "", "", "", "", // reserved
    get("udf5"), get("udf4"), get("udf3"), get("udf2"), get("udf1"),
    get("email"),
    get("firstname"),
    get("productinfo"),
    get("amount"),
    get("key"),
  ].join("|");

  const expected = body.additionalCharges
    ? sha512(`${body.additionalCharges}|${base}`)
    : sha512(base);

  const received = (get("hash") || "").toLowerCase();
  if (received.length !== expected.length) return false;
  // Constant-time compare so a wrong hash can't be probed byte by byte.
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

export interface PayuVerification {
  ok: boolean;
  status?: string;
  amount?: string;
  payuId?: string;
  mode?: string;
}

/**
 * Server-to-server confirmation. The browser-posted response can be spoofed by
 * a determined customer; this asks PayU directly what really happened, and is
 * the value we actually trust before marking an order paid.
 */
export async function verifyPaymentWithPayu(
  config: PayuConfig,
  txnid: string
): Promise<PayuVerification> {
  const command = "verify_payment";
  const hash = sha512([config.key, command, txnid, config.salt].join("|"));
  const body = new URLSearchParams({ key: config.key, command, var1: txnid, hash });

  const res = await fetch(verifyApiUrl(config), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return { ok: false };

  const data = (await res.json()) as {
    status?: number;
    transaction_details?: Record<string, { status?: string; amt?: string; mihpayid?: string; mode?: string }>;
  };
  const details = data.transaction_details?.[txnid];
  if (!details) return { ok: false };

  return {
    ok: (details.status ?? "").toLowerCase() === "success",
    status: details.status,
    amount: details.amt,
    payuId: details.mihpayid,
    mode: details.mode,
  };
}
