import { CatchBoundary } from "@tanstack/react-router";
import { PropsWithChildren } from "react";
import { captureException } from "@sentry/react";
import { ErrorPage } from "./ErrorPage.tsx";

export type ErrorBoundaryProps = PropsWithChildren<{
  getResetKey?: (() => number | string) | (string | number);
}>;

/**
 * 自动处理错误边界，捕获错误并上报到 Sentry，同时显示错误页面。
 */
export function ErrorBoundary(props: ErrorBoundaryProps) {
  const { getResetKey = "", children } = props;
  return (
    <CatchBoundary
      getResetKey={() => (typeof getResetKey === "function" ? getResetKey() : getResetKey)}
      onCatch={(error) => captureException(error)}
      errorComponent={({ error, reset, info }) => <ErrorPage error={error} reset={reset} info={info?.componentStack} />}
    >
      {children}
    </CatchBoundary>
  );
}
