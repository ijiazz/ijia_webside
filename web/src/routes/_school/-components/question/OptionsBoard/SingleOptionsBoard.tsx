import { QuestionOption } from "@/api.ts";
import { Base64Image } from "@/components/Base64Image.tsx";
import { useThemeToken } from "@/provider/mod.tsx";
import { Radio, RadioGroupProps } from "antd";

export type SingleOptionsBoardProps = Pick<RadioGroupProps, "value" | "defaultValue"> & {
  data: QuestionOption[];
  correctIndex?: number;
  onChange?: (value: number | undefined) => void;
};
export function SingleOptionsBoard(props: SingleOptionsBoardProps) {
  const { data, correctIndex, value, onChange, ...rest } = props;

  const theme = useThemeToken();
  const hasResult = typeof value === "number" && typeof correctIndex === "number";

  return (
    <Radio.Group
      {...rest}
      value={value}
      onChange={(e) => {
        onChange?.(e.target.value);
      }}
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
      aria-errormessage="sd"
    >
      {data.map(({ file, text }, index) => {
        const status = hasResult ? getStatus(correctIndex, index, value) : undefined;
        const color = status === true ? theme.colorSuccess : status === false ? theme.colorError : undefined;

        return (
          <Radio key={index} value={index} styles={{ icon: { alignSelf: "start", marginBlockStart: 3 } }}>
            <div style={{ color }}>
              {status === true && <span>✅ </span>}
              {status === false && <span>❌ </span>}
              <b>{String.fromCharCode(65 + index)}.</b> <span>{text}</span>
            </div>
            {file && (
              <Base64Image
                data={file.data}
                type={file.type}
                style={{ maxWidth: 200, maxHeight: 200, objectFit: "contain", marginBlockStart: 8 }}
              />
            )}
          </Radio>
        );
      })}
    </Radio.Group>
  );
}
function getStatus(correctIndex: number, currentIndex: number, selectIndex: number) {
  if (currentIndex === correctIndex) {
    return true;
  } else if (currentIndex === selectIndex) {
    return false;
  }
  return undefined;
}
