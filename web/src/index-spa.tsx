/// <reference types="vite/client" />
import "./styles/global.css";
import "@/common/clarity.ts";
import { loginByAccessToken } from "@/common/user.ts";
import { createRoot } from "react-dom/client";
import { SpaRoot } from "./router.tsx";
import { REQUEST_AUTH_KEY } from "./api.ts";
console.log("应用运行于 SPA 模式");
const mountApp = () => {
  createRoot(document.getElementById("app")!).render(<SpaRoot />);
};
paseAccessToken();
mountApp();

function paseAccessToken() {
  const url = new URL(location.href);
  const access_token = url.searchParams.get(REQUEST_AUTH_KEY);
  if (access_token) {
    loginByAccessToken(access_token);
    url.searchParams.delete(REQUEST_AUTH_KEY);
    location.replace(url);
  }
}
