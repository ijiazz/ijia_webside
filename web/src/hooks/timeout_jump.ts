import { useCallback, useEffect, useRef, useState } from "react";

export type SetTimeoutOption = {
  interval?: number;
  timeoutSecond?: number;
  autoStart?: boolean;
  callback?: () => void;
};

export function useTimeoutJump(option: SetTimeoutOption = {}) {
  const { timeoutSecond = 3, interval = 1000, callback, autoStart } = option;
  const [resetTime, setTime] = useState(timeoutSecond);
  const callBackRef = useRef(callback);
  callBackRef.current = callback;

  const timerRef = useRef<number | undefined>(undefined);

  const setTimer = useCallback(() => {
    clear();
    setTime(timeoutSecond);
    timerRef.current = setInterval(() => {
      setTime((t) => {
        t = t - 1;
        if (t <= 0) {
          clear();
          callBackRef.current?.();
          return 0;
        }
        return t;
      });
    }, interval) as any;
  }, [resetTime, interval]);
  useEffect(() => {
    if (autoStart) setTimer();
    return clear;
  }, []);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  return {
    start: setTimer,
    resetTime,
    clear,
  };
}
