import { lazy, ComponentType } from "react";

export function lazyComponent<T extends ComponentType<any>>(loader: () => Promise<{ default: T }>): T;
export function lazyComponent<T extends ComponentType<any>, C>(loader: () => Promise<C>, pick: (mod: C) => T): T;
export function lazyComponent<T extends ComponentType<any>>(
  load: () => Promise<any>,
  pick?: (mod: any) => ComponentType<any>,
): T;
export function lazyComponent(load: () => Promise<any>, pick?: (mod: any) => ComponentType<any>): ComponentType<any> {
  if (!pick) return lazy(load);
  return lazy(lazyLoader(load, pick));
}
function lazyLoader<T extends React.ComponentType<any>, C>(
  load: () => Promise<C>,
  pick: (mod: C) => T,
): () => Promise<{ default: T }> {
  return () => {
    return load().then((res) => {
      return { default: pick(res) };
    });
  };
}
