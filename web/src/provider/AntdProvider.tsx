import { ConfigProvider, message, notification, ThemeConfig } from "antd";
import { PropsWithChildren, createContext, useContext, useMemo, useState } from "react";

import type { MessageInstance } from "antd/es/message/interface.js";
import type { NotificationInstance } from "antd/es/notification/interface.js";
import { theme } from "antd";
import { ijiaLocalStorage } from "@/stores/local_store.ts";
import zh_CN from "antd/es/locale/zh_CN.js";
import type { Locale } from "antd/es/locale/index.js";
import { ModalProvider } from "@/components/Modal/static.tsx";
import { StaticImagePreviewProvider } from "@/components/Modal/staticImagePreview.tsx";

export function AntdStaticProvider(props: PropsWithChildren<{}>) {
  const [messageApi, messageSlot] = message.useMessage({});
  const [noticeApi, noticeSlot] = notification.useNotification({});

  return (
    <MessageContext value={messageApi}>
      <NoticeContext value={noticeApi}>
        <StaticImagePreviewProvider>
          <ModalProvider>
            {messageSlot}
            {noticeSlot}
            {props.children}
          </ModalProvider>
        </StaticImagePreviewProvider>
      </NoticeContext>
    </MessageContext>
  );
}
const NoticeContext = createContext<NotificationInstance>(undefined as any);

const MessageContext = createContext<MessageInstance>(undefined as any);

export function AntdThemeProvider(props: PropsWithChildren<{ fixedMode?: ThemeMode }>) {
  const { fixedMode } = props;
  const color = "#16b3e7";

  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    const mode = fixedMode || ((ijiaLocalStorage.themeMode || "light") as ThemeMode);
    const algorithm = mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm;
    setScrollColor(mode);
    return {
      algorithm: algorithm,
      hashed: false,
      zeroRuntime: true,
      token: {
        colorPrimary: color,
        colorInfo: color,
        borderRadius: 4,
      },
    };
  });

  const themeController: ThemeController = useMemo(() => {
    return {
      themeConfig,
      changeTheme: setThemeConfig,
      mode: themeConfig.algorithm === theme.darkAlgorithm ? "dark" : "light",
      setMode: (mode: ThemeMode) => {
        if (fixedMode) return;
        ijiaLocalStorage.themeMode = mode;
        setScrollColor(mode);
        setThemeConfig((prev) => ({
          ...prev,
          algorithm: mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
        }));
      },
      changePreset: () => {},
    };
  }, [themeConfig]);
  return (
    <ConfigProvider theme={themeConfig} locale={zh_CN as any as Locale}>
      <AntdStaticProvider>
        <ThemeContext value={themeController}>{props.children}</ThemeContext>
      </AntdStaticProvider>
    </ConfigProvider>
  );
}
const ThemeContext = createContext<ThemeController>(undefined as any);

function setScrollColor(mode: ThemeMode) {
  if (!globalThis.document) return;
  let scrollBarColor: string;
  let scrollBarBgColor: string;
  if (mode === "dark") {
    scrollBarBgColor = "#212121";
    scrollBarColor = "#5c5c5c";
  } else {
    scrollBarBgColor = "#ffffff";
    scrollBarColor = "#b0b0b0";
  }

  document.documentElement.style.setProperty("--scrollbar-bgColor", scrollBarBgColor);
  document.documentElement.style.setProperty("--scrollbar-color", scrollBarColor);
}
type ThemeMode = "dark" | "light";
export type ThemeController = {
  themeConfig: ThemeConfig;
  mode: ThemeMode;
  setMode(mode: ThemeMode): void;
  changeTheme(theme: ThemeConfig): void;
};
export function useMessage() {
  return useContext(MessageContext);
}
export function useNotification() {
  return useContext(NoticeContext);
}
/** 改用 useMessage */
export function useAntdStatic(): { message: MessageInstance } {
  const message = useContext(MessageContext);
  return { message };
}
export function useThemeToken() {
  return theme.useToken().token;
}
export function useThemeController() {
  return useContext(ThemeContext);
}
