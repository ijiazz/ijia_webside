import { FormItem } from "@/components/form.tsx";
import { Collapse, InputNumber, Select, Slider, Switch } from "antd";
import { Controller } from "react-hook-form";
import { EditQuestionFormFields } from "./EditQuestionFields.tsx";

export type AdvancedConfigFieldsProps = {};
export function AdvancedConfigFields(_props: AdvancedConfigFieldsProps) {
  return (
    <Collapse
      style={{ marginTop: 16 }}
      defaultActiveKey={["advanced-config"]}
      size="small"
      items={[
        {
          key: "advanced-config",
          label: "高级设置",
          children: (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Controller<EditQuestionFormFields, "advanced.long_time">
                name="advanced.long_time"
                rules={{
                  required: "请选择",
                }}
                render={({ field }) => (
                  <FormItem label="长期有效" description="开启后表示该题答案不会随时间变化">
                    <Switch checked={field.value} onChange={field.onChange} />
                  </FormItem>
                )}
              />
              <Controller<EditQuestionFormFields, "advanced.difficulty_level">
                name="advanced.difficulty_level"
                rules={{
                  required: "请选择难度等级",
                }}
                render={({ field, fieldState }) => (
                  <FormItem label="难度等级" error={fieldState.error?.message} description="可选，范围 0 到 5">
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      <Slider min={0} max={5} {...field} style={{ flex: 1 }} />
                      <InputNumber
                        style={{ width: 100 }}
                        min={0}
                        max={5}
                        precision={0}
                        value={field.value}
                        onChange={(value) => field.onChange(value ?? undefined)}
                      />
                    </div>
                  </FormItem>
                )}
              />
              <Controller<EditQuestionFormFields, "advanced.collection_level">
                name="advanced.collection_level"
                rules={{
                  required: "请选择收藏等级",
                }}
                render={({ field, fieldState }) => (
                  <FormItem label="收藏等级" error={fieldState.error?.message} description="可选，范围 0 到 3">
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      <Slider min={0} max={3} {...field} style={{ flex: 1 }} />
                      <InputNumber
                        style={{ width: 100 }}
                        min={0}
                        max={3}
                        precision={0}
                        value={field.value}
                        onChange={(value) => field.onChange(value ?? undefined)}
                      />
                    </div>
                  </FormItem>
                )}
              />
              <Controller<EditQuestionFormFields, "advanced.themes">
                name="advanced.themes"
                rules={{
                  required: "请选择主题标签",
                }}
                render={({ field, fieldState }) => (
                  <FormItem label="主题标签" error={fieldState.error?.message} description="可选，输入后按回车确认">
                    <Select
                      style={{ minWidth: 120 }}
                      mode="tags"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="输入主题标签"
                      options={PRESET_THEME_OPTIONS}
                    />
                  </FormItem>
                )}
              />
            </div>
          ),
        },
      ]}
    />
  );
}

const PRESET_THEME_OPTIONS = ["直播", "音乐", "见面会", "小猪熊", "肖鹿", "日常", "短剧", "常识"].map((theme) => ({
  label: theme,
  value: theme,
}));
