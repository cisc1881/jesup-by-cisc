import { useEffect, useRef, useState } from "react";
import { JesupLogoMark } from "./jesup-logo-mark";
import { getLogoToneForSplash, type SplashBackgroundTone } from "./jesup-logo-assets";
import { SplashTransition, type SplashTransitionPhase } from "./splash-transition";
import {
  DEFAULT_SPLASH_INTRO_MEDIA,
  shouldAttemptSplashVideo,
  type SplashIntroMedia,
} from "./splash-intro-media";
import { cn } from "@/lib/utils";

export const JESUP_SPLASH_SESSION_KEY = "jesup-splash-seen";

/** Hold before exit fade begins (ms). */
export const SPLASH_HOLD_MS = 1800;
/** Exit fade duration (ms) — keep in sync with splash.css. */
export const SPLASH_EXIT_MS = 450;

export type JesupSplashScreenProps = {
  phase: SplashTransitionPhase;
  introMedia?: SplashIntroMedia;
  /** Dark crimson is the default branded splash; light uses the gold logo variant. */
  backgroundTone?: SplashBackgroundTone;
  onExitComplete?: () => void;
};

export function JesupSplashScreen({
  phase,
  introMedia = DEFAULT_SPLASH_INTRO_MEDIA,
  backgroundTone = "dark",
  onExitComplete,
}: JesupSplashScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useVideo, setUseVideo] = useState(false);
  const logoTone = getLogoToneForSplash(backgroundTone);
  const isDarkSplash = backgroundTone === "dark";

  useEffect(() => {
    setUseVideo(shouldAttemptSplashVideo(introMedia));
  }, [introMedia]);

  useEffect(() => {
    if (!useVideo) return;
    const video = videoRef.current;
    if (!video) return;

    const maxMs = introMedia.maxDurationMs ?? DEFAULT_SPLASH_INTRO_MEDIA.maxDurationMs ?? 3000;
    const capPlayback = () => {
      if (video.currentTime >= maxMs / 1000) video.pause();
    };

    video.addEventListener("timeupdate", capPlayback);
    void video.play().catch(() => setUseVideo(false));

    return () => video.removeEventListener("timeupdate", capPlayback);
  }, [useVideo, introMedia.maxDurationMs]);

  return (
    <SplashTransition
      phase={phase}
      className={isDarkSplash ? "jesup-splash--tone-dark" : "jesup-splash--tone-light"}
      onExitComplete={onExitComplete}
    >
      <div className="jesup-splash__backdrop absolute inset-0" />

      {useVideo && (
        <video
          ref={videoRef}
          className="jesup-splash__video absolute inset-0 h-full w-full object-cover opacity-30"
          muted
          playsInline
          autoPlay
          preload="none"
          poster={introMedia.posterSrc}
          onError={() => setUseVideo(false)}
        >
          {introMedia.webmSrc && <source src={introMedia.webmSrc} type="video/webm" />}
          {introMedia.mp4Src && <source src={introMedia.mp4Src} type="video/mp4" />}
        </video>
      )}

      <div className="jesup-splash__content relative z-10 flex max-w-md flex-col items-center px-6 text-center">
        <div className="jesup-splash__logo-wrap w-full max-w-full">
          <JesupLogoMark size="splash" tone={logoTone} glow />
        </div>

        <div
          className="jesup-splash__gold-line mt-5 h-px w-28 max-w-[40vw] rounded-full bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent"
          aria-hidden="true"
        />

        <p
          className={cn(
            "jesup-splash__subtitle mt-5 text-sm font-medium tracking-wide sm:text-base",
            isDarkSplash ? "text-primary-foreground/90" : "text-muted-foreground",
          )}
        >
          The Digital Extension Wagon
        </p>

        <p
          className={cn(
            "jesup-splash__attribution mt-3 max-w-xs text-xs leading-relaxed",
            isDarkSplash ? "text-primary-foreground/65" : "text-muted-foreground/80",
          )}
        >
          Powered by the Carver Integrative Sustainability Center
        </p>
      </div>
    </SplashTransition>
  );
}
