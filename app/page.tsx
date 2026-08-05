"use client";

import { useEffect, useState } from "react";

const TAGLINES = [
  "stop overthinking",
  "ship something today",
  "your idea > your roadmap",
  "1 weekend > 6 month plan",
  "solana.new and go",
  "just. build. it.",
];

const FLOATING_EMOJIS = ["⚡", "🛠", "🚀", "🔥", "💎", "🛸", "✨", "📦"];

type SubscribeStatus = "idle" | "loading" | "success" | "error";

export default function Home() {
  const [tagIndex, setTagIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [clicks, setClicks] = useState(0);
  const [email, setEmail] = useState("");
  const [subStatus, setSubStatus] = useState<SubscribeStatus>("idle");
  const [subMessage, setSubMessage] = useState("");

  useEffect(() => {
    const id = setInterval(() => {
      setTagIndex((i) => (i + 1) % TAGLINES.length);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  const handleBuild = () => {
    setClicks((c) => c + 1);
    window.open("https://solana.new", "_blank", "noopener,noreferrer");
  };

  const handleSubscribe: React.SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (subStatus === "loading") return;
    setSubStatus("loading");
    setSubMessage("");
    try {
      const fd = new FormData(e.currentTarget);
      const website = String(fd.get("website") || "");
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, website }),
      });
      if (res.ok) {
        setSubStatus("success");
        setSubMessage("you're in. now go ship something.");
        setEmail("");
        if (typeof window !== "undefined") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).gtag?.("event", "subscribe", {
            method: "email",
          });
        }
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setSubStatus("error");
        setSubMessage(
          data.error === "invalid_email"
            ? "that email looks off."
            : "something broke. try again."
        );
      }
    } catch {
      setSubStatus("error");
      setSubMessage("network error. try again.");
    }
  };

  return (
    <main className="relative flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-hidden">
      {/* animated grid background */}
      <div className="absolute inset-0 grid-bg opacity-60" aria-hidden />

      {/* radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.85) 75%)",
        }}
      />

      {/* floating background emojis */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {FLOATING_EMOJIS.map((e, i) => (
          <span
            key={i}
            className={`absolute text-5xl md:text-7xl opacity-20 ${
              i % 2 === 0 ? "float-slow" : "float-fast"
            }`}
            style={{
              top: `${(i * 12 + 8) % 90}%`,
              left: `${(i * 17 + 5) % 90}%`,
              animationDelay: `${i * 0.7}s`,
            }}
          >
            {e}
          </span>
        ))}
      </div>

      {/* content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-5xl">
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 backdrop-blur text-xs uppercase tracking-[0.2em] text-white/70">
          <span className="w-2 h-2 rounded-full bg-[var(--solana-green)] blink" />
          live · justbuildit.lol
        </div>

        <h1 className="font-black leading-[0.85] tracking-tighter text-[clamp(4rem,18vw,16rem)]">
          <span className="block animated-gradient">JUST</span>
          <span className="block animated-gradient" style={{ animationDelay: "1s" }}>
            BUILD
          </span>
          <span className="block animated-gradient" style={{ animationDelay: "2s" }}>
            IT.
          </span>
        </h1>

        <div className="mt-8 h-8 md:h-10 overflow-hidden">
          <p
            key={tagIndex}
            className="text-lg md:text-2xl font-mono text-white/80 transition-all"
          >
            &gt; {TAGLINES[tagIndex]}
            <span className="blink">_</span>
          </p>
        </div>

        <form
          onSubmit={handleSubscribe}
          className="mt-12 w-full max-w-md flex flex-col items-center gap-3"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-white/50 font-mono">
            get the drop. no spam.
          </p>
          {/* honeypot — leave empty */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute opacity-0 pointer-events-none h-0 w-0"
            defaultValue=""
          />
          <div className="w-full flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              inputMode="email"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={subStatus === "loading"}
              style={{ fontSize: 16 }}
              className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/15 text-white placeholder:text-white/30 font-mono focus:outline-none focus:border-[var(--solana-green)] focus:bg-white/10 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={subStatus === "loading"}
              className="px-6 py-3 rounded-lg bg-[var(--solana-green)] text-black font-black uppercase text-base tracking-wider hover:brightness-110 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {subStatus === "loading" ? "..." : "subscribe"}
            </button>
          </div>
          {subMessage && (
            <p
              className={`text-xs font-mono ${
                subStatus === "success"
                  ? "text-[var(--solana-green)]"
                  : "text-red-400"
              }`}
            >
              {subMessage}
            </p>
          )}
        </form>

        <div className="mt-10 flex items-center gap-4 text-xs uppercase tracking-[0.3em] text-white/30 font-mono">
          <span className="h-px w-12 bg-white/15" />
          or
          <span className="h-px w-12 bg-white/15" />
        </div>

        <button
          onClick={handleBuild}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          className={`mt-8 group relative px-10 py-5 md:px-14 md:py-6 rounded-2xl bg-black border-2 border-white text-xl md:text-3xl font-black uppercase tracking-tight pulse-glow transition-transform active:scale-95 ${
            hovering ? "wiggle" : ""
          }`}
        >
          <span className="relative z-10 flex items-center gap-4">
            ship it
            <span className="inline-block transition-transform group-hover:translate-x-2">
              →
            </span>
          </span>
          <span
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background:
                "linear-gradient(90deg, #9945ff 0%, #14f195 50%, #dc1fff 100%)",
              filter: "blur(20px)",
              zIndex: 0,
            }}
            aria-hidden
          />
        </button>

        <p className="mt-6 text-sm md:text-base text-white/50 font-mono">
          opens{" "}
          <span className="text-white font-semibold underline decoration-dotted underline-offset-4">
            solana.new
          </span>{" "}
          — a fresh repo. one click. start shipping.
        </p>

        {clicks > 0 && (
          <p className="mt-3 text-xs text-[var(--solana-green)] font-mono">
            {clicks === 1
              ? "let's go 🚀"
              : `${clicks}× clicked. now actually go build something.`}
          </p>
        )}
      </div>

      {/* marquee footer */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden border-t border-white/10 bg-black/40 backdrop-blur py-3">
        <div className="flex marquee whitespace-nowrap text-sm md:text-base font-mono uppercase tracking-widest text-white/40">
          {Array.from({ length: 2 }).map((_, group) => (
            <div key={group} className="flex shrink-0">
              {[
                "ship fast",
                "iterate later",
                "done > perfect",
                "solana.new",
                "weekend hack",
                "no more tutorials",
                "just build it",
                "🚀",
              ].map((item, i) => (
                <span key={`${group}-${i}`} className="px-8">
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
