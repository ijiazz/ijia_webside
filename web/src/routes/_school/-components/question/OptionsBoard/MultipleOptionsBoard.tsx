import { QuestionOption } from "@/api.ts";
import { Base64Image } from "@/components/Base64Image.tsx";
import { useThemeToken } from "@/provider/AntdProvider.tsx";
import { Checkbox } from "antd";
import type { CheckboxGroupProps } from "antd/es/checkbox/Group.js";

export type MultipleOptionsBoardProps = Pick<CheckboxGroupProps<number>, "value" | "defaultValue" | "onChange"> & {
  data: QuestionOption[];
  correctIndexes?: number[];
};
export function MultipleOptionsBoard(props: MultipleOptionsBoardProps) {
  const { data, correctIndexes, value, ...rest } = props;

  const theme = useThemeToken();
  const hasResult = !!value;
  const selectedSet = new Set(value);
  const correctSet = new Set(correctIndexes);

  return (
    <Checkbox.Group<number>
      {...rest}
      value={value}
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
      aria-errormessage="sd"
    >
      {data.map(({ file, text }, index) => {
        const status = hasResult ? getStatus(correctSet, index, selectedSet) : undefined;
        const color = status === true ? theme.colorSuccess : status === false ? theme.colorError : undefined;

        return (
          <Checkbox key={index} value={index} styles={{ icon: { alignSelf: "start", marginBlockStart: 3 } }}>
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
          </Checkbox>
        );
      })}
    </Checkbox.Group>
  );
}
function getStatus(correctIndexes: Set<number>, currentIndex: number, selectIndexes: Set<number>) {
  if (correctIndexes.has(currentIndex)) {
    return true;
  } else if (selectIndexes.has(currentIndex)) {
    return false;
  }
  return undefined;
}
