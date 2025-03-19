import { PropsWithChildren } from "react";
import { useNavigate } from "react-router";
import { avatarDropdownRender } from "./avatar.tsx";
import { useCurrentUser } from "@/common/user.ts";
import { LayoutBase } from "./BaseLayout.tsx";

export function UserLayout(props: PropsWithChildren<{}>) {
  const navigate = useNavigate();
  const user = useCurrentUser();
  return (
    <LayoutBase
      avatarProps={{
        src: user.value?.avatar_url,
        className: "e2e-avatar",
        size: "small",
        title: user.value?.nickname,
        render: (props, dom) => {
          return avatarDropdownRender(dom, { navigate, onLogout: user.logout });
        },
        children: user.value?.nickname ?? " ",
      }}
    >
      {props.children}
    </LayoutBase>
  );
}
