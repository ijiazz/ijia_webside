import { ConfigProvider, message, notification, Modal } from "antd";
import React, { PropsWithChildren, useContext, useEffect } from "react";
import { AntdContext } from "@/hooks/antd.ts";
import {
  getResponseErrorInfo,
  apiEvent,
  ApiEvent,
  ApiErrorEvent,
  IGNORE_UNAUTHORIZED_REDIRECT,
} from "@/common/http.ts";
import { useNavigate } from "react-router";
import { getUrlByRoute, ROUTES } from "./app.ts";

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

export function HoFetchProvider(props: PropsWithChildren<{}>) {
  const { message } = useContext(AntdContext);
  const navigate = useNavigate();
  useEffect(() => {
    const error = (event: Event) => {
      const { ctx, body, response: res } = event as ApiErrorEvent;
      const err = getResponseErrorInfo(body);
      if (err) {
        const isHtml = res.headers.get("content-type")?.startsWith("text/html");
        if (err.message && !isHtml) message.error(err.message);
        else message.error(res.status);
      }

      if (res.status === 401 && err?.code === "REQUIRED_LOGIN" && !ctx[IGNORE_UNAUTHORIZED_REDIRECT]) {
        const s = new URLSearchParams();
        const url = new URL(location.href);
        const target = url.pathname + url.search + url.hash;
        const isLoginPage = location.href.startsWith(getUrlByRoute(ROUTES.Login));
        if (!isLoginPage) {
          s.set("redirect", target);
          navigate(ROUTES.Login + "?" + s.toString(), { viewTransition: true });
        }
      }
    };
    apiEvent.addEventListener(ApiEvent.error, error);
    return () => {
      apiEvent.removeEventListener(ApiEvent.error, error);
    };
  }, [apiEvent]);
  return props.children;
}
