import { createContext, useContext } from "react";
import type { MessageInstance } from "antd/es/message/interface.js";
import type { NotificationInstance } from "antd/es/notification/interface.js";
import type { HookAPI } from "antd/es/modal/useModal/index.js";
import { theme } from "antd";
export const AndContext = createContext<{ message: MessageInstance; notice: NotificationInstance; modal: HookAPI }>(
  undefined as any,
);
export function useAntdStatic() {
  return useContext(AndContext);
}
export function useThemeToken() {
  return theme.useToken().token;
}
