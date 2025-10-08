import { afterTime } from "evlib";
import { useRef } from "react";
import { useEffect } from "react";

export function useWindowEffect() {
  const ref = useRef(false);
  const refMod = useRef(() => {});
  useEffect(() => {
    const now = Date.now();
    let clear: undefined | (() => void);
    let mode: "confetti" | "snow" | undefined = "confetti";

    if (isBirthDay()) {
      mode = "confetti";
    }

    if (mode === undefined) return;

    Promise.all([import("@/common/effect/confetti.ts"), afterTime(2000)]).then(([mod]) => {
      if (ref.current) return;
      const { playConfetti, playRain, playSnow } = mod;
      switch (mode) {
        case "snow":
          refMod.current = playSnow;
          clear = playSnow().stop;
          break;

        case "confetti":
          refMod.current = playConfetti;
          clear = playConfetti().stop;
          break;
        default:
          break;
      }
    });
    return () => {
      clear?.();
      ref.current = true;
    };
  }, []);

  return {
    play: refMod.current,
  };
}

const isBirthDay = () => {
  const now = new Date();
  const beijingOffset = 8 * 60; // 北京时间 UTC+8
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const beijing = new Date(utc + beijingOffset * 60000);
  return beijing.getMonth() === 9 && beijing.getDate() === 28;
};
