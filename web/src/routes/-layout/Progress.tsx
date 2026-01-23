import { useRouterState } from "@tanstack/react-router";
import styles from "./Progress.module.css";
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
    <div className={isLoading ? styles.navigateLoading : styles.navigateLoadingHide}>
      <div />
    </div>
  );
}
