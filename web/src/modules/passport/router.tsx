import { Signin } from "./pages/signin.tsx";
import { LoginPage } from "./pages/login.tsx";
import { Route, Routes } from "react-router";

export function Passport() {
  return (
    <Routes>
      <Route path="login" Component={LoginPage}></Route>
      <Route path="signin" Component={Signin}></Route>
    </Routes>
  );
}
