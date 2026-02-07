import { PropsWithChildren, useEffect } from "react";

import {
  getResponseErrorInfo,
  apiEvent,
  ApiEvent,
  ApiErrorEvent,
  IGNORE_UNAUTHORIZED_REDIRECT,
} from "@/request/client.ts";
import { useNavigate } from "@tanstack/react-router";
import { goRedirectLoginPath } from "../app.ts";
import { useAntdStatic } from "./AntdProvider.tsx";

export function HoFetchProvider(props: PropsWithChildren<{}>) {
  const { message } = useAntdStatic();
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
        event.preventDefault();
        const redirect = goRedirectLoginPath();
        if (redirect) {
          navigate({ href: redirect, viewTransition: true });
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
