interface Env {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  RESEND_API_KEY?: string;
  RESEND_AUDIENCE_ID?: string;
  RESEND_FROM_EMAIL?: string;
  RESEND_FROM_NAME?: string;
  SHEETS_WEBHOOK_URL?: string;
  SHEETS_WEBHOOK_SECRET?: string;
}

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

const sendWelcome = async (env: Env, to: string) => {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) return;
  const fromName = env.RESEND_FROM_NAME || "just build it";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: `${fromName} <${env.RESEND_FROM_EMAIL}>`,
      to: [to],
      reply_to: "gm@metasal.xyz",
      subject: "you're in. now go ship something.",
      text: "hey,\n\nthanks for subscribing to just build it.\n\nstop overthinking. start shipping.\n\nmore from metasal: https://metasal.xyz\nchat: https://t.me/metasalxyz\n\njust build it\n",
      html: '<p>hey,</p><p>thanks for subscribing to <strong>just build it</strong>.</p><p>stop overthinking. start shipping.</p><p>more from metasal: <a href="https://metasal.xyz">metasal.xyz</a><br>chat: <a href="https://t.me/metasalxyz">t.me/metasalxyz</a></p><p>just build it</p>',
    }),
  });
  if (!res.ok) console.error("resend_send_error", res.status, await res.text());
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
  const ct = request.headers.get("content-type") ?? "";

  try {
    if (ct.includes("application/json")) {
      const body = (await request.json()) as { email?: unknown };
      if (typeof body.email === "string") email = body.email;
    } else {
      const form = await request.formData();
      const v = form.get("email");
      if (typeof v === "string") email = v;
    }
  } catch {
    return json({ error: "invalid_body" }, 400);
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
    waitUntil(appendToSheet(env, email, ip, ua, now));
  }

  return json({ ok: true, duplicate: !isNew });
};
