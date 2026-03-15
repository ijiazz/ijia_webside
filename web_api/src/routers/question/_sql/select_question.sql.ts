import { MediaType } from "@/dto.ts";
import { jsonb_build_object } from "@/global/sql_util.ts";
import { select } from "@asla/yoursql";
import { DbExamQuestion } from "@ijia/data/db";

export type PublicSelectRaw = Pick<
  DbExamQuestion,
  "question_text" | "question_text_struct" | "question_type" | "option_text" | "difficulty_level" | "collection_level"
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
  medias: {
    index: number;
    title: string | null;
    type: MediaType;
    url: string;
  }[];
  question_id: string;
};

const SELECT_PUBLIC = [
  "q.question_text",
  "q.question_text_struct",
  "q.question_type",

  "q.option_text",

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
      filename: "m.filename",
      title: "m.title",
      type: "m.type",
      url: "m.url",
    })})`,
  )
    .from("exam_question_media", { as: "m" })
    .where("m.question_id = q.id")
    .orderBy("m.index ASC")
    .toSelect("medias"),
  "q.id::TEXT AS question_id",
];
export function getQuestionPublicSelect() {
  return select<PublicSelectRaw>(SELECT_PUBLIC).from("exam_question", { as: "q" });
}
export type QuestionDetailSelectRaw = PublicSelectRaw & {
  create_time: Date;
  update_time: Date;
  event_time?: Date;
  long_time?: boolean;
};
export function getQuestionDetailSelect() {
  return select<QuestionDetailSelectRaw>([
    ...SELECT_PUBLIC,
    "q.create_time",
    "q.update_time",
    "q.event_time",
    "q.long_time",
  ]).from("exam_question", {
    as: "q",
  });
}
