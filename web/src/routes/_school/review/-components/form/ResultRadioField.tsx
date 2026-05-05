import { FormErrorMessage, getAntdErrorStatus } from "@/components/form.tsx";
import { Button, Input, Radio } from "antd";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";

import { useThemeToken } from "@/provider/mod.tsx";
export type FormValues = {
  remark?: string;
  isPass: boolean;
};

export function ResultRadioField(props: { onSubmit: (value: FormValues) => Promise<void> }) {
  const form = useForm<FormValues>();
  const { onSubmit } = props;
  const { isSubmitting } = form.formState;
  const theme = useThemeToken();
  const isPass = useWatch<FormValues, "isPass">({ control: form.control, name: "isPass" });
  return (
    <FormProvider {...form}>
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
            onClick={form.handleSubmit(onSubmit)}
          >
            确定
          </Button>
        </div>
      </div>
    </FormProvider>
  );
}
