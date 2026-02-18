import { Alert, Select, SelectProps } from "antd";
import { useMemo } from "react";
import { PRadio, RadioOption } from "../../wall/-components/PostGroupSelect.tsx";

export function GroupSelect(props: SelectProps) {
  const { options, value } = props;
  const pruneOption = useMemo(() => {
    let op: SelectProps["options"];
    if (!options || options.length <= 4) op = options;
    else op = options.slice(0, 4);

    return op?.map((item): RadioOption => ({ label: item.label, value: item.value! }));
  }, [options]);

  const tip = useMemo(() => {
    return options?.find((item) => item.value === value)?.desc || "";
  }, [options, value]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {options?.length && options.length <= 4 ? (
        <PRadio value={props.value} options={pruneOption} onChange={props.onChange} />
      ) : (
        <Select {...props}></Select>
      )}
      {props.value !== undefined && <Alert title={tip} type="warning" />}
    </div>
  );
}
