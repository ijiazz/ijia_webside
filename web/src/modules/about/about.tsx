import React from "react";
import { Tabs, TabsProps } from "antd";
import { useLocation, useNavigate } from "react-router";
import { AboutSite } from "./pages/site/about-site.tsx";
import { Contribute } from "./pages/site/contribute.tsx";
import { AboutAuthor } from "./pages/site/author.tsx";
import { Footer } from "@/common/Footer.tsx";

export function About() {
  const navigate = useNavigate();
  const { hash } = useLocation();

  return (
    <>
      <div style={{ minHeight: "100%", padding: "0 24px" }}>
        <Tabs
          size="small"
          tabPosition="right"
          activeKey={hash.slice(1)}
          onChange={(key) => {
            navigate("./#" + key, { relative: "path", viewTransition: true });
          }}
          items={catalogue}
        />
      </div>
      <Footer />
    </>
  );
}

const catalogue: TabsProps["items"] = [
  {
    key: "",
    label: "关于本站",
    children: <AboutSite />,
  },
  {
    key: "contribute",
    label: "为本站贡献",
    children: <Contribute />,
  },
  { key: "author", label: "关于作者", children: <AboutAuthor /> },
];
