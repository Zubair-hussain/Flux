// Cloudflare Turnstile: a free CAPTCHA alternative that stops most bots from
// using a public Flux server. Only enforced in hosted mode when
// TURNSTILE_SECRET_KEY is set; the website needs NEXT_PUBLIC_TURNSTILE_SITE_KEY.
import { clientIp, isHosted } from "./hosted";
import { AppError } from "./policy";

const verifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const turnstileRequired = () =>
  isHosted() && Boolean(process.env.TURNSTILE_SECRET_KEY);

/** Checks the one-time token a visitor's browser got from Turnstile. Fails closed. */
export async function requireHuman(request: Request, token: unknown) {
  if (!turnstileRequired()) return;
  if (typeof token !== "string" || !token || token.length > 2048)
    throw new AppError(
      "Please complete the verification and try again, or use the command line.",
      403,
    );
  const form = new URLSearchParams({
    secret: process.env.TURNSTILE_SECRET_KEY!,
    response: token,
  });
  const ip = clientIp(request);
  if (ip !== "unknown") form.set("remoteip", ip);
  let result: { success?: boolean };
  try {
    const response = await fetch(verifyUrl, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(10_000),
    });
    result = await response.json();
  } catch {
    throw new AppError(
      "Verification is unavailable right now. Try again in a moment, or use the command line.",
      503,
    );
  }
  if (result.success !== true)
    throw new AppError(
      "Verification failed or expired. Please try again.",
      403,
    );
}
