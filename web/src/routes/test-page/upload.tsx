import { fileAPI } from "@/request/client.ts";
import { UploadMethod } from "@ijia/api-types";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Upload } from "antd";

export const Route = createFileRoute("/test-page/upload")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <Upload action={(file) => getUploadURL(UploadMethod.question)} method="PUT">
        <Button>Click to Upload</Button>
      </Upload>
    </div>
  );
}
async function uploadFile(file: Blob, method: UploadMethod) {
  const { previewURL } = await fileAPI["/file/upload"].put({
    body: file,
    query: { method },
    headers: { "Content-Type": file.type },
  });
  return previewURL;
}
function getUploadURL(method: UploadMethod) {
  return `/file/upload?method=${method}`;
}
