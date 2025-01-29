import { createRoot } from "react-dom/client";
import { router } from "./pages/mod.tsx";
import { RouterProvider } from "react-router-dom";
import React from "react";

createRoot(document.getElementById("app")!).render(<RouterProvider router={router}></RouterProvider>);
