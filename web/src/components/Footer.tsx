import { css } from "@emotion/css";
import { ReactNode } from "react";

import { GithubOutlined } from "@ant-design/icons";
import { Link } from "@tanstack/react-router";
import { RECORD_SITE } from "../common/host.ts";

const footerLinks: {
  icon?: ReactNode;
  text: string;
  link: string;
}[] = [
  {
    icon: <GithubOutlined />,
    text: "GitHub",
    link: "https://github.com/ijiazz/ijia_webside",
  },
  {
    text: "更新日志",
    link: `${RECORD_SITE}/updates/`,
  },
  {
    text: "关于本站",
    link: "/about",
  },
  {
    text: "为本站贡献",
    link: "/about/#contribute",
  },
];
export function Footer() {
  return (
    <div className={FooterCSS}>
      {footerLinks.map((item, index) => {
        return (
          <Link key={index + item.link} className="link-item" to={item.link} target={"_blank"} viewTransition>
            {item.icon}
            {" " + item.text}
          </Link>
        );
      })}
    </div>
  );
}

const FooterCSS = css`
  padding: 12px;
  background-color: #909090;
  .link-item {
    font-size: 12px;
    color: #fff;
  }
  display: flex;
  gap: 24px;
  justify-content: center;
  flex-wrap: wrap;
`;
function isExternalSite(linkOrPath: string) {
  if (/^[\.\/]/.test(linkOrPath)) return false;
  return true;
}
