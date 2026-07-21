import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 70% 20%, #27345d 0%, #11151d 44%, #090b10 100%)",
          color: "#f5f7fb",
          fontSize: 104,
          fontWeight: 900,
          letterSpacing: "-0.08em",
          border: "18px solid #8fa7ff",
          borderRadius: 112,
        }}
      >
        LIFE
      </div>
    ),
    size,
  );
}
