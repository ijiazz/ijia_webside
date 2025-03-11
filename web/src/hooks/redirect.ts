import { useSearchParams } from "react-router";

export type RedirectOption = {
  /** url 查询参数的 key */
  key?: string;
  /** 如果无法通过 key 从 URLSearchParam 获取到地址，则使用 defaultPath  */
  defaultPath?: string | (() => string);
};
export function useRedirect(option: RedirectOption = {}) {
  const { defaultPath, key = "redirect" } = option;
  const [searchParams] = useSearchParams();
  return function () {
    let path = searchParams.get(key);

    if (!path && defaultPath) {
      if (typeof defaultPath === "string") path = defaultPath;
      else path = defaultPath();
    }

    if (path && /^[\.\/]/.test(path)) {
      location.href = location.origin + path;
    }
  };
}
