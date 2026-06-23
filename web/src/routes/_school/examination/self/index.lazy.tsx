import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { ExaminationList } from "./-components/ExaminationList.tsx";
import { css } from "@emotion/css";
import { Button, Segmented, Space } from "antd";
import { ExaminationInfoResult, ExaminationStatus } from "@ijia/api-types";
import { useEffect, useMemo, useState } from "react";
import { useInfiniteLoad } from "@/lib/hook/infiniteLoad.ts";
import { api } from "@/request/client.ts";

export const Route = createLazyFileRoute("/_school/examination/self/")({
  component: RouteComponent,
});
export function RouteComponent() {
  const [statusFilter, setStatusFilter] = useState(statusOptions[0].value);
  const status = useMemo(() => statusFilter.split(",").map((item) => item as ExaminationStatus), [statusFilter]);

  const { data, setData, reset, next, error, loading } = useInfiniteLoad<ExaminationInfoResult[], string>({
    async load(cursor, forward) {
      const result = await api["/examination"].get({ query: { cursor, limit: 15, status } });
      const items = forward ? result.items.slice().reverse() : result.items;
      return {
        items,
        nextParam: result.cursor_next ? result.cursor_next : undefined,
        prevParam: result.cursor_prev ? result.cursor_prev : undefined,
      };
    },
    init: () => [],
    mergeBack: (prev, nextItems) => (nextItems.length ? prev.concat(nextItems) : prev),
    mergeFront: (prev, nextItems) => (nextItems.length ? nextItems.reverse().concat(prev) : prev),
  });
  useEffect(() => {
    reset();
    next.loadMore();
  }, [status]);
  return (
    <div className={ExaminationListPageCSS}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Segmented options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
        <Space>
          <Link to="/examination/simulate">
            <Button type="primary">创建模拟考试</Button>
          </Link>
        </Space>
      </div>
      <ExaminationList
        data={data}
        onDeleted={(examId) => setData((prev) => prev.filter((item) => item.id !== examId))}
      />
    </div>
  );
}
const statusOptionInfo: { label: string; key: ExaminationStatus[] }[] = [
  { label: "进行中", key: [ExaminationStatus.upcoming, ExaminationStatus.ongoing] },
  { label: "待出成绩", key: [ExaminationStatus.ended] },
  { label: "已结束", key: [ExaminationStatus.result] },
];
const statusOptions = statusOptionInfo.map((item) => ({ label: item.label, value: item.key.join(",") }));
const ExaminationListPageCSS = css`
  max-width: 750px;
  margin: 0 auto;
  padding: 24px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;
