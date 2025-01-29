import React from "react";
import { createHashRouter, RouterProvider, createRoutesFromElements, Route } from "react-router-dom";

function Root() {
  return (
    <Route path="/">
      <div>hhh</div>
    </Route>
  );
}

export const router = createHashRouter(createRoutesFromElements(<Root />));
