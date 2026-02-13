import { CSSProperties, PropsWithChildren, ReactNode, useMemo } from "react";
import { cx } from "@emotion/css";
import { ExportOutlined } from "@ant-design/icons";
import { Dropdown } from "antd";
import { Link } from "@tanstack/react-router";
import * as styles from "./HomeLink.css.ts";

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
              open
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
              classNames={{
                root: styles.Dropdown,
              }}
            >
              <span className={styles.LinkItem} style={{ color: blackMode ? "#fff" : "#000" }}>
                {item.icon} {item.title}
              </span>
            </Dropdown>
          </Hover>
        );
      }
      return (
        <Link to={item.href} key={key} viewTransition target={item.open ? "_blank" : undefined}>
          <Hover color={color} className={styles.LinkItem} style={{ color: blackMode ? "#fff" : "#000" }}>
            {item.icon}
            {item.title}
          </Hover>
        </Link>
      );
    });
  }, [links, blackMode]);
  return (
    <div
      {...props}
      className={cx(styles.HomeLinks, props.className)}
      style={{
        backdropFilter: background ? "blur(3px)" : undefined,
        backgroundColor: background || "transparent",
        ...props.style,
      }}
    >
      {/* <div className={cx(styles.HomeLink, "home-link-left")}></div> */}
      <div className={cx(styles.HomeLink, "home-link-right")}>{items}</div>
    </div>
  );
}

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
  { title: "IJIA 学院", href: "./wall" },
  { title: "入学指南", href: "./about/guide", open: true },
  { title: "学院简介", href: "./about/introduction", open: true },
  {
    title: "友链",
    href: "./live",
    icon: <ExportOutlined />,
    children: [
      {
        href: "https://jiajiazi.love",
        title: "佳时光",
      },
    ],
  },
];

const Hover = (props: PropsWithChildren<{ style?: CSSProperties; color?: string; className?: string }>) => {
  return (
    <div
      style={{
        "--color": props.color || "#fff",
        ...props.style,
      }}
      className={cx(styles.Hover, props.className)}
    >
      <button className="cta">
        <span className="hover-underline-animation"> {props.children} </span>
      </button>
    </div>
  );
};
