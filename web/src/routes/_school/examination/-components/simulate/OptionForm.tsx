import { FormItem, getAntdErrorStatus } from "@/components/form.tsx";
import { ExaminationCreateByNewTemplate } from "@ijia/api-types";
import { DatePicker, InputNumber } from "antd";
import dayjs from "dayjs";
import { Controller, useController } from "react-hook-form";

type OptionFormItemsProps = {};
export function OptionFormItems(props: OptionFormItemsProps) {
  const { field: allowTimeStartField, fieldState: allowTimeStartFormState } = useController({ name: "allowTimeStart" });
  const { field: allowTimeEndField, fieldState: allowTimeEndFormState } = useController({ name: "allowTimeEnd" });
  return (
    <>
      <FormItem
        label="考试允许时间范围"
        error={allowTimeStartFormState.error?.message}
        description="考试允许开始时间和结束时间，留空表示不限制"
      >
        <div style={{ width: "100%", display: "flex", gap: 14 }}>
          <DatePicker
            style={{ width: "100%" }}
            {...allowTimeStartField}
            showTime
            value={allowTimeStartField.value ? dayjs(allowTimeStartField.value) : null}
            status={getAntdErrorStatus(allowTimeStartFormState)}
            onChange={(date) => allowTimeStartField.onChange(date?.toISOString())}
          />
          <DatePicker
            style={{ width: "100%" }}
            {...allowTimeEndField}
            showTime
            value={allowTimeEndField.value ? dayjs(allowTimeEndField.value) : null}
            status={getAntdErrorStatus(allowTimeEndFormState)}
            onChange={(date) => allowTimeEndField.onChange(date?.toISOString())}
          />
        </div>
      </FormItem>
      <Controller<ExaminationCreateByNewTemplate, "resultAllowViewDate">
        name="resultAllowViewDate"
        render={({ field, fieldState }) => (
          <FormItem
            label="结果可查看时间"
            error={fieldState.error?.message}
            description="设置后需要在指定时间后才能查看考试结果"
          >
            <DatePicker
              style={{ width: "100%" }}
              showTime
              value={field.value ? dayjs(field.value) : null}
              status={getAntdErrorStatus(fieldState)}
              onChange={(date) => field.onChange(date?.toISOString())}
              onBlur={field.onBlur}
            />
          </FormItem>
        )}
      />
      <Controller<ExaminationCreateByNewTemplate, "useTimeTotalLimit">
        name="useTimeTotalLimit"
        render={({ field, fieldState }) => (
          <FormItem label="考试时间" error={fieldState.error?.message} description="单位秒，若不设置，则不限制考试时间">
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              precision={0}
              value={field.value}
              status={getAntdErrorStatus(fieldState)}
              onChange={(value) => field.onChange(value ?? undefined)}
              onBlur={field.onBlur}
            />
          </FormItem>
        )}
      />
    </>
  );
}
