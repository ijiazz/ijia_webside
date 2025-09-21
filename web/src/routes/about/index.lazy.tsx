import { createLazyFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import React from "react";
import { Tabs, TabsProps } from "antd";
import { AboutSite } from "./-components/about-site.tsx";
import { Contribute } from "./-components/contribute.tsx";
import { AboutAuthor } from "./-components/author.tsx";
import { Footer } from "@/common/Footer.tsx";

export const Route = createLazyFileRoute("/about/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { hash } = useLocation();
  return (
    <>
      <div style={{ minHeight: "100%", padding: "0 24px" }}>
        <Tabs
          size="small"
          tabPosition="right"
          activeKey={hash}
          onChange={(key) => {
            navigate({ to: "./#" + key });
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
