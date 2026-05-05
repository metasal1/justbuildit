import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "just build it — stop overthinking, ship something on Solana";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#000000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            padding: "10px 28px",
            borderRadius: 999,
            border: "2px solid rgba(255,255,255,0.2)",
            background: "rgba(20,241,149,0.1)",
            color: "#14f195",
            fontSize: 26,
            letterSpacing: 8,
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          ● justbuildit.lol
        </div>

        <div
          style={{
            marginTop: 32,
            fontSize: 180,
            fontWeight: 900,
            lineHeight: 0.92,
            letterSpacing: -6,
            backgroundImage:
              "linear-gradient(90deg, #9945ff 0%, #14f195 50%, #dc1fff 100%)",
            backgroundClip: "text",
            color: "transparent",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <span style={{ display: "flex" }}>JUST BUILD</span>
          <span style={{ display: "flex" }}>IT.</span>
        </div>

        <div
          style={{
            marginTop: 36,
            fontSize: 32,
            color: "rgba(255,255,255,0.75)",
            fontFamily: "monospace",
            display: "flex",
          }}
        >
          &gt; stop overthinking. ship something today._
        </div>

        <div
          style={{
            marginTop: 28,
            display: "flex",
            gap: 24,
            fontSize: 22,
            color: "rgba(255,255,255,0.4)",
            fontFamily: "monospace",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          <span>ship fast</span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
          <span>iterate later</span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
          <span>solana.new</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
