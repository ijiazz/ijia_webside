import { afterTime } from "evlib";
import { useRef } from "react";
import { useEffect } from "react";

export enum EffectMode {
  confetti,
  snow,
}

export type UseWindowEffectResult = {
  play: (mode: EffectMode) => void;
};
export function useWindowEffect(mode?: EffectMode) {
  const needPlayRef = useRef<EffectMode | null>(null);
  const refMod = useRef<typeof import("@/common/effect/confetti.ts") | null>(null);
  const play = (mode: EffectMode) => {
    const mod = refMod.current;
    if (!mod) return;

    if (/XiaoMi\/MiuiBrowser\/[\d\.]+$/.test(navigator.userAgent)) {
      return;
    }

    const { playConfetti, playRain, playSnow } = mod;
    switch (mode) {
      case EffectMode.snow:
        return playSnow().stop;

      case EffectMode.confetti:
        return playConfetti(document.body.clientWidth).stop;
      default:
        return () => {};
    }
  };
  useEffect(() => {
    let clear: undefined | (() => void);
    if (mode === undefined) return;
    needPlayRef.current = mode;

    Promise.all([import("@/common/effect/confetti.ts"), afterTime(2000)])
      .then(([mod]) => {
        refMod.current = mod;
      })
      .then(() => {
        if (needPlayRef.current !== mode) return;
        clear = play(mode);
      });
    return () => {
      clear?.();
      needPlayRef.current = null;
    };
  }, [mode]);

  return {
    play,
  };
}
