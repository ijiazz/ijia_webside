import { useNavigate, useSearchParams } from "react-router";

export function useRouterRedirect(option: { key?: string; defaultPath?: string } = {}) {
  const { defaultPath, key = "redirect" } = option;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  return function () {
    const path = searchParams.get(key) ?? defaultPath;
    if (path && /^[\.\/]/.test(path)) navigate(path);
  };
}
