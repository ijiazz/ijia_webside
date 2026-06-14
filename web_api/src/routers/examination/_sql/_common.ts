import { HttpError } from "@/common/errors.ts";

type OwnedExaminationRow = {
  id: number;
  user_id: number;
  title: string | null;
  template_id: number | null;
  use_time_total_limit: number;
  allow_time_start: Date | null;
  allow_time_end: Date | null;
  result_allow_view_date: Date | null;
  start_time: Date;
  end_time: Date | null;
  grade: number | null;
  use_time_total: number;
  correct_count: number;
  wrong_count: number;
  question_number: number | null;
  has_started: boolean;
};

export function assertExaminationEnded(exam: Pick<OwnedExaminationRow, "end_time">) {
  if (!exam.end_time) {
    throw new HttpError(409, "考试尚未结束");
  }
}
