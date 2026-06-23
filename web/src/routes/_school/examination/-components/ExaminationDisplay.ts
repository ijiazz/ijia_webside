import { ExaminationRecordQuestion, ExaminationStatus } from "@/api.ts";

export const STATUS_LABELS: Record<ExaminationStatus, string> = {
  [ExaminationStatus.upcoming]: "未开始",
  [ExaminationStatus.ready]: "可开始",
  [ExaminationStatus.ongoing]: "进行中",
  [ExaminationStatus.ended]: "已结束",
  [ExaminationStatus.result]: "已出结果",
};

export const STATUS_COLORS: Record<ExaminationStatus, string> = {
  [ExaminationStatus.upcoming]: "default",
  [ExaminationStatus.ready]: "blue",
  [ExaminationStatus.ongoing]: "processing",
  [ExaminationStatus.ended]: "orange",
  [ExaminationStatus.result]: "green",
};

export function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : "不限";
}

export function getRecordAnchorId(index: number) {
  return `exam-record-${index}`;
}

export function getRecordStatusColor(item: ExaminationRecordQuestion) {
  if ((item.selected?.length ?? 0) === 0) return "#d9d9d9";
  if (!item.question?.answer) return "#1677ff";
  if (isCorrectAnswer(item)) return "#52c41a";
  if ((item.score ?? 0) > 0) return "#faad14";
  return "#ff4d4f";
}

export function getRecordTagColor(item: ExaminationRecordQuestion) {
  if ((item.selected?.length ?? 0) === 0) return "default";
  if (!item.question?.answer) return "processing";
  if (isCorrectAnswer(item)) return "success";
  if ((item.score ?? 0) > 0) return "warning";
  return "error";
}

export function getRecordStatusText(item: ExaminationRecordQuestion) {
  if ((item.selected?.length ?? 0) === 0) return "未作答";
  if (!item.question?.answer) return "结果未开放";
  if (isCorrectAnswer(item)) return "正确";
  if ((item.score ?? 0) > 0) return "部分正确";
  return "错误";
}

export function formatUseTime(useTime: number | null) {
  if (useTime == null) return "-";
  return `${Math.round(useTime / 1000)} 秒`;
}

export function clampDifficulty(value: number) {
  return Math.max(0, Math.min(5, value));
}

function isCorrectAnswer(item: ExaminationRecordQuestion) {
  const selected = item.selected ?? [];
  const correct = item.question?.answer?.answer_index ?? [];
  if (selected.length !== correct.length) return false;
  const normalizedSelected = [...selected].sort((a, b) => a - b);
  const normalizedCorrect = [...correct].sort((a, b) => a - b);
  return normalizedSelected.every((value, index) => value === normalizedCorrect[index]);
}
