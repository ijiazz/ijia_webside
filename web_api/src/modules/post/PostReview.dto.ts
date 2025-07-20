import { PostItemBase, PostItemDto } from "./post.dto.ts";

export type PostReviewItem = {
  post: PostItemDto;
};
export type GetPostReviewListParam = {
  postId?: number;
};
export type ReviewingPostItem = PostItemBase &
  Pick<PostItemDto, "group"> & {
    review_id: string;
    review_type: string;
  };
