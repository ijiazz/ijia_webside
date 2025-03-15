/// <reference types="vite/client" />
import "@ant-design/v5-patch-for-react-19";
import "./styles/global.css";

import { createRoot } from "react-dom/client";
import { RouterRoot } from "./router-root.tsx";
import { HoFetchProvider, AntdProvider } from "./global-provider.tsx";
import { HashRouter } from "react-router";
import { loginByAccessToken } from "./common/user.ts";

paseAccessToken();

createRoot(document.getElementById("app")!).render(
  <AntdProvider>
    <HashRouter>
      <HoFetchProvider>
        <RouterRoot />
      </HoFetchProvider>
    </HashRouter>
  </AntdProvider>,
);

function paseAccessToken() {
  const url = new URL(location.href);
  const access_token = url.searchParams.get("access_token");
  if (access_token) {
    loginByAccessToken(access_token);
    url.searchParams.delete("access_token");
    location.replace(url);
  }
}
