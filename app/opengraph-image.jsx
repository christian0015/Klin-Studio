import { ImageResponse } from "next/og";
export const alt = "Klin Studio — Sites immersifs pour marques de mode et de beauté";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() { // image de partage par défaut (réseaux sociaux)
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle at 72% 62%, #2b2519 0%, #050808 58%)", color: "#f4efe6" }}>
      <div style={{ display: "flex", fontSize: 150, letterSpacing: 46 }}>KLIN</div>
      <div style={{ display: "flex", fontSize: 30, letterSpacing: 22, marginTop: 6 }}>STUDIO</div>
      <div style={{ display: "flex", fontSize: 24, letterSpacing: 6, marginTop: 48, opacity: 0.75 }}>IMMERSIVE WEBSITES FOR FASHION & BEAUTY BRANDS</div>
    </div>, size);
}
