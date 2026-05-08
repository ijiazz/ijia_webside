import { ApiEvent, apiEvent, MaintenanceEvent, VersionUpdateEvent } from "@/request/client.ts";
import { Alert, Button } from "antd";
import { useEffect, useState } from "react";

type GlobalAlertProps = {
  children?: React.ReactNode;
};
export function GlobalAlert(props: GlobalAlertProps) {
  const { children } = props;
  const [content, setContent] = useState(() => MaintenanceEvent.parseMessage(MaintenanceEvent.maintenance));
  const [versionContent, setVersionContent] = useState(VersionUpdateEvent.version);
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

  useEffect(() => {
    const versionHandler = (event: Event) => {
      const e = event as VersionUpdateEvent;
      setVersionContent(e.version);
    };
    apiEvent.addEventListener(ApiEvent.versionUpdate, versionHandler);
    return () => {
      apiEvent.removeEventListener(ApiEvent.versionUpdate, versionHandler);
    };
  }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {content ? <Alert banner title={content} closable /> : null}
      {versionContent ? (
        <Alert
          banner
          title={
            <div>
              检测到新版本
              <Button type="link" size="small" onClick={() => window.location.reload()}>
                立即更新
              </Button>
            </div>
          }
          closable
        />
      ) : null}
      <div style={{ flex: 1, overflow: "auto" }}> {children}</div>
    </div>
  );
}
