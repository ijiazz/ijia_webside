import { ConfigProvider, message, notification, Modal } from "antd";
import React, { PropsWithChildren, createContext, useContext } from "react";

import type { MessageInstance } from "antd/es/message/interface.js";
import type { NotificationInstance } from "antd/es/notification/interface.js";
import type { HookAPI } from "antd/es/modal/useModal/index.js";
import { theme } from "antd";

export function AntdProvider(props: PropsWithChildren<{}>) {
  const [messageApi, messageSlot] = message.useMessage({});
  const [noticeApi, noticeSlot] = notification.useNotification({});
  const [modalApi, modalSlot] = Modal.useModal();
  const color = "#16b3e7";
  return (
    <ConfigProvider
      theme={{
        cssVar: true,
        token: {
          colorPrimary: color,
          colorInfo: color,
          borderRadius: 4,
        },
      }}
    >
      {messageSlot}
      {noticeSlot}
      {modalSlot}
      <AntdContext value={{ message: messageApi, notice: noticeApi, modal: modalApi }}>{props.children}</AntdContext>
    </ConfigProvider>
  );
}
const AntdContext = createContext<{ message: MessageInstance; notice: NotificationInstance; modal: HookAPI }>(
  undefined as any,
);
export function useAntdStatic() {
  return useContext(AntdContext);
}
export function useThemeToken() {
  return theme.useToken().token;
}
