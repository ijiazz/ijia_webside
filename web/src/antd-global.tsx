import { ConfigProvider, theme, message, notification, Modal } from "antd";
import { PropsWithChildren } from "react";
import { antdStatic } from "@/hooks/antd-static.ts";
export const useToken = theme.useToken;

export function AntdGlobal(props: PropsWithChildren<{}>) {
  const [messageApi, messageSlot] = message.useMessage({});
  const [noticeApi, noticeSlot] = notification.useNotification({});
  const [modalApi, modalSlot] = Modal.useModal();
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#16b3e7",
          colorInfo: "#16b3e7",
          borderRadius: 4,
        },
      }}
    >
      {messageSlot}
      {noticeSlot}
      {modalSlot}
      <antdStatic.Provider value={{ message: messageApi, notice: noticeApi, modal: modalApi }}>
        {props.children}
      </antdStatic.Provider>
    </ConfigProvider>
  );
}
