import { Button, Result } from "antd";
import React from "react";
import { RouteObject } from "react-router";

export function NotFoundPage() {
  return <Result status="404" title="404" subTitle="Sorry, the page you visited does not exist." />;
}
export const notFoundRouter: RouteObject = {
  path: "*",
  Component: NotFoundPage,
};
