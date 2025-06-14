import { ConfigProvider, message, notification, Modal, ThemeConfig } from "antd";
import React, { PropsWithChildren, createContext, useContext, useMemo, useState } from "react";

import type { MessageInstance } from "antd/es/message/interface.js";
import type { NotificationInstance } from "antd/es/notification/interface.js";
import type { HookAPI } from "antd/es/modal/useModal/index.js";
import { theme } from "antd";
import { ijiaLocalStorage } from "@/stores/local_store.ts";
import zh_CN from "antd/es/locale/zh_CN.js";
import type { Locale } from "antd/es/locale/index.js";

function AntdStaticProvider(props: PropsWithChildren<{}>) {
  const [messageApi, messageSlot] = message.useMessage({});
  const [noticeApi, noticeSlot] = notification.useNotification({});
  const [modalApi, modalSlot] = Modal.useModal();
  const staticMethod = useMemo(() => {
    return { message: messageApi, notice: noticeApi, modal: modalApi };
  }, [messageApi, noticeApi, modalApi]);
  return (
    <AntdContext value={staticMethod}>
      {messageSlot}
      {noticeSlot}
      {modalSlot} {props.children}
    </AntdContext>
  );
}

const AntdContext = createContext<{ message: MessageInstance; notice: NotificationInstance; modal: HookAPI }>(
  undefined as any,
);

export function AntdThemeProvider(props: PropsWithChildren<{ fixedMode?: ThemeMode }>) {
  const { fixedMode } = props;
  const color = "#16b3e7";

  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    const mode = fixedMode || ((ijiaLocalStorage.themeMode || "light") as ThemeMode);
    const algorithm = mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm;
    setScrollColor(mode);
    return {
      cssVar: true,
      algorithm: algorithm,
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

export function useAntdStatic() {
  return useContext(AntdContext);
}
export function useThemeToken() {
  return theme.useToken().token;
}
export function useThemeController() {
  return useContext(ThemeContext);
}
