import { PropsWithChildren, useEffect } from "react";

import { apiEvent, ApiEvent, ApiErrorEvent } from "@/request/client.ts";
import { useNavigate } from "@tanstack/react-router";
import { useAntdStatic } from "./AntdProvider.tsx";

export function HoFetchProvider(props: PropsWithChildren<{}>) {
  const { message } = useAntdStatic();
  const navigate = useNavigate();
  useEffect(() => {
    const error = (event: Event) => {
      const apiErrorEvent = event as ApiErrorEvent;
      const msg = apiErrorEvent.getMessage();
      if (msg) {
        message.error(msg);
      }
      const redirect = apiErrorEvent.getRedirect();
      if (redirect) {
        navigate({ href: redirect, viewTransition: true });
      }
    };
    apiEvent.addEventListener(ApiEvent.error, error);
    return () => {
      apiEvent.removeEventListener(ApiEvent.error, error);
    };
  }, [apiEvent]);
  return props.children;
}
