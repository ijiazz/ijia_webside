export { default } from "./_route.ts";

import "./entity/.put.ts";
import "./list.get.ts";
import "./god_list.get.ts";

import "./entity/$postId.patch.ts";
import "./entity/$postId.delete.ts";
import "./entity/$postId/like.post.ts";
import "./entity/$postId/report.post.ts";

import "./group/list.get.ts";

import "./review/next.get.ts";
import "./review/entity/$reviewId/commit.post.ts";
