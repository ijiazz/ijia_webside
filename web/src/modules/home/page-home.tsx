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
      <a href="#platforms" style={{ textDecoration: "none" }}>
        <StarHover>
          <RefreshButton className="link-item">故事的开始</RefreshButton>
        </StarHover>
      </a>
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
/* 

头像大屏
平台账号数据与相关链接

三年之约

如果爱情有颜色，那一定是蓝色！


你会...  你会一直陪着我的吧？


可以不走吗？

既然这样的话，那我以后就不会再纠缠你了。



真的会一直都在吗？    

尊嘟假嘟，这种话我可是听过好多次了，该走的还是走了

哈哈，没关系我会珍惜当下的。
不知道明年大家还在不在


虽然不知道你们还在不在，希望到时候你们还在拉
我知道你们有时候说自己是小丑，是跟我开玩笑的，但是你们要知道，你们不是小丑！
有很多人说自己是什么臭打游戏的，所以不要再说自己是臭大游戏的了，我希望你们能和我一起变得越来越自信
*/
