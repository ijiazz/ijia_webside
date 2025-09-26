/// <reference types="vite/client" />
import "./styles/global.css";
import "./clarity.ts";
import React from "react";
import { loginByAccessToken } from "@/common/user.ts";
import { createRoot } from "react-dom/client";
import { SpaRoot } from "./router.tsx";

console.log("应用运行于 SPA 模式");
const mountApp = () => {
  createRoot(document.getElementById("app")!).render(<SpaRoot />);
};
paseAccessToken();
mountApp();

function paseAccessToken() {
  const url = new URL(location.href);
  const access_token = url.searchParams.get("access_token");
  if (access_token) {
    loginByAccessToken(access_token);
    url.searchParams.delete("access_token");
    location.replace(url);
  }
}
