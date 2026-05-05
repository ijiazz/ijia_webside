import { getAntdErrorStatus } from "@/components/form.tsx";
import { DeleteFilled, EyeOutlined, PictureOutlined } from "@ant-design/icons";
import { Button, Input, Tooltip } from "antd";
import { useController } from "react-hook-form";
import { ImageOptionUpload } from "./ImageOptionUpload.tsx";
import { EditQuestionFormFields } from "./form.ts";
import { Base64Image } from "@/components/Base64Image.tsx";
import { useState } from "react";

export type OptionProps = {
  index: number;
};
export function Option(props: OptionProps) {
  const { index } = props;
  const { field, fieldState } = useController<EditQuestionFormFields, `options.${number}`>({
    name: `options.${index}`,
    rules: {
      validate: (value) => {
        if (!value || (!value.text && !value.file)) {
          return "选项不能为空";
        }
      },
    },
  });
  const fieldValue = field.value;
  const file = fieldValue?.file;
  const text = fieldValue?.text;
  const [previewOpen, setPreviewOpen] = useState(false);
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <Input
          {...field}
          aria-label={`选项 ${String.fromCharCode(65 + index)} 内容`}
          value={text ?? ""}
          onChange={(e) => field.onChange({ ...fieldValue, text: e.target.value })}
          status={getAntdErrorStatus(fieldState)}
          placeholder={`选项 ${index + 1}`}
        />
        <Tooltip title={file ? "更改选项图片" : "添加选项图片（可选）"}>
          <ImageOptionUpload
            style={{ width: 30, height: 30 }}
            onChange={(file) => field.onChange({ ...fieldValue, file: { data: file.base64, type: file.type } })}
          >
            <PictureOutlined />
          </ImageOptionUpload>
        </Tooltip>
      </div>
      {file && (
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
                  onClick={() => field.onChange({ ...fieldValue, file: null })}
                />
                <Button type="dashed" icon={<EyeOutlined />} size="small" onClick={() => setPreviewOpen(true)} />
              </div>
            ),
          }}
          data={file?.data}
          type={file?.type}
        />
      )}
    </div>
  );
}
