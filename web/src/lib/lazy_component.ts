import React from "react";

type LazyComponent<T> = T extends React.ComponentType<any> ? React.LazyExoticComponent<T> : never;

export function lazyComponent<T, K extends keyof T>(mod: () => Promise<T>): LazyComponent<T[K]>;
export function lazyComponent<T, K extends keyof T>(mod: () => Promise<T>, key: K): LazyComponent<T[K]>;
export function lazyComponent<T extends { default: any }, K extends keyof T>(
  mod: () => Promise<T>,
  key?: K,
): LazyComponent<T[K]> | LazyComponent<T["default"]>;
export function lazyComponent(load: () => Promise<any>, key: string = "default"): LazyComponent<any> {
  return React.lazy(() => {
    return load().then((res) => {
      return { default: res[key] };
    });
  });
}
