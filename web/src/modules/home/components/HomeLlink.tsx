import React, { CSSProperties, PropsWithChildren, ReactNode, useMemo } from "react";
import { Link } from "react-router";
import styled from "@emotion/styled";
import { ExportOutlined } from "@ant-design/icons";
import { Dropdown } from "antd";

export type HomeLinkProps = {
  blackMode?: boolean;
  style?: CSSProperties;
  className?: string;
  background?: string;
};
export function HomeLinks(props: HomeLinkProps) {
  const { blackMode, background } = props;
  const items = useMemo(() => {
    const color = blackMode ? "#fff" : "#000";
    return links.map((item): ReactNode => {
      const key = item.href + item.title;
      if (item.children) {
        return (
          <Hover color={color} key={key}>
            <Dropdown
              dropdownRender={(menu) => <StyledDropdown>{menu}</StyledDropdown>}
              menu={{
                items: item.children.map((child) => ({
                  key: child.href,
                  label: (
                    <Link target={child.open ? "_blank" : undefined} to={child.href} viewTransition>
                      {child.icon}
                      {child.title}
                    </Link>
                  ),
                })),
              }}
            >
              <span>
                {item.icon} {item.title}
              </span>
            </Dropdown>
          </Hover>
        );
      }
      return (
        <Hover color={color} key={key}>
          <Link to={item.href} viewTransition target={item.open ? "_blank" : undefined}>
            {item.icon}
            {item.title}
          </Link>
        </Hover>
      );
    });
  }, [links, blackMode]);
  return (
    <HomeLinksCSS {...props} style={{ backdropFilter: background ? "blur(3px)" : undefined }}>
      <div className="home-link home-link-left"></div>
      <div className="home-link home-link-right">{items}</div>
    </HomeLinksCSS>
  );
}
const StyledDropdown = styled.div`
  .ant-dropdown-menu {
    background-color: #0004;
    padding: 0;
    .ant-dropdown-menu-item {
      :hover {
        background-color: #0000005e;
      }
    }
  }
  .ant-dropdown-menu-title-content {
    color: #fff;
  }
`;
type LinkItem = {
  href: string;
  title: string;
  icon?: ReactNode;
  open?: boolean;
};
type ChildrenLink = {
  children?: LinkItem[];
} & LinkItem;

const links: ChildrenLink[] = [
  { title: "IJIA 学院", href: "./live" },
  { title: "入学指南", href: "./guide/join" },
  { title: "学院简介", href: "./guide" },
  {
    title: "友链",
    href: "./live",
    icon: <ExportOutlined />,
    children: [
      {
        href: "https://jiajiazi.love",
        title: "佳佳子的网站",
        open: true,
      },
    ],
  },
];

const HomeLinksCSS = styled.div<{ blackMode?: boolean; background?: string }>`
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  align-items: center;
  pointer-events: all;
  background-color: ${({ background }) => background || "transparent"};
  a {
    color: ${({ blackMode }) => (blackMode ? "#fff" : "#000")};
    text-decoration: none;
    cursor: pointer;
  }
  .home-link {
    padding: 6px 12px;
    display: flex;
    > * {
      padding-left: max(12px, 4%);
      padding-right: max(12px, 4%);
    }
  }
  .home-link-left {
  }
  .home-link-right {
    flex: 1;
    justify-content: flex-end;
  }
`;

const Hover = (props: PropsWithChildren<{ style?: CSSProperties; color?: string }>) => {
  return (
    <StyledWrapper style={props.style} color={props.color}>
      <button className="cta">
        <span className="hover-underline-animation"> {props.children} </span>
      </button>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div<{ color?: string }>`
  --color: ${(props) => props.color || "#fff"};
  .cta {
    border: none;
    background: none;
    cursor: pointer;
  }

  .cta span {
    padding-bottom: 7px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--color);
    text-shadow: 0 0 10px #fff;
  }

  .hover-underline-animation {
    position: relative;
    padding-bottom: 20px;
  }

  .hover-underline-animation:after {
    content: "";
    position: absolute;
    width: 100%;
    transform: scaleX(0);
    height: 2px;
    bottom: 0;
    left: 0;
    background-color: var(--color);
    transform-origin: bottom right;
    transition: transform 0.25s ease-out;
  }

  .cta:hover .hover-underline-animation:after {
    transform: scaleX(1);
    transform-origin: bottom left;
  }
`;
