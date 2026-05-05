import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#000000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 44,
          fontWeight: 900,
          backgroundImage:
            "linear-gradient(135deg, #9945ff 0%, #14f195 50%, #dc1fff 100%)",
          color: "#000",
          borderRadius: 12,
        }}
      >
        →
      </div>
    ),
    { ...size }
  );
}
