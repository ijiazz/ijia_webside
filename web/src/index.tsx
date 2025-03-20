/// <reference types="vite/client" />
import "@ant-design/v5-patch-for-react-19";
import "./styles/global.css";

import { createRoot } from "react-dom/client";
import routerRoot from "./router-root.tsx";
import { RouterProvider } from "react-router";
import { loginByAccessToken } from "./common/user.ts";

paseAccessToken();
mountApp();

function mountApp() {
  createRoot(document.getElementById("app")!).render(<RouterProvider router={routerRoot}></RouterProvider>);
}
function paseAccessToken() {
  const url = new URL(location.href);
  const access_token = url.searchParams.get("access_token");
  if (access_token) {
    loginByAccessToken(access_token);
    url.searchParams.delete("access_token");
    location.replace(url);
  }
}
