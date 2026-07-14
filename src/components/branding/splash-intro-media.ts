export type SplashIntroMedia = {
  /** Set true when video assets are added under public/branding/. */
  enabled?: boolean;
  webmSrc?: string;
  mp4Src?: string;
  posterSrc?: string;
  maxDurationMs?: number;
};

export const DEFAULT_SPLASH_INTRO_MEDIA: SplashIntroMedia = {
  enabled: false,
  webmSrc: "/branding/jesup-intro.webm",
  mp4Src: "/branding/jesup-intro.mp4",
  posterSrc: "/branding/jesup-intro-poster.jpg",
  maxDurationMs: 3000,
};

export function shouldAttemptSplashVideo(media: SplashIntroMedia | undefined): boolean {
  if (!media?.enabled) return false;
  if (!media.webmSrc && !media.mp4Src) return false;
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;

  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;
  if (connection?.saveData) return false;
  if (connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g") return false;

  return true;
}
