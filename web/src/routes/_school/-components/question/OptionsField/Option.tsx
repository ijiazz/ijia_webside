import { getAntdErrorStatus } from "@/components/form.tsx";
import { DeleteFilled, EyeOutlined, PictureOutlined } from "@ant-design/icons";
import { Button, Input, Tooltip } from "antd";
import { Controller, useController } from "react-hook-form";
import { ImageOptionUpload } from "./ImageOptionUpload.tsx";
import { EditQuestionFormFields, OptionField } from "./form.ts";
import { Base64Image } from "@/components/Base64Image.tsx";
import { useState } from "react";

export type OptionProps = {
  index: number;
};
export function Option(props: OptionProps) {
  const { index } = props;
  const { field } = useController<EditQuestionFormFields, `options.${number}.file`>({
    name: `options.${index}.file`,
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileValue: OptionField["file"] = field.value;
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <Controller<EditQuestionFormFields, `options.${number}.text`>
          name={`options.${index}.text` as const}
          render={({ field, fieldState }) => (
            <Input {...field} status={getAntdErrorStatus(fieldState)} placeholder={`选项 ${index + 1}`} />
          )}
        />
        <Tooltip title={fileValue ? "更改选项图片" : "添加选项图片（可选）"}>
          <ImageOptionUpload
            style={{ width: 30, height: 30 }}
            onChange={(file) => field.onChange({ data: file.base64, type: file.type } satisfies OptionField["file"])}
          >
            <PictureOutlined />
          </ImageOptionUpload>
        </Tooltip>
      </div>
      {fileValue && (
        <Base64Image
          style={{ maxHeight: 150, marginBlock: 8, objectFit: "contain" }}
          preview={{
            open: previewOpen,
            onOpenChange: setPreviewOpen,
            cover: (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  height: "100%",
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Button
                  type="dashed"
                  danger
                  icon={<DeleteFilled />}
                  size="small"
                  onClick={() => field.onChange(null)}
                />
                <Button type="dashed" icon={<EyeOutlined />} size="small" onClick={() => setPreviewOpen(true)} />
              </div>
            ),
          }}
          data={fileValue.data}
          type={fileValue.type}
        />
      )}
    </div>
  );
}
