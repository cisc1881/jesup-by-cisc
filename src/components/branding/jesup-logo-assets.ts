export const JESUP_LOGO_WHITE_SRC = "/branding/jesup-by-cisc-white.svg";
export const JESUP_LOGO_GOLD_SRC = "/branding/jesup-by-cisc-metallic-gold.svg";

/** White logo — intended for dark or crimson backgrounds. */
export const JESUP_LOGO_DEFAULT_SRC = JESUP_LOGO_WHITE_SRC;

export type JesupLogoTone = "on-dark" | "on-light";

export type SplashBackgroundTone = "dark" | "light";

export function getJesupLogoSrc(tone: JesupLogoTone): string {
  return tone === "on-light" ? JESUP_LOGO_GOLD_SRC : JESUP_LOGO_WHITE_SRC;
}

export function getLogoToneForSplash(backgroundTone: SplashBackgroundTone): JesupLogoTone {
  return backgroundTone === "light" ? "on-light" : "on-dark";
}
