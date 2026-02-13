import React, { ReactNode, useEffect, useRef, useState } from "react";
import { css, cx } from "@emotion/css";
import { HomeBulletChat } from "../HomeBulletchat.tsx";
import { ScreenAvatar } from "./ScreenAvatar.tsx";
import { EffectMode, useWindowEffect } from "../../-hooks/useWindowEffect.ts";
import { Caption, CaptionFlow } from "@/lib/components/talk.tsx";
import { extend, flashTextList, birthdayCaption } from "../../-utils/flashText.ts";
import { useLocation } from "@tanstack/react-router";
import { AvatarWall } from "./AvatarWall.tsx";
import { MEDIA_CHECK, useScreenEffects } from "./screenEffects.tsx";
export * from "./screenEffects.tsx";

type AvatarListProps = {
  avatarUrl?: string | null;

  showMask?: boolean;
  children?: ReactNode;
};

export function Screen(props: AvatarListProps) {
  const { children, showMask = true, avatarUrl } = props;
  const effects = useScreenEffects();
  const { state } = useLocation();

  const showExtend = (state as any)?.showExtend;

  const indexRef = useRef(-1);
  const textList = effects.birthday ? birthdayCaption : flashTextList;
  const [speak, setSpeak] = useState<Caption>(showExtend ? extend[0] : textList[0]);
  useEffect(() => {
    indexRef.current = 0;
    const internal = setInterval(() => {
      let next = indexRef.current + 1;
      if (next >= textList.length) {
        next = 0;
      }
      indexRef.current = next;
      setSpeak(textList[next]);
    }, 8000);
    return () => {
      clearInterval(internal);
    };
  }, []);

  const { play } = useWindowEffect(effects.birthday ? EffectMode.confetti : undefined); //特效
  const godAvatarRef = useRef<HTMLDivElement>(null);

  return (
    <div className={cx(ScreenCSS, "screen")}>
      {/* 头像墙 */}
      <AvatarWall godAvatarRef={godAvatarRef} />
      <div className="screen-top-mask" style={{ display: showMask ? undefined : "none" }}>
        <div />
        <div className="center">
          <div className="god-avatar" ref={godAvatarRef}>
            {avatarUrl && (
              <ScreenAvatar
                src={avatarUrl}
                onTrigger={() => {
                  if (effects.birthday) {
                    play(EffectMode.confetti);
                  }
                }}
              />
            )}
          </div>
          {/* 第一个延迟 */}
          <CaptionFlow delay={indexRef.current < 0 ? 1000 : 0} text={speak} style={{ textAlign: "center" }} />
        </div>
        {children}
      </div>
      {/* 弹幕 */}
      <HomeBulletChat />
    </div>
  );
}

const ScreenCSS = css`
  background: url("/main/home.webp");
  background-color: #d4f5ff;
  background-blend-mode: multiply;
  background-size: cover;
  background-position: center;

  position: relative;
  height: 100%;
  overflow: hidden;
  .god-avatar {
    display: flex;
  }

  .screen {
    &-top-mask {
      pointer-events: none;
      position: absolute;
      top: 0;
      display: flex;
      gap: 14px;
      flex-direction: column;
      width: 100%;
      justify-content: space-between;
      align-items: center;
      height: 100%;
      background-color: #00000030;
      /* mask: radial-gradient(#fff, #fff, #fff0); */
      color: #fff;

      .center {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        gap: 24px;
      }
      .flash-text {
        font-size: 40px;
        font-weight: 600;
      }

      @media screen and (${MEDIA_CHECK}) {
        .flash-text {
          font-size: 28px;
          font-weight: 600;
        }
      }
    }
  }
`;
