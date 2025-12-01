export { default } from "./_route.ts";

import "./.put.ts";
import "./list.get.ts";
import "./god_list.get.ts";

import "./$postId/.patch.ts";
import "./$postId/.delete.ts";
import "./$postId/like.post.ts";
import "./$postId/report.post.ts";

import "./group/list.get.ts";

import "./review/next.get.ts";
import "./review/$reviewId/commit.post.ts";
