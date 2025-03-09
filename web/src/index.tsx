/// <reference types="vite/client" />
import "@ant-design/v5-patch-for-react-19";
import "./styles/global.css";

import { createRoot } from "react-dom/client";
import { RouterRoot } from "./router-root.tsx";
import { HoFetchProvider, AntdProvider } from "./global-provider.tsx";
import { HashRouter } from "react-router";

createRoot(document.getElementById("app")!).render(
  <AntdProvider>
    <HashRouter>
      <HoFetchProvider>
        <RouterRoot />
      </HoFetchProvider>
    </HashRouter>
  </AntdProvider>,
);
