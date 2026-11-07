import { ImageResponse } from "next/og";
import { CompassArtwork } from "@/components/brand/stellar-compass";

export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0B1220" }}>
      <CompassArtwork idPrefix="app-icon-192" size={135} />
    </div>,
    { width: 192, height: 192 },
  );
}
