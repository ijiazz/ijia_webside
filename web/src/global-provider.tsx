import { ConfigProvider, theme, message, notification, Modal } from "antd";
import { PropsWithChildren, useContext, useMemo } from "react";
import { AndContext } from "@/hooks/antd.ts";
import { ApiContext, IGNORE_ERROR_MSG } from "@/hooks/http.ts";
import { createHoFetch, getResponseErrorInfo } from "@/common/http.ts";
import { useNavigate } from "react-router";
import { getUrlByRouter } from "./common/navigation.ts";
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
function useCreateHoFetch() {
  const { message } = useContext(AndContext);
  const navigate = useNavigate();
  return useMemo(() => {
    const hoFetch = createHoFetch();
    hoFetch.http.use(async function (ctx, next) {
      if (ctx.allowFailed === true || ctx[IGNORE_ERROR_MSG]) return next();
      const res = await next();
      if (res.ok) return res;
      if (ctx.allowFailed instanceof Array && ctx.allowFailed.includes(res.status)) return res;

      const body = await res.parseBody();

      const err = getResponseErrorInfo(body);
      if (err) {
        const isHtml = res.headers.get("content-type")?.startsWith("text/html");
        if (err.message && !isHtml) message.error(err.message);
        else message.error(res.status);
      }

      if (res.status === 401 && err?.code === "REQUIRED_LOGIN") {
        const s = new URLSearchParams();
        const url = new URL(location.href);
        const target = url.pathname + url.search + url.hash;
        const isLoginPage = location.href.startsWith(getUrlByRouter("/passport/login"));
        if (!isLoginPage) {
          s.set("redirect", target);
          navigate("/passport/login?" + s.toString(), {});
        }
      }

      return res;
    });

    return hoFetch;
  }, [message]);
}

export function HoFetchProvider(props: PropsWithChildren<{}>) {
  const hoFetch = useCreateHoFetch();
  return <ApiContext value={hoFetch}>{props.children}</ApiContext>;
}
