import React, { useEffect, useRef, useState } from "react";
import { animate, JSAnimation } from "animejs";

export function useShakeAnimation(config: {
  /** 传入一个元素的ref,当这个元素离开屏幕后停止播放动画 */
  targetRef?: React.RefObject<HTMLDivElement | null>;
  autoPlay?: boolean;
  widthRange: number;
  heightRange: number;
  onFrameUpdate: (offsetX: number, offsetY: number) => void;
}) {
  const { targetRef, widthRange, heightRange, onFrameUpdate, autoPlay = true } = config;
  const [isPlay, setIsPlay] = useState(autoPlay);
  const animationCtrlRef = useRef<JSAnimation>(null);
  useEffect(() => {
    const obj = { scrollLeft: 0, scrollTop: 0 };
    const animation = animate(obj, {
      scrollLeft: [
        { from: 0, to: widthRange, duration: 3000 },
        { to: 0, duration: 3000 },
      ],
      scrollTop: [
        { from: 0, to: heightRange, duration: 4000 },
        { to: 0, duration: 4000 },
      ],
      autoplay: isPlay,
      ease: "inOut", // ease applied between each keyframes if no ease defined
      loop: true,
      onUpdate() {
        onFrameUpdate(obj.scrollLeft, obj.scrollTop);
      },
    });

    animationCtrlRef.current = animation;
    return () => {
      animation.revert();
    };
  }, [widthRange, heightRange]);
  useEffect(() => {
    const element = targetRef?.current;
    if (!element) return;
    let isFirst = true;
    const observer = new IntersectionObserver((entries) => {
      if (isFirst) {
        isFirst = false;
        return;
      }
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animationCtrlRef.current?.play();
        } else {
          animationCtrlRef.current?.pause();
        }
      });
    });
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [targetRef]);

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
