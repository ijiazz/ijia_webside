import React, { lazy, ComponentType } from "react";

export function lazyComponent<T extends ComponentType<any>>(loader: () => Promise<T>): T;
export function lazyComponent<T extends ComponentType<any>, C>(loader: () => Promise<C>, pick: (mod: C) => T): T;
export function lazyComponent<T extends ComponentType<any>>(
  load: () => Promise<any>,
  pick?: (mod: any) => ComponentType<any>,
): T;
export function lazyComponent(load: () => Promise<any>, pick?: (mod: any) => ComponentType<any>): ComponentType<any> {
  return lazy(() => {
    return load().then(
      (res) => {
        return { default: pick ? pick(res) : res };
      },
      (e) => {
        return {
          default: () => <LazyLoadError error={e} />,
        };
      },
    );
  });
}
function LazyLoadError(props: { error: Error }) {
  const { error } = props;
  return (
    <div
      style={{
        padding: 12,
        fontSize: 12,
        background: "#914541",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        width: "100%",
        gap: 12,
        color: "#fff",
      }}
    >
      <b style={{ fontSize: 16 }}>模块加载失败</b>
      <span>
        你可以尝试
        <b onClick={() => window.location.reload()} style={{ color: "#76d5f5" }}>
          刷新
        </b>
        页面
      </span>
      <div style={{ color: "#ffeac8", fontSize: 12, whiteSpace: "pre" }}>{errorToStr(error)}</div>
    </div>
  );
}
function errorToStr(err: any) {
  if (err instanceof Error) {
    return err.stack || err.message;
  }
  if (typeof err === "string") {
    return err;
  }
  if (typeof err === "object") {
    return JSON.stringify(err, null, 2);
  }
  return String(err);
}
