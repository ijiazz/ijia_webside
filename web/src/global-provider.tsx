import { ConfigProvider, theme, message, notification, Modal } from "antd";
import { PropsWithChildren, useContext, useMemo } from "react";
import { AndContext } from "@/hooks/antd.ts";
import { ApiContext, IGNORE_ERROR_MSG } from "@/hooks/http.ts";
import { createHoFetch } from "@/common/http.ts";
import { useLocation, useNavigate } from "react-router";
export const useToken = theme.useToken;

export function AntdProvider(props: PropsWithChildren<{}>) {
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
      let msg: string | undefined;
      if (typeof body === "string") msg = body;
      else if (typeof body === "object" && typeof (body as any).message === "string") {
        msg = (body as any).message;
      }
      if (msg) message.error(`(${res.status}) ${msg}`);
      else message.error(res.status);
      return res;
    });

    hoFetch.http.use(async function (ctx, next) {
      const res = await next();

      if (res.status === 401) {
        const s = new URLSearchParams();
        const url = new URL(location.href);
        s.set("redirect", url.pathname + url.search + url.hash);
        navigate("/passport/login?" + s.toString(), {});
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
