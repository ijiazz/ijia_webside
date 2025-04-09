import React, { useEffect, useRef, useState } from "react";
import { Link, useLoaderData, useLocation } from "react-router";
import styled from "@emotion/styled";
import { Screen, ScreenAvatar } from "./components/Screen.tsx";
import { Caption, CaptionFlow } from "@/lib/components/talk.tsx";
import { GodPlatform } from "./components/Platforms.tsx";
import { Footer } from "@/common/Footer.tsx";
import { HomePageRes } from "@/api.ts";
import { LineBtn } from "@/lib/components/button.tsx";
import { useWindowResize } from "@/hooks/window.ts";

export function HomePage() {
  const data = useLoaderData<HomePageRes>();
  const { state } = useLocation();
  const showExtend = state?.showExtend;
  const [speak, setSpeak] = useState<Caption>(showExtend ? extend[0] : flashTextList[0]);
  const indexRef = useRef(-1);
  const avatarUrl = data.god_user.avatar_url;

  const size = useWindowResize();

  useEffect(() => {
    indexRef.current = 0;
    const internal = setInterval(() => {
      let next = indexRef.current + 1;
      if (next >= flashTextList.length) {
        next = 0;
      }
      indexRef.current = next;
      setSpeak(flashTextList[next]);
    }, 8000);
    return () => {
      clearInterval(internal);
    };
  }, []);
  const platformRef = useRef<HTMLDivElement>(null);
  return (
    <HomePageCSS>
      <Screen
        // 第一个延迟
        text={<CaptionFlow delay={indexRef.current < 0 ? 1000 : 0} text={speak} style={{ textAlign: "center" }} />}
        avatar={avatarUrl ? <ScreenAvatar src={avatarUrl} /> : undefined}
      >
        <HeaderCSS style={{ flexDirection: size.width > 500 ? "row" : "column" }}>
          <Link to="live" viewTransition style={{ textDecoration: "none" }}>
            <LineBtn className="link-item">IJIA学院</LineBtn>
          </Link>
          <LineBtn
            className="link-item"
            onClick={() => platformRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            成为IJIA
          </LineBtn>
        </HeaderCSS>
      </Screen>
      <GodPlatform platforms={data.god_user_platforms} ref={platformRef}></GodPlatform>
      <Footer />
    </HomePageCSS>
  );
}
const HomePageCSS = styled.div`
  width: 100%;
  .screen {
    height: 100vh;
  }
`;

const HeaderCSS = styled.div`
  width: 100%;
  justify-items: start;
  top: 148px;
  gap: 24px;
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  align-items: center;
  font-size: 20px;
  font-weight: 600;
  a {
    color: #fff;
  }
  .link-item {
    pointer-events: all;
    letter-spacing: 4px;
  }
`;

const flashTextList: Caption[] = [
  {
    text: "我们互相保护！",
    speed: 8,
    pauseMs: 800,
    segments: [
      { length: 2, speed: 4 },
      { length: 5, speed: 6 },
    ],
  },
  {
    text: "我喜欢的小偶像叫邹佳佳！她一点都不垃圾，饭她很幸福！",
    speed: 7,
    pauseMs: 800,
    segments: [{ length: 7, speed: 6, pauseMs: 250 }, { length: 5, speed: 8 }, 8, 6],
  },
];
const extend: Caption[] = [
  {
    text: "谢谢宝宝们，回头看你们都在，嘿嘿",
    speed: 6,
    pauseMs: 800,
    segments: [6, { length: 3, pauseMs: 200 }, 5, 2],
  },
];
