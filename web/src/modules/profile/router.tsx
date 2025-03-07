import { Route, Routes } from "react-router";
import { lazyComponent } from "@/lib/lazy_component.ts";

const BasicInfoPage = lazyComponent(
  () => import("./pages/BasicInfo.tsx"),
  (mod) => mod.BasicInfoPage,
);

export function ProfileRouter() {
  return (
    <Routes>
      <Route path="basic" Component={BasicInfoPage}></Route>
    </Routes>
  );
}
