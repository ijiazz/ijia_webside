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
        {error instanceof Error ? error.stack || error.message : JSON.stringify(error, null, 2)}
      </div>
    </div>
  );
}
