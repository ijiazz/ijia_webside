import { Route, HashRouter, Routes } from "react-router";

function RouterRoot() {
  return (
    <Routes>
      <Route index element={<div>home</div>} />
      <Route path="test" element={<div>test</div>} />
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
