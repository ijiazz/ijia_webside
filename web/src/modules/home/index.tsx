import React, { useEffect, useRef, useState } from "react";
import { Link, useLoaderData } from "react-router";
import { HomePageDto } from "./type.ts";
import { AvatarList } from "./avatar.tsx";
import styled from "@emotion/styled";
import { gsap } from "gsap";
import { TextPlugin } from "gsap/TextPlugin";
import { FlashText } from "./components/FlashText.tsx";
export function HomePage() {
  const data = useLoaderData<HomePageDto>();
  const block = useRef<HTMLDivElement>(null);

  useEffect(() => {}, []);

  return (
    <HomePageCSS style={{ padding: "20px", backgroundColor: "ButtonShadow" }}>
      <div ref={block} style={{ backgroundColor: "red ", width: 100, height: 100 }}></div>
      <div>
        <AvatarList />
        <div>
          <FlashText text="我们互相守护！" />
        </div>
      </div>
      {/* 平台列表介绍 */}
      <div>
        {data.god_user_platforms.map((item) => {
          return <div key={item.platform + item.user_id}>{item.user_name}</div>;
        })}
      </div>
      <Footer>
        {footerLinks.map((item) => {
          return (
            <Link
              key={item.text}
              to={item.link}
              target={isExternalSite(item.link) ? "_blank" : undefined}
              viewTransition
            >
              {item.text}
            </Link>
          );
        })}
      </Footer>
    </HomePageCSS>
  );
}

function isExternalSite(linkOrPath: string) {
  if (/^[\.\/]/.test(linkOrPath)) return false;
  return true;
}
const footerLinks: {
  text: string;
  link: string;
}[] = [
  {
    text: "GITHUB",
    link: "https://github.com/ijiazz/ijia_webside",
  },
  {
    text: "关于本站",
    link: "/about",
  },
  {
    text: "为本站贡献",
    link: "/about/contribute",
  },
];
const Footer = styled.div``;

const HomePageCSS = styled.div``;

/* 

头像海报
平台账号数据与相关链接

三年之约

如果爱情有颜色，那一定是蓝色！

*/
