import fs from "fs";
import path from "path";
import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const OG_SIZE = { width: 1200, height: 630 };

interface OgCardProps {
  title: string;
  description: string;
  /** Small label top right, e.g. the component's category. */
  eyebrow?: string;
}

/** The branded 1200x630 social card shared by the site and every component page. */
export function ogCard({ title, description, eyebrow }: OgCardProps) {
  // ImageResponse cannot use next/font, so the heading font is bundled with the repo.
  const serif = fs.readFileSync(
    path.join(process.cwd(), "src/app/fonts/InstrumentSerif-Regular.ttf"),
  );

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: "#F7F5F3",
        color: "#37322F",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28 }}>
        <div style={{ fontFamily: "Instrument Serif", fontSize: 40 }}>{SITE.name}</div>
        {eyebrow && (
          <div style={{ opacity: 0.6, textTransform: "uppercase", letterSpacing: 4 }}>
            {eyebrow}
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: "Instrument Serif", fontSize: 128, lineHeight: 1 }}>{title}</div>
        <div style={{ marginTop: 32, fontSize: 32, lineHeight: 1.4, maxWidth: 960, opacity: 0.7 }}>
          {description}
        </div>
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [{ name: "Instrument Serif", data: serif, style: "normal", weight: 400 }],
    },
  );
}
