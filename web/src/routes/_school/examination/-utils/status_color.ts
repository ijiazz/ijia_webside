import { ExaminationRecordQuestion } from "@/api.ts";
import { ButtonProps } from "antd";

export function getRecordStatus(item: ExaminationRecordQuestion): { color: ButtonProps["color"]; text: string } {
  if ((item.selected?.length ?? 0) === 0) return { color: undefined, text: "未作答" };
  if (!item.question?.answer) return { color: undefined, text: "结果未开放" };
  if (isCorrectAnswer(item)) {
    if (item.isTimeout) {
      return { color: "cyan", text: "超时" };
    }
    return { color: "green", text: "正确" };
  }
  if ((item.score ?? 0) > 0) return { color: "orange", text: "部分正确" };
  return { color: "red", text: "错误" };
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
