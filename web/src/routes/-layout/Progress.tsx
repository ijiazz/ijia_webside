import { useRouterState } from "@tanstack/react-router";
import React from "react";

function useRouterProgress() {
  const isLoading = useRouterState({
    select(state) {
      return state.status === "pending";
    },
  });
  return isLoading;
}

export function RouterProgress() {
  const isLoading = useRouterProgress();
  return (
    <div className={isLoading ? "navigate-loading" : "navigate-loading-hide"}>
      <div />
    </div>
  );
}
