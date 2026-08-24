import { Spin } from "antd";

export function PageLoading(props: { title?: string }) {
  const { title = "Loading" } = props;
  return (
    <div className="app-loading">
      <div className="app-loading-animation">
        <h1>{title}</h1>
      </div>
    </div>
  );
}

export function PageSpin() {
  return (
    <div style={{ height: "100%", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spin />
    </div>
  );
}
