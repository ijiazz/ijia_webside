import { createContext } from "react";
import type { MessageInstance } from "antd/es/message/interface.js";
import type { NotificationInstance } from "antd/es/notification/interface.js";
import type { HookAPI } from "antd/es/modal/useModal/index.js";

export const antdStatic = createContext<{ message: MessageInstance; notice: NotificationInstance; modal: HookAPI }>(
  undefined as any,
);
