import { ApiEvent, apiEvent, MaintenanceEvent } from "@/request/client.ts";
import { Alert } from "antd";
import { useEffect, useState } from "react";

type GlobalAlertProps = {
  children?: React.ReactNode;
};
export function GlobalAlert(props: GlobalAlertProps) {
  const { children } = props;
  const [content, setContent] = useState(() => MaintenanceEvent.parseMessage(MaintenanceEvent.maintenance));
  useEffect(() => {
    const handler = (event: Event) => {
      const e = event as MaintenanceEvent;
      setContent(e.message);
    };
    apiEvent.addEventListener(ApiEvent.alert, handler);
    return () => {
      apiEvent.removeEventListener(ApiEvent.alert, handler);
    };
  }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {content ? <Alert banner title={content} closable /> : null}
      <div style={{ flex: 1, overflow: "auto" }}> {children}</div>
    </div>
  );
}
