import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 130,
          fontWeight: 900,
          backgroundImage:
            "linear-gradient(135deg, #9945ff 0%, #14f195 50%, #dc1fff 100%)",
          color: "#000",
        }}
      >
        →
      </div>
    ),
    { ...size }
  );
}
