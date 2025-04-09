import { GodPlatformDto } from "@/api.ts";
import { UserCard3D } from "@/lib/components/card.tsx";
import React from "react";
import { THIRD_PART } from "@/common/third_part_account.tsx";
import styled from "@emotion/styled";
import { VLink } from "@/lib/components/VLink.tsx";

type GodPlatformProps = {
  platforms?: GodPlatformDto[];
  followerNumDetail?: boolean;
  ref?: React.RefObject<HTMLDivElement | null>;
};
export function GodPlatform(props: GodPlatformProps) {
  const { platforms, followerNumDetail = false, ref } = props;
  return (
    <StyledWrapper ref={ref}>
      <div className="background">
        <div className="shape-rectangle"></div>
        <div className="shape-round"></div>
      </div>
      <h1 className="description">我们的大明星</h1>
      {platforms?.map((item) => {
        const icon = item.platform ? THIRD_PART[item.platform].icon : undefined;
        const followersCount = item.stat?.followers_count ?? 0;
        const num = followerNumDetail ? followersCount : number(followersCount);
        return (
          <div key={item.platform + item.user_id}>
            <VLink to={item.home_url ?? undefined} target="_blank">
              <UserCard3D
                title={
                  <UserCardTitleCSS>
                    {icon}
                    {item.user_name}
                  </UserCardTitleCSS>
                }
                footer={"粉丝：" + num}
                avatar={item.avatar_url ? <AvatarCSS src={item.avatar_url} /> : undefined}
              ></UserCard3D>
            </VLink>
          </div>
        );
      })}
    </StyledWrapper>
  );
}
const UserCardTitleCSS = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  .icon {
    border-radius: 10%;
    background-color: #fff;
    overflow: hidden;
  }
`;
const StyledWrapper = styled.div`
  position: relative;
  margin: 48px auto;
  padding: 12px;
  justify-content: center;
  display: flex;
  flex-wrap: wrap;
  min-height: max(90vh, 550px);

  .background {
    z-index: -1;
    .shape-rectangle {
      position: absolute;
      left: 100px;
      top: 100px;
      width: 250px;
      height: 450px;
      background-color: #deffd7;
      box-shadow: 10px 10px 100px #deffd7;
      animation: float-y 3s ease-in-out infinite alternate;
      animation: float-x 4s ease-in-out infinite alternate;
    }
    .shape-round {
      position: absolute;
      width: 400px;
      height: 400px;
      background-color: #c1feff;
      box-shadow: 10px 10px 100px #c1feff;
      bottom: 100px;
      right: 100px;
      border-radius: 50%;
      overflow: hidden;
      animation: float-y 3s ease-in-out infinite alternate;
      animation: float-x 4s ease-in-out infinite alternate;
    }
    @keyframes float-y {
      from {
        transform: translateY(0px);
      }
      to {
        transform: translateY(50px);
      }
    }
    @keyframes float-x {
      from {
        transform: translateX(0px);
      }
      to {
        transform: translateX(50px);
      }
    }
  }
  .description {
    width: 100%;
    line-height: 4;
    text-align: center;
    font-weight: 600;
    color: #000;
  }
`;
const AvatarCSS = styled.img`
  object-fit: cover;
  width: 100%;
  height: 100%;
`;
function number(num: number) {
  if (num < 1000) return num.toString();
  if (num < 10000) return Math.floor(num / 1000) + " K+";
  return Math.floor(num / 10000) + " W+";
}
