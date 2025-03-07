import { Route, HashRouter, Routes } from "react-router";
import { Passport } from "./modules/passport/router.tsx";
import { ProfileRouter } from "./modules/profile/router.tsx";

function RouterRoot() {
  return (
    <Routes>
      <Route index element={<div>home</div>} />
      <Route path="test" element={<div>test</div>} />
      <Route path="passport/*" Component={Passport} />
      <Route path="profile/*" Component={ProfileRouter} />
    </Routes>
  );
}
export function createRouterRoot() {
  return (
    <HashRouter>
      <RouterRoot />
    </HashRouter>
  );
}
