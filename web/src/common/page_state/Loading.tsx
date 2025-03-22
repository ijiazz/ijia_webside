import { Spin } from "antd";

export function PageLoading() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
      <div>
        <Spin style={{ width: 56 }} tip="正在佳载" size="large">
          <span></span>
        </Spin>
      </div>
    </div>
  );
}
