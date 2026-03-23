import { FormErrorMessage, getAntdErrorStatus } from "@/components/form.tsx";
import { Button, Input, Radio } from "antd";
import { Controller, useFormState, useWatch } from "react-hook-form";
import { FormValues } from "./schema.ts";
import { useThemeToken } from "@/provider/mod.tsx";

export function ResultRadioField() {
  const { isSubmitting } = useFormState();
  const theme = useThemeToken();
  const isPass = useWatch<FormValues, "isPass">({ name: "isPass" });
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        bottom: 0,
        paddingBlock: 12,
        background: theme.colorBgLayout,
      }}
    >
      <Controller
        name="remark"
        rules={{
          required: isPass ? undefined : "请填写原因",
        }}
        render={({ field, fieldState }) => {
          return (
            <>
              <Input.TextArea
                {...field}
                placeholder="填写原因将反馈给帖子作者"
                status={getAntdErrorStatus(fieldState)}
              />
              <FormErrorMessage message={fieldState.error?.message} />
            </>
          );
        }}
      />
      <div style={{ display: "flex", justifyContent: "end" }}>
        <Controller
          name="isPass"
          rules={{ validate: (value) => (typeof value === "boolean" ? undefined : "请选择") }}
          render={({ field, fieldState }) => {
            return (
              <>
                <Radio.Group {...field} buttonStyle="solid">
                  <Radio.Button value={true}>通过</Radio.Button>
                  <Radio.Button value={false}>不通过</Radio.Button>
                </Radio.Group>
                <FormErrorMessage message={fieldState.error?.message} />
              </>
            );
          }}
        />
        <Button
          style={{ marginLeft: "24px" }}
          disabled={isPass === undefined}
          loading={isSubmitting}
          color={isPass ? "green" : "danger"}
          variant="solid"
          htmlType="submit"
        >
          确定
        </Button>
      </div>
    </div>
  );
}
