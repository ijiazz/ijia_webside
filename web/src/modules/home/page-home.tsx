import React, { useRef } from "react";
import { Link, useLoaderData } from "react-router";
import styled from "@emotion/styled";
import { Screen, ScreenAvatar } from "./components/Screen.tsx";
import { GodPlatform } from "./components/Platforms.tsx";
import { Footer } from "@/common/Footer.tsx";
import { HomePageRes } from "@/api.ts";
import { StarHover, LineBtn, RefreshButton } from "@/lib/components/button.tsx";
import { useWindowResize } from "@/hooks/window.ts";

export function HomePage() {
  const data = useLoaderData<HomePageRes>();
  const block = useRef<HTMLDivElement>(null);

  const avatarUrl = data.god_user.avatar_url;
  /**
   * 我们互相保护！
   * 我喜欢的小偶像叫邹佳佳！她一点都不垃圾，饭她很幸福！
   * 谢谢宝宝们，回头看你们都在，嘿嘿
   */
  return (
    <HomePageCSS>
      <Screen text="我们互相保护" avatar={avatarUrl ? <ScreenAvatar src={avatarUrl} /> : undefined}>
        <Header />
      </Screen>
      <GodPlatform platforms={data.god_user_platforms}></GodPlatform>
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

function Header() {
  const size = useWindowResize();
  return (
    <HeaderCSS style={{ flexDirection: size.width > 500 ? "row" : "column" }}>
      <Link to="live" viewTransition style={{ textDecoration: "none" }}>
        <LineBtn className="link-item">IJIA学院</LineBtn>
      </Link>
      <Link to="./story" viewTransition style={{ textDecoration: "none" }}>
        <StarHover>
          <RefreshButton className="link-item">故事的开始</RefreshButton>
        </StarHover>
      </Link>
      <Link to="passport/signup" viewTransition style={{ textDecoration: "none" }}>
        <LineBtn className="link-item">成为IJIA</LineBtn>
      </Link>
    </HeaderCSS>
  );
}
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
