import styled from "@emotion/styled";
import React from "react";
import { Link } from "react-router";

export function Footer() {
  return (
    <FooterCSS>
      {footerLinks.map((item, index) => {
        return (
          <div key={index + item.link}>
            <Link
              className="link-item"
              key={item.text}
              to={item.link}
              target={isExternalSite(item.link) ? "_blank" : undefined}
              viewTransition
            >
              {item.text}
            </Link>
          </div>
        );
      })}
    </FooterCSS>
  );
}
const footerLinks: {
  text: string;
  link: string;
}[] = [
  {
    text: "GitHub",
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
const FooterCSS = styled.div`
  background-color: #626262;
  .link-item {
    font-size: 12px;
    color: #fff;
  }
  display: flex;
  flex-direction: column;
`;
function isExternalSite(linkOrPath: string) {
  if (/^[\.\/]/.test(linkOrPath)) return false;
  return true;
}
