import { getResponseErrorInfo, MaintenanceEvent } from "@/request/client.ts";
import { HoFetchStatusError } from "@asla/hofetch";
import { useMemo } from "react";

export function ErrorPage(props: { error: any; reset: () => void; info?: string }) {
  const { error, reset, info } = props;

  const errorMessage = useMemo(() => {
    if (error instanceof Error) {
      if (error instanceof HoFetchStatusError) {
        const isMaintenance = MaintenanceEvent.parseMessage(MaintenanceEvent.maintenance);
        if (isMaintenance) {
          return `服务器维护中！请稍后再试`;
        }

        const info = getResponseErrorInfo(error.body);
        if (info) {
          if (info.code && info.message) {
            return `请求发生错误${error.status}：${info.code} ${info.message}`;
          } else {
            return `请求发生错误${error.status}：${(info.message || info.code) ?? "unknown error"}`;
          }
        }
        return `请求发生错误：${error.status}`;
      } else {
        return error.stack || error.message;
      }
    } else {
      return JSON.stringify(error, null, 2);
    }
  }, [error]);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 14,
        backgroundColor: "#fff",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <h3
        style={{
          color: "red",
          padding: 12,
        }}
      >
        页面发生异常
      </h3>
      <div
        style={{
          fontSize: 14,
          color: "red",
          whiteSpace: "pre-wrap",
          backgroundColor: "#fdd",
          padding: 10,
          borderRadius: 4,
        }}
      >
        {errorMessage}
      </div>
    </div>
  );
}
