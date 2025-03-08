import { Route, Routes } from "react-router";
import { lazyComponent } from "@/lib/lazy_component.ts";

const LoginPage = lazyComponent(
  () => import("./pages/login.tsx"),
  (mod) => mod.LoginPage,
);
const SignupPage = lazyComponent(
  () => import("./pages/signup.tsx"),
  (mod) => mod.Signup,
);

export function Passport() {
  return (
    <Routes>
      <Route path="login" Component={LoginPage}></Route>
      <Route path="signup" Component={SignupPage}></Route>
    </Routes>
  );
}
