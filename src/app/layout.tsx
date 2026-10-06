import type { Metadata } from "next";
import {
  DM_Sans,
  Fraunces,
  Instrument_Serif,
  Inter,
  JetBrains_Mono,
  Manrope,
  Playfair_Display,
  Space_Grotesk,
} from "next/font/google";
import { ThemeProvider } from "next-themes";
import { DEFAULT_THEME, THEMES } from "@/lib/themes";
import "./globals.css";

// The default theme's fonts are preloaded; the rest download only when a theme uses them.
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: "400",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", preload: false });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  preload: false,
});
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", preload: false });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", preload: false });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  preload: false,
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  preload: false,
});

const fontVariables = [
  dmSans,
  instrumentSerif,
  inter,
  spaceGrotesk,
  fraunces,
  manrope,
  playfair,
  jetbrainsMono,
]
  .map((font) => font.variable)
  .join(" ");

export const metadata: Metadata = {
  title: "Modus UI",
  description:
    "A premium, editorial-grade React component library built with restraint and typographic precision.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // next-themes sets data-theme before hydration, so the attribute differs from the server's.
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="data-theme"
          themes={THEMES.map((theme) => theme.id)}
          defaultTheme={DEFAULT_THEME}
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
