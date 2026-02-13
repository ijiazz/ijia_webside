import { createLazyFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { PropsWithChildren, useContext, useMemo, useRef } from "react";
import { IjiaLogo } from "../../components/IjiaLogo.tsx";
import { Button, Tooltip } from "antd";
import { Outlet, useLocation } from "@tanstack/react-router";
import { menus } from "../-layout/menus.tsx";
import { getUserToken } from "@/common/user.ts";
import { AvatarMenu } from "./-components/AvatarMenu.tsx";
import {
  AntdThemeProvider,
  HoFetchProvider,
  IS_MOBILE_LAYOUT,
  useAntdStatic,
  useThemeController,
} from "@/provider/mod.tsx";
import { css, cx } from "@emotion/css";
import { RootLayout } from "../-layout/RootLayout.tsx";
import { DayNightSwitch } from "@/lib/components/switch/DayNightSwitch.tsx";
import { BasicUserContext } from "./-context/UserContext.tsx";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CurrentUserInfoQueryOption } from "@/request/user.ts";

export const Route = createLazyFileRoute("/_school")({
  component: () => {
    const { data: currentUser } = useSuspenseQuery(CurrentUserInfoQueryOption);
    return (
      <AntdThemeProvider>
        <HoFetchProvider>
          <BasicUserContext value={currentUser}>
            <UserLayout />
          </BasicUserContext>
        </HoFetchProvider>
      </AntdThemeProvider>
    );
  },
});

const IS_DEV = import.meta.env?.DEV;

function UserLayout(props: PropsWithChildren<{}>) {
  const { message } = useAntdStatic();
  const user = useContext(BasicUserContext);

  const userToken = useMemo(() => getUserToken(), [user]);
  const copyToken = (token: string) => {
    const url = new URL(location.href);
    url.searchParams.set("access_token", token);
    const tokenUrl = url.toString();
    navigator.clipboard.writeText(tokenUrl);
    message.success("已复制个人访问 Token");
  };
  const pathname = useLayoutPathname();
  const match = Route.useMatch();
  const navigate = Route.useNavigate();

  const themeCtrl = useThemeController();

  return (
    <RootLayout
      leftExtra={
        <div className={StyledIcon}>
          <Link to="/">
            <IjiaLogo className="site-logo" />
          </Link>
          <b className="site-name">IJIA 学院</b>
        </div>
      }
      renderLink={(item) => (
        <Link style={{ color: "inherit" }} from={match.pathname} to={item.path}>
          {item.label}
        </Link>
      )}
      menus={menus}
      pathname={pathname}
      onSelectedKeysChange={({ keys, path }) => {
        if (keys.length === 1) return; // 已经通过 anchor 标签跳转了
        if (path) navigate({ from: "/", to: path, viewTransition: true });
      }}
      rightExtra={
        <div style={{ display: "flex", gap: 8, marginRight: 8, alignItems: "center" }}>
          {IS_DEV && userToken ? (
            <Button type="dashed" onClick={() => copyToken(userToken)}>
              Dev Mode
            </Button>
          ) : undefined}
          <Tooltip title={themeCtrl.mode === "dark" ? "切换到亮色主题" : "切换到暗色主题"}>
            <DayNightSwitch
              checked={themeCtrl.mode === "dark"}
              style={{ zoom: 0.7 }}
              onChange={(checked) => {
                themeCtrl.setMode(checked ? "dark" : "light");
              }}
            />
          </Tooltip>
          <AvatarMenu user={user} />
        </div>
      }
    >
      <Outlet />
    </RootLayout>
  );
}

function useLayoutPathname() {
  const pendingMatch = useRouterState({
    select(state) {
      return state.isLoading;
    },
  });
  const { pathname } = useLocation();
  const prevPathname = useRef<string>(pathname);
  if (!pendingMatch) {
    prevPathname.current = pathname;
  }

  return pendingMatch ? prevPathname.current : pathname;
}

const StyledIcon = css`
  display: flex;
  align-items: center;
  gap: 12px;

  .site-name {
    font-weight: 600;
    font-size: 16px;
  }
  .site-logo {
    margin-left: 16px;
  }

  @media (max-width: 600px) {
    .site-name {
      display: none;
    }
  }
  @media screen and (${IS_MOBILE_LAYOUT}) {
    display: none;
  }
`;
