import { dateToString } from "@/common/date.ts";
import { ExaminationStatus } from "@ijia/api-types";

export function getTimeRange(from?: string | null, to?: string | null): string {
  if (from && to) {
    return `${dateToString(from, "minute")} - ${dateToString(to, "minute")}`;
  } else if (from) {
    return `${dateToString(from, "minute")} - 不限`;
  } else if (to) {
    return `不限 - ${dateToString(to, "minute")}`;
  } else {
    return "不限";
  }
}
export const STATUS_LABELS: Record<ExaminationStatus, { label: string; color: string }> = {
  [ExaminationStatus.upcoming]: { label: "未开始", color: "default" },
  [ExaminationStatus.ready]: { label: "可开始", color: "blue" },
  [ExaminationStatus.ongoing]: { label: "进行中", color: "processing" },
  [ExaminationStatus.ended]: { label: "待出成绩", color: "orange" },
  [ExaminationStatus.result]: { label: "已出结果", color: "green" },
};
