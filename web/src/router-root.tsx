import { Route, Routes, Outlet } from "react-router";
import { Passport } from "./modules/passport/router.tsx";
import { ProfileRouter } from "./modules/profile/router.tsx";
import { TabHeader } from "./common/layout/header.tsx";

export function RouterRoot() {
  return (
    <Routes>
      <Route index element={<div>home</div>} />
      <Route path="passport/*" Component={Passport} />
      <Route
        element={
          <TabHeader>
            <Outlet />
          </TabHeader>
        }
        errorElement={<div>页面不存在</div>}
      >
        <Route path="live/*" element={<div>examination</div>} />
        <Route path="profile/*" Component={ProfileRouter} />
        <Route path="examination/*" element={<div>examination</div>} />
      </Route>
    </Routes>
  );
}
