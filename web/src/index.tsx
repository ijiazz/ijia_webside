/// <reference types="vite/client" />
import "./styles/global.css";

import { createRoot } from "react-dom/client";
import { createRouterRoot } from "./router-root.tsx";
import { AntdGlobal } from "./antd-global.tsx";

createRoot(document.getElementById("app")!).render(<AntdGlobal>{createRouterRoot()}</AntdGlobal>);
