import { QuestionAttachment } from "@/api.ts";
import { Image } from "antd";
import { Base64Image } from "@/components/Base64Image.tsx";
import { css } from "@emotion/css";
export type QuestionAttachmentsProps = {
  data: QuestionAttachment[];
};
export function QuestionAttachments(props: QuestionAttachmentsProps) {
  const { data } = props;

  return (
    <div style={{ display: "flex", alignItems: "end", gap: 12 }}>
      <Image.PreviewGroup>
        {data.map((field, index) => (
          <div className={ImageItemCSS} key={index}>
            {field.file ? (
              <Base64Image
                data={field.file.data}
                type={field.file.type}
                style={{ width: 140, height: 140, objectFit: "contain", flex: 1 }}
              />
            ) : null}
            <div className={ImageItemTitleRootCSS}>{field.text || `图 ${index + 1}`}</div>
          </div>
        ))}
      </Image.PreviewGroup>
    </div>
  );
}
const ImageItemCSS = css`
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 150px;
  height: 150px;
`;
const ImageItemTitleRootCSS = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;
