import { http } from "@/common/http.ts";

async function fetchImages(page: number, pageSize: number): Promise<{ list: CommentStatByCount[]; hasMore: boolean }> {
  const { bodyData } = await http.fetch<{ list: CommentStatByCount[]; hasMore: boolean }>(
    "/api/stat/comment/count_by_user",
    {
      params: { page, pageSize },
    },
  );
  return bodyData;
}
export function createImageStream(cacheSize: number) {
  let page = 0;
  let pageSize = 50;
  let i = 0;
  return new ReadableStream<CommentStatByCount>(
    {
      async pull(ctrl) {
        const res = await fetchImages(page++, pageSize);
        for (const item of res.list) {
          item.index = i++;
          ctrl.enqueue(item);
        }
        if (!res.list.length) ctrl.close();
      },
    },
    { highWaterMark: cacheSize, size: (item) => 1 },
  );
}
export interface CommentStatByCount {
  uid: string;
  comment_total: number;
  user_name: string;
  avatar: string;
  index: number;
}
export function getOosThumbBlobName(uri: string) {
  return "/file/avatar/" + uri;
}
