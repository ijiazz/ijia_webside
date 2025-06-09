import { ConfigProvider, theme, message, notification, Modal } from "antd";
import React, { PropsWithChildren, useContext, useEffect, useMemo } from "react";
import { AndContext } from "@/hooks/antd.ts";
import { ApiContext, IGNORE_UNAUTHORIZED_REDIRECT } from "@/hooks/http.ts";
import { getResponseErrorInfo, apiEvent, ApiEvent, ApiErrorEvent, API_PREFIX, api, http } from "@/common/http.ts";
import { useNavigate } from "react-router";
import { getUrlByRoute, ROUTES } from "./app.ts";
export const useToken = theme.useToken;

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
      <AndContext value={{ message: messageApi, notice: noticeApi, modal: modalApi }}>{props.children}</AndContext>
    </ConfigProvider>
  );
}

export function HoFetchProvider(props: PropsWithChildren<{}>) {
  const { message } = useContext(AndContext);
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
  }, []);

  const hoFetch = useMemo(() => {
    return { API_PREFIX, api, http };
  }, []);
  return <ApiContext value={hoFetch}>{props.children}</ApiContext>;
}
