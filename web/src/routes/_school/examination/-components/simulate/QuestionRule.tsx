import { FormItem, getAntdErrorStatus } from "@/components/form.tsx";
import { InputNumber } from "antd";
import { Controller } from "react-hook-form";

export type QuestionRuleProps = {
  prefix: string;
  maxQuestionCount: number;
  minScore?: number;
  maxScore?: number;
  minTimeLimit?: number;
  maxTimeLimit?: number;
};
export function QuestionRule(props: QuestionRuleProps) {
  const { maxQuestionCount, prefix, minScore = 2, maxScore, minTimeLimit, maxTimeLimit } = props;
  return (
    <>
      <Controller
        name={`${prefix}number`}
        rules={{
          required: "请输入题目数量",
          min: { value: 0, message: "题目数量不能小于或等于 0" },
          max: { value: maxQuestionCount, message: `题目数量不能大于 ${maxQuestionCount}` },
        }}
        render={({ field, fieldState }) => {
          return (
            <FormItem label="题目数量" required>
              <InputNumber
                {...field}
                style={{ width: "100%" }}
                status={getAntdErrorStatus(fieldState)}
                min={0}
                max={maxQuestionCount}
                precision={0}
              />
            </FormItem>
          );
        }}
      />
      <Controller
        name={`${prefix}score`}
        rules={{
          required: "请输入每题分数",
          min: { value: minScore, message: `每题分数不能小于 ${minScore}` },
          max: maxScore ? { value: maxScore, message: `每题分数不能大于 ${maxScore}` } : undefined,
        }}
        render={({ field, fieldState }) => {
          return (
            <FormItem label="每题分数" required>
              <InputNumber
                {...field}
                style={{ width: "100%" }}
                status={getAntdErrorStatus(fieldState)}
                min={minScore}
                max={maxScore}
                precision={0}
              />
            </FormItem>
          );
        }}
      />
      <Controller
        name={`${prefix}timeLimit`}
        rules={{
          min: minTimeLimit ? { value: minTimeLimit, message: `每题时间限制不能小于 ${minTimeLimit}` } : undefined,
          max: maxTimeLimit ? { value: maxTimeLimit, message: `每题时间限制不能大于 ${maxTimeLimit}` } : undefined,
        }}
        render={({ field, fieldState }) => {
          return (
            <FormItem label="每题时间限制" description="单位秒，超时的题目不计入总分">
              <InputNumber
                {...field}
                style={{ width: "100%" }}
                status={getAntdErrorStatus(fieldState)}
                min={minTimeLimit}
                max={maxTimeLimit}
                precision={0}
              />
            </FormItem>
          );
        }}
      />
    </>
  );
}
