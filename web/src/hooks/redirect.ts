import { useSearchParams } from "react-router";

export function useRedirect(option: { key?: string; defaultPath?: string } = {}) {
  const { defaultPath, key = "redirect" } = option;
  const [searchParams] = useSearchParams();
  return function () {
    const path = searchParams.get(key) ?? defaultPath;
    if (path && /^[\.\/]/.test(path)) {
      location.href = location.origin + path;
    }
  };
}
