/// <reference types="vite/client" />
import "@ant-design/v5-patch-for-react-19";
import "./styles/global.css";
import React from "react";

import { hydrateRoot } from "react-dom/client";
import { RouterClient } from "@tanstack/react-router/ssr/client";
import { genRouter, SsrRootWarp } from "./router.tsx";
import { removeLoading } from "./app.ts";

console.log("应用运行于 SSR 模式");
const mountApp = () => {
  const router = genRouter();
  hydrateRoot(
    document,
    <SsrRootWarp>
      <RouterClient router={router} />
    </SsrRootWarp>,
  );
};

mountApp();
removeLoading();
