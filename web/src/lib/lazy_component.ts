import { lazy, ComponentType } from "react";

export function lazyComponent<T extends ComponentType<any>>(loader: () => Promise<T>): T;
export function lazyComponent<T extends ComponentType<any>, C>(loader: () => Promise<C>, pick: (mod: C) => T): T;
export function lazyComponent<T extends ComponentType<any>>(
  load: () => Promise<any>,
  pick?: (mod: any) => ComponentType<any>,
): T;
export function lazyComponent(load: () => Promise<any>, pick?: (mod: any) => ComponentType<any>): ComponentType<any> {
  return lazy(() => {
    return load().then((res) => {
      return { default: pick ? pick(res) : res };
    });
  });
}
