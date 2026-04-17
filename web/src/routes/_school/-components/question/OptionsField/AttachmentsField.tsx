import { Upload } from "@/components/Upload.tsx";
import { UploadOutlined } from "@ant-design/icons";
import { useFieldArray } from "react-hook-form";
import { EditQuestionFormFields } from "./form.ts";

export function AttachmentsField() {
  const { fields, append, remove } = useFieldArray<EditQuestionFormFields>({
    name: "attachments",
  });
  return (
    <div>
      {fields.map((field, index) => (
        <div key={field.id}></div>
      ))}
      <Upload customRequest={() => {}} onChange={() => {}}>
        <UploadOutlined />
      </Upload>
    </div>
  );
}
