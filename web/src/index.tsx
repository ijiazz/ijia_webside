import { createRoot } from "react-dom/client";
import { routerRoot } from "./router-root.tsx";

createRoot(document.getElementById("app")!).render(routerRoot);
