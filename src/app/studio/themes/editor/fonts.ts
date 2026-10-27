import { Atkinson_Hyperlegible, Bricolage_Grotesque, DM_Sans, IBM_Plex_Sans, Manrope, Sora } from "next/font/google";

// The theme font set. Each one is checked at 15px, at 200% text size, and for ₦ and Yoruba, Igbo and Hausa letters.
const dmSans = DM_Sans({ subsets: ["latin", "latin-ext"], weight: ["400", "600", "700"] });
const manrope = Manrope({ subsets: ["latin", "latin-ext"], weight: ["400", "600", "700"] });
const sora = Sora({ subsets: ["latin", "latin-ext"], weight: ["400", "600", "700"] });
const plex = IBM_Plex_Sans({ subsets: ["latin", "latin-ext"], weight: ["400", "600", "700"] });
const atkinson = Atkinson_Hyperlegible({ subsets: ["latin", "latin-ext"], weight: ["400", "700"] });
const bricolage = Bricolage_Grotesque({ subsets: ["latin", "latin-ext"], weight: ["400", "600", "700"] });

const families: Record<string, string> = {
  "DM Sans": dmSans.style.fontFamily,
  Manrope: manrope.style.fontFamily,
  Sora: sora.style.fontFamily,
  "IBM Plex Sans": plex.style.fontFamily,
  "Atkinson Hyperlegible": atkinson.style.fontFamily,
  "Bricolage Grotesque": bricolage.style.fontFamily,
};

export const fontFamily = (name: string) => families[name] ?? families["DM Sans"];
