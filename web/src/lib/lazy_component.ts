import React from "react";

export function lazyComponent<T extends React.ComponentType<any>>(
  mod: () => Promise<{ default: T }>,
): React.LazyExoticComponent<T>;
export function lazyComponent<T extends React.ComponentType<any>, C>(
  mod: () => Promise<C>,
  pick: (mod: C) => T,
): React.LazyExoticComponent<T>;
export function lazyComponent(
  load: () => Promise<any>,
  pick?: (mod: any) => React.ComponentType<any>,
): React.LazyExoticComponent<any> {
  if (!pick) return React.lazy(load);

  return React.lazy(() => {
    return load().then((res) => {
      return { default: pick(res) };
    });
  });
}
