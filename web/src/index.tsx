/// <reference types="vite/client" />
import "@ant-design/v5-patch-for-react-19";
import "./styles/global.css";

import { createRoot } from "react-dom/client";
import { createRouterRoot } from "./router-root.tsx";
import { HoFetchProvider, AntdProvider } from "./global-provider.tsx";

createRoot(document.getElementById("app")!).render(
  <AntdProvider>
    <HoFetchProvider>{createRouterRoot()}</HoFetchProvider>
  </AntdProvider>,
);
