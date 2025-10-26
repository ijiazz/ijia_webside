import { createLazyFileRoute } from "@tanstack/react-router";

import React, { useRef, useState } from "react";
import styled from "@emotion/styled";
import { Screen, ScreenEffectsProvider } from "./-components/screen/mod.tsx";
import { GodPlatform } from "./-components/Platforms.tsx";
import { Footer } from "@/common/Footer.tsx";
import { useWindowResize } from "@/hooks/window.ts";
import { CaretDownOutlined } from "@ant-design/icons";
import { HomeLinks } from "./-components/HomeLlink.tsx";
import { useElementOverScreen } from "@/hooks/dom/observer.ts";
import { HomePageRes } from "@/api.ts";

export const Route = createLazyFileRoute("/(home)/")({
  component: RouteComponent,
});

export function RouteComponent() {
  const data: HomePageRes | undefined = Route.useLoaderData();

  const avatarScreenRef = useRef<HTMLDivElement>(null);
  const [blackMode, setBlackMode] = useState(true);
  const avatarUrl = data?.god_user.avatar_url;
  const size = useWindowResize();

  const platformRef = useRef<HTMLDivElement>(null);
  useElementOverScreen((hide) => {
    setBlackMode(hide);
  }, avatarScreenRef);
  return (
    <HomePageCSS>
      <div className="header-link">
        <HomeLinks blackMode background={blackMode ? undefined : "#00112971"} />
      </div>
      <div ref={avatarScreenRef}>
        <ScreenEffectsProvider>
          <Screen avatarUrl={avatarUrl}>
            <HeaderCSS style={{ flexDirection: size.width > 500 ? "row" : "column" }}>
              <div
                className="link-item"
                onClick={() => platformRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                继续
                <br />
                <CaretDownOutlined />
              </div>
            </HeaderCSS>
          </Screen>
        </ScreenEffectsProvider>
      </div>
      <GodPlatform platforms={data?.god_user_platforms} ref={platformRef}></GodPlatform>
      <Footer />
    </HomePageCSS>
  );
}

const HomePageCSS = styled.div`
  width: 100%;
  overflow: hidden;
  .header-link {
    position: fixed;
    z-index: 99;
    width: 100%;
  }
  .screen {
    height: 100vh;
  }
`;

const HeaderCSS = styled.div`
  width: 100%;
  margin-bottom: 24px;
  justify-items: start;
  top: 148px;
  gap: 24px;
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  align-items: center;
  font-size: 12px;
  a {
    color: #fff;
  }
  .link-item {
    cursor: pointer;
    pointer-events: all;
    letter-spacing: 4px;
    text-align: center;
    animation: bounce 2s ease-in-out infinite both;
  }
  @keyframes bounce {
    0% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(5px);
    }
    100% {
      transform: translateY(0px);
    }
  }
`;
