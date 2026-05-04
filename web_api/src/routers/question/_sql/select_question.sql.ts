import { ReviewStatus } from "@/dto.ts";
import { jsonb_build_object } from "@/global/sql_util.ts";
import { select, v } from "@asla/yoursql";
import { DbExamQuestion, TextStructure } from "@ijia/data/db";

export type PublicSelectRaw = Pick<
  DbExamQuestion,
  "question_text" | "question_text_struct" | "question_type" | "difficulty_level" | "collection_level"
> & {
  user: {
    user_id: number;
    nickname: string;
    avatar_url?: string;
  } | null;
  comment: {
    id: string;
    total: number;
  };
  options: {
    index: number;
    text: string | null;
    type: string | null;
    data: string | null;
  }[];
  question_id: string;
  review?: {
    status: ReviewStatus;
    resolved_time?: string;
    comment?: string;
  } | null;
};

const SELECT_PUBLIC = [
  "q.question_text",
  "q.question_text_struct",
  "q.question_type",

  "q.difficulty_level",
  "q.collection_level",

  select(
    jsonb_build_object({
      user_id: "u.id",
      nickname: "u.nickname",
      avatar_url: `u.avatar`,
    }),
  )
    .from("public.user", { as: "u" })
    .where(`u.id = q.user_id`)
    .toSelect("user"),
  select(jsonb_build_object({ id: "q.comment_id::TEXT", total: "comment_tree.comment_total" }))
    .from("comment_tree")
    .where(`comment_tree.id = q.comment_id`)
    .toSelect("comment"),
  select(
    `array_agg(${jsonb_build_object({
      index: "m.index",
      text: "m.text",
      type: "m.media_type",
      data: "encode(m.media, 'base64')",
    })})`,
  )
    .from("exam_question_option", { as: "m" })
    .where("m.question_id = q.id")
    .toSelect("options"),
  "q.id::TEXT AS question_id",
];
function getReviewInfo() {
  return select(
    jsonb_build_object({
      status: "q.review_status",
      resolved_time: "r.resolved_time",
      comment: "r.comment",
    }),
  )
    .from("review", { as: "r" })
    .where(`r.id = q.review_id`);
}
export function getQuestionPublicSelect(option: { withReview?: boolean } = {}) {
  if (option.withReview) {
    return select<PublicSelectRaw>([...SELECT_PUBLIC, getReviewInfo().toSelect("review")]).from("exam_question", {
      as: "q",
    });
  }
  return select<PublicSelectRaw>(SELECT_PUBLIC).from("exam_question", { as: "q" });
}
export type QuestionDetailSelectRaw = PublicSelectRaw & {
  create_time: Date;
  update_time: Date;
  event_time?: Date;
  long_time?: boolean;
  answer_index: number[];
  answer_text: string;
  answer_text_struct?: TextStructure[];
};
export function getQuestionDetailSelect(option: {
  /** 如果不为空，返回审核信息，否则不返回审核信息 */
  requestUserId: number | null;
}) {
  const { requestUserId = null } = option;
  const SELECT = [
    ...SELECT_PUBLIC,
    "q.create_time",
    "q.update_time",
    "q.event_time",
    "q.long_time",
    "q.answer_index",
    "q.answer_text",
    "q.answer_text_struct",
    `(CASE WHEN q.user_id = ${v(requestUserId)} AND q.user_id IS NOT NULL THEN ${getReviewInfo().toSelect()} ELSE NULL END) AS review`,
  ];

  return select<QuestionDetailSelectRaw>(SELECT).from("exam_question", { as: "q" });
}
