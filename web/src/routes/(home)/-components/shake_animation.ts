import React, { useEffect, useRef, useState } from "react";
import { animate, JSAnimation } from "animejs";
import { useElementOverScreen } from "@/hooks/dom/observer.ts";

export function useShakeAnimation(config: {
  /** 传入一个元素的ref,当这个元素离开屏幕后停止播放动画 */
  targetRef?: React.RefObject<HTMLDivElement | null>;
  autoPlay?: boolean;
  onFrameUpdate: (offsetX: number, offsetY: number) => void;
}) {
  const { targetRef, onFrameUpdate, autoPlay = true } = config;
  /** X轴抖动范围 */
  const widthRange: number = 100;
  const heightRange: number = -10000;
  const xSpeed = 20;
  const ySpeed = 30;

  const [isPlay, setIsPlay] = useState(autoPlay);
  const animationCtrlRef = useRef<JSAnimation>(null);
  useEffect(() => {
    const obj = { scrollLeft: 0, scrollTop: 0 };
    const xDuration = (Math.abs(widthRange) / xSpeed) * 1000;
    const yDuration = (Math.abs(heightRange) / ySpeed) * 1000;

    const animation = animate(obj, {
      scrollLeft: [
        { from: 0, to: widthRange, duration: xDuration, ease: "inOut" },
        { to: 0, duration: xDuration, ease: "inOut" },
      ],
      scrollTop: [
        { from: 0, to: heightRange, duration: yDuration, ease: "linear" },
        { to: 0, duration: yDuration, ease: "linear" },
      ],
      autoplay: isPlay,
      loop: true,
      onUpdate() {
        onFrameUpdate(obj.scrollLeft, obj.scrollTop);
      },
    });

    animationCtrlRef.current = animation;
    return () => {
      animation.revert();
    };
  }, [widthRange, heightRange, xSpeed, ySpeed]);

  useElementOverScreen((isIntersecting) => {
    if (isIntersecting) {
      animationCtrlRef.current?.play();
    } else {
      animationCtrlRef.current?.pause();
    }
  }, targetRef);

  return {
    isPlay,
    pause: () => {
      setIsPlay(false);
      animationCtrlRef.current?.pause();
    },
    play() {
      setIsPlay(true);
      animationCtrlRef.current?.restart();
    },
    stop() {
      setIsPlay(false);
      animationCtrlRef.current?.revert();
    },
  };
}
