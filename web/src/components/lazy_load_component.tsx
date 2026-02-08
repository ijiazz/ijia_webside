import { lazyComponent } from "@/lib/lazy_component.tsx";
import React, { ComponentType, FunctionComponent, Suspense } from "react";
import { PageLoading } from "./page_state.tsx";

export function lazyPage<T extends ComponentType<any>>(load: () => Promise<T>): T;
export function lazyPage<T extends ComponentType<any>, Mod extends {}>(
  load: () => Promise<Mod>,
  pick: (mod: Mod) => T,
): T;
export function lazyPage(load: () => Promise<any>, pick?: (mod: any) => any): FunctionComponent<any>;
export function lazyPage(load: () => Promise<any>, pick?: (mod: any) => any): FunctionComponent<any> {
  const LazyComponent = lazyComponent(load, pick);
  return function LazyLoading(props) {
    return <Suspense fallback={<PageLoading />}>{React.createElement(LazyComponent, props, props.children)}</Suspense>;
  };
}
