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
    <Image.PreviewGroup>
      {data.map((field, index) => (
        <div className={ImageItemCSS} key={index}>
          {field.file ? <Base64Image data={field.file.data} type={field.file.type} /> : null}
          <div className={ImageItemTitleRootCSS}>{field.text || `图 ${index + 1}`}</div>
        </div>
      ))}
    </Image.PreviewGroup>
  );
}
const ImageItemCSS = css`
  display: grid;
  align-items: end;
  grid-template-rows: 1fr auto;
  width: 150px;
  height: 150px;
`;
const ImageItemTitleRootCSS = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;
