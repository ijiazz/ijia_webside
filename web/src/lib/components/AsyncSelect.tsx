import { useAsync } from "@/hooks/async.ts";
import { Select, SelectProps } from "antd";
import type { BaseOptionType, DefaultOptionType } from "antd/es/select/index.js";
import React from "react";
import { useThrottle } from "react-use";

export type AsyncSelectProps<
  ValueType = any,
  OptionType extends BaseOptionType | DefaultOptionType = DefaultOptionType,
> = Omit<SelectProps<ValueType, OptionType>, "options" | "filterOption" | "loading"> & {
  value?: number;
  onChange?(value: number): void;
  getOption: (option: {
    search?: string;
  }) => Promise<{ items: OptionType[]; total: number }> | { items: OptionType[]; total: number };
};
export function AsyncSelect<ValueType = any, OptionType extends BaseOptionType | DefaultOptionType = DefaultOptionType>(
  props: AsyncSelectProps<ValueType, OptionType>,
) {
  const { loading, data, run } = useAsync(props.getOption, {});
  const getOption = useThrottle(run, 800);

  return (
    <Select<ValueType, OptionType>
      {...props}
      options={data?.items}
      loading={loading}
      onSearch={(value) => getOption({ search: value })}
      filterOption={false}
    />
  );
}
