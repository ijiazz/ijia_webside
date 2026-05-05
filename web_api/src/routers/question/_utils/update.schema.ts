import { QUESTION_MEDIA_UPDATE_SCHEMA } from "../_utils/create.schema.ts";
import { array, ExpectType, optional } from "@asla/wokao";
import { TEXT_STRUCT_SCHEMA } from "@/global/schema.ts";

export const UPDATE_QUESTION_PARAM_SCHEMA = {
  question_text: optional.string,
  question_text_struct: optional(TEXT_STRUCT_SCHEMA),
  explanation_text: optional.string,
  explanation_text_struct: optional(TEXT_STRUCT_SCHEMA),

  answer_index: optional(array("number")),
  event_time: optional.string,

  attachments: optional(array(QUESTION_MEDIA_UPDATE_SCHEMA)),
  options: optional(array(QUESTION_MEDIA_UPDATE_SCHEMA)),
} satisfies ExpectType;
