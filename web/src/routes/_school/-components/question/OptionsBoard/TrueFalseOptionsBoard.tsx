import { QuestionOption } from "@/api.ts";
import { Radio } from "antd";

export type TrueFalseOptionsBoardProps = {
  data: QuestionOption[];
  correct?: boolean;
  value?: number;
  onChange?: (value: number) => void;
};
export function TrueFalseOptionsBoard(props: TrueFalseOptionsBoardProps) {
  const { value, onChange } = props;

  return (
    <Radio.Group
      value={value}
      onChange={(e) => {
        onChange?.(e.target.value);
      }}
      optionType="button"
      buttonStyle="solid"
    >
      <Radio.Button value={1}>✅正确</Radio.Button>
      <Radio.Button value={0}>❌错误</Radio.Button>
    </Radio.Group>
  );
}
