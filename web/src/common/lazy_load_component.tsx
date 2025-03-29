import { lazyComponent } from "@/lib/lazy_component.ts";
import React, { ComponentType, Suspense, createElement } from "react";
import { PageLoading } from "./page_state/Loading.tsx";

export function appLazy<T extends ComponentType<any>>(load: () => Promise<{ default: T }>): ComponentType<any>;
export function appLazy<T extends ComponentType<any>, Mod extends {}>(
  load: () => Promise<Mod>,
  pick: (mod: Mod) => T,
): ComponentType<any>;
export function appLazy(load: () => Promise<any>, pick?: (mod: any) => any): ComponentType<any>;
export function appLazy(load: () => Promise<any>, pick?: (mod: any) => any): ComponentType<any> {
  return function LazyLoading(props) {
    return createElement(Suspense, { fallback: <PageLoading /> }, createElement(lazyComponent(load, pick), props));
  };
}
