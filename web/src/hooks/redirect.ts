import { useLocation } from "@tanstack/react-router";

export type RedirectOption = {
  /** url 查询参数的 key */
  key?: string;
  /** 如果无法通过 key 从 URLSearchParam 获取到地址，则使用 defaultPath  */
  defaultPath?: string | (() => string);
};

/**
 * 返回一个函数，调用后根据 searchParams 中的 key 跳转到指定地址，redirect 地址只能是路径，不能是完整 URL
 */
export function useRedirect(option: RedirectOption = {}) {
  const { defaultPath, key = "redirect" } = option;
  const { search } = useLocation<any>();
  return function () {
    let path = search[key];

    if (!path && defaultPath) {
      if (typeof defaultPath === "string") path = defaultPath;
      else path = defaultPath();
    }

    if (path && /^[\.\/]/.test(path)) {
      location.href = path;
    }
  };
}
