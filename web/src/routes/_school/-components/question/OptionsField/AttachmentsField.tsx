import { DeleteOutlined } from "@ant-design/icons";
import { Button, Image, Tooltip } from "antd";
import { useFieldArray } from "react-hook-form";
import { EditQuestionFormInput } from "./form.ts";
import { Base64Image } from "@/components/Base64Image.tsx";
import { css } from "@emotion/css";
import { ImageOptionUpload } from "./ImageOptionUpload.tsx";

export function AttachmentsField() {
  const { fields, append, remove } = useFieldArray<EditQuestionFormInput, "attachments">({
    name: "attachments",
  });

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16, marginTop: -16, overflow: "hidden" }}>
      <Image.PreviewGroup>
        {fields.map((field, index) => (
          <div className={ImageItemCSS} key={field.id}>
            {field.file ? (
              <Base64Image
                data={field.file.data}
                type={field.file.type}
                style={{ objectFit: "contain", width: 100, height: 100 }}
              />
            ) : null}
            <div className={ImageItemTitleRootCSS}>
              <span>{field.text || `图 ${index + 1}`}</span>
              <Button icon={<DeleteOutlined />} size="small" danger type="text" onClick={() => remove(index)} />
            </div>
          </div>
        ))}
      </Image.PreviewGroup>
      {fields.length <= 8 && (
        <Tooltip title="添加图片">
          <ImageOptionUpload
            onChange={(file) => append({ file: { data: file.base64, type: file.type }, text: undefined })}
          />
        </Tooltip>
      )}
    </div>
  );
}

const ImageItemCSS = css`
  display: grid;
  align-items: end;
  grid-template-rows: 1fr auto;
`;
const ImageItemTitleRootCSS = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;
