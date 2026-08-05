interface Env {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  RESEND_API_KEY?: string;
  RESEND_AUDIENCE_ID?: string;
  RESEND_FROM_EMAIL?: string;
  RESEND_FROM_NAME?: string;
  RESEND_NOTIFY_TO?: string;
  RESEND_TPL_SUBSCRIBE_CONFIRM?: string;
  RESEND_TPL_SUBSCRIBE_NOTIFY?: string;
  SHEETS_WEBHOOK_URL?: string;
  SHEETS_WEBHOOK_SECRET?: string;
}

// Hardcoded published template IDs (optional env override for rotation)
const TPL_SUBSCRIBE_CONFIRM = "997a7bcf-84d5-437f-9158-ba02705fbefb";
const TPL_SUBSCRIBE_NOTIFY = "bfb2d66b-6db5-4f8d-b8e1-43039679fd96";
const DEFAULT_FROM = "just build it <noreply@justbuildit.lol>";
const DEFAULT_NOTIFY_TO = "gm@metasal.xyz";

type PagesFunction<E = unknown> = (ctx: {
  request: Request;
  env: E;
  waitUntil: (promise: Promise<unknown>) => void;
}) => Response | Promise<Response>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const tursoHttpUrl = (raw: string) => {
  const trimmed = raw.replace(/\/+$/, "");
  return trimmed.startsWith("libsql://")
    ? "https://" + trimmed.slice("libsql://".length)
    : trimmed;
};

const insertSubscriber = async (
  env: Env,
  email: string,
  ip: string | null,
  ua: string | null
) => {
  const res = await fetch(`${tursoHttpUrl(env.TURSO_DATABASE_URL)}/v2/pipeline`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.TURSO_AUTH_TOKEN}`,
    },
    body: JSON.stringify({
      requests: [
        {
          type: "execute",
          stmt: {
            sql: `INSERT INTO subscribers (email, created_at, ip, ua)
                  VALUES (?, ?, ?, ?)
                  ON CONFLICT(email) DO NOTHING
                  RETURNING email`,
            args: [
              { type: "text", value: email },
              { type: "integer", value: String(Date.now()) },
              ip ? { type: "text", value: ip } : { type: "null" },
              ua ? { type: "text", value: ua } : { type: "null" },
            ],
          },
        },
        { type: "close" },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`turso ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    results: Array<{ type: string; response?: { result?: { rows?: unknown[] } } }>;
  };
  const rows = data.results?.[0]?.response?.result?.rows ?? [];
  return rows.length > 0;
};

const appendToSheet = async (
  env: Env,
  email: string,
  ip: string | null,
  ua: string | null,
  createdAt: number
) => {
  if (!env.SHEETS_WEBHOOK_URL || !env.SHEETS_WEBHOOK_SECRET) return;
  const res = await fetch(env.SHEETS_WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      secret: env.SHEETS_WEBHOOK_SECRET,
      email,
      ip,
      ua,
      created_at: createdAt,
    }),
    redirect: "manual",
  });
  if (res.status >= 400) {
    console.error("sheets_error", res.status, await res.text());
  }
};

const addToResendAudience = async (env: Env, email: string) => {
  if (!env.RESEND_API_KEY || !env.RESEND_AUDIENCE_ID) return;
  const res = await fetch(
    `https://api.resend.com/audiences/${env.RESEND_AUDIENCE_ID}/contacts`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({ email, unsubscribed: false }),
    }
  );
  if (!res.ok) console.error("resend_audience_error", res.status, await res.text());
};

const resendFrom = (env: Env) => {
  if (env.RESEND_FROM_EMAIL) {
    const name = env.RESEND_FROM_NAME || "just build it";
    return `${name} <${env.RESEND_FROM_EMAIL}>`;
  }
  return DEFAULT_FROM;
};

const sendWelcome = async (env: Env, to: string) => {
  if (!env.RESEND_API_KEY) return;
  const tplId = env.RESEND_TPL_SUBSCRIBE_CONFIRM || TPL_SUBSCRIBE_CONFIRM;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: resendFrom(env),
      to: [to],
      reply_to: "gm@metasal.xyz",
      template: { id: tplId },
      tags: [
        { name: "category", value: "subscribe" },
        { name: "product", value: "justbuildit" },
      ],
    }),
  });
  if (!res.ok) console.error("resend_send_error", res.status, await res.text());
};

const notifyEmail = async (
  env: Env,
  email: string,
  ip: string | null
) => {
  if (!env.RESEND_API_KEY) return;
  const to = env.RESEND_NOTIFY_TO || DEFAULT_NOTIFY_TO;
  const tplId = env.RESEND_TPL_SUBSCRIBE_NOTIFY || TPL_SUBSCRIBE_NOTIFY;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: resendFrom(env),
      to: [to],
      template: {
        id: tplId,
        variables: {
          CONTACT_EMAIL: email,
          SOURCE: "homepage",
          IP: ip || "—",
        },
      },
      tags: [
        { name: "category", value: "subscribe-notify" },
        { name: "product", value: "justbuildit" },
      ],
    }),
  });
  if (!res.ok) console.error("resend_notify_error", res.status, await res.text());
};

const notifyTelegram = async (env: Env, text: string) => {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
  const res = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text,
        disable_web_page_preview: true,
      }),
    }
  );
  if (!res.ok) console.error("telegram_error", res.status, await res.text());
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  if (!env.TURSO_DATABASE_URL || !env.TURSO_AUTH_TOKEN) {
    return json({ error: "server_misconfigured" }, 500);
  }

  let email: string | undefined;
  let honeypot: string | undefined;
  const ct = request.headers.get("content-type") ?? "";

  try {
    if (ct.includes("application/json")) {
      const body = (await request.json()) as {
        email?: unknown;
        website?: unknown;
      };
      if (typeof body.email === "string") email = body.email;
      if (typeof body.website === "string") honeypot = body.website;
    } else {
      const form = await request.formData();
      const v = form.get("email");
      if (typeof v === "string") email = v;
      const hp = form.get("website");
      if (typeof hp === "string") honeypot = hp;
    }
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  // Honeypot — silent success for bots
  if (honeypot && honeypot.trim().length > 0) {
    return json({ ok: true, duplicate: false });
  }

  email = email?.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return json({ error: "invalid_email" }, 400);
  }

  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null;
  const ua = request.headers.get("user-agent") || null;

  let isNew = false;
  try {
    isNew = await insertSubscriber(env, email, ip, ua);
  } catch (err) {
    console.error("turso_error", err);
    return json({ error: "storage_failed" }, 502);
  }

  if (isNew) {
    const now = Date.now();
    waitUntil(
      notifyTelegram(env, `🎉 new sub: ${email}${ip ? `\nip: ${ip}` : ""}`)
    );
    waitUntil(addToResendAudience(env, email));
    waitUntil(sendWelcome(env, email));
    waitUntil(notifyEmail(env, email, ip));
    waitUntil(appendToSheet(env, email, ip, ua, now));
  }

  return json({ ok: true, duplicate: !isNew });
};
