import { ExaminationRecordQuestion } from "@/api.ts";

export function getRecordStatus(item: ExaminationRecordQuestion): { color: string; text: string } {
  if ((item.selected?.length ?? 0) === 0) return { color: "#d9d9d9", text: "未作答" };
  if (!item.question?.answer) return { color: "#1677ff", text: "结果未开放" };
  if (isCorrectAnswer(item)) return { color: "#52c41a", text: "正确" };
  if ((item.score ?? 0) > 0) return { color: "#faad14", text: "部分正确" };
  return { color: "#ff4d4f", text: "错误" };
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
