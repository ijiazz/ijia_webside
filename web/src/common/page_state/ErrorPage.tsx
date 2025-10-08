import React from "react";

export function ErrorPage(props: { error: any; reset: () => void; info?: string }) {
  const { error, reset, info } = props;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 14,
      }}
    >
      <div style={{ fontSize: 14, color: "red", whiteSpace: "pre-wrap" }}>
        {error instanceof Error ? error.stack || error.message : JSON.stringify(error, null, 2)}
      </div>
    </div>
  );
}
