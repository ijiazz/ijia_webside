import { dbPool } from "@/db/client.ts";
import { ExaminationInfoResult, ExaminationListParam, ExaminationListResult, ExaminationStatus } from "@/dto.ts";
import { v } from "@/sql/utils.ts";
import { DbExamination } from "@ijia/school-db/db";
import { HttpError } from "@/common/errors.ts";
import { select } from "@asla/yoursql";

export async function getExaminationList(
  userId: number,
  param: ExaminationListParam & { id?: number },
): Promise<ExaminationListResult> {
  const { cursor, limit = 15, status, id } = param;
  const cursorId = cursor ? parseCursor(cursor) : undefined;

  const sql = select([
    "e.id::TEXT",
    "COALESCE(e.title, '未命名考试') AS title",
    "e.allow_time_start",
    "e.allow_time_end",
    "e.start_time",
    "e.end_time",
    "e.grade",
    "t.question_total AS question_number",
  ])
    .from("examination", { as: "e" })
    .leftJoin("exam_paper_template", { as: "t", on: "t.id=e.template_id" })
    .where(() => {
      const conditions = [`e.user_id=${v(userId)}`];
      if (id !== undefined) {
        conditions.push(`e.id=${v(id)}`);
      }
      if (cursorId) {
        conditions.push(`e.id < ${v(cursorId)}`);
      }
      if (status) {
        conditions.push(...getStatusWhere(status));
      }
      return conditions;
    })
    .orderBy("e.id DESC")
    .limit(limit);
  const rows = await dbPool.queryRows<ExaminationBaseRow>(sql);

  return {
    items: rows.map(toExaminationInfo),
    cursor_prev: rows[0] ? toCursor(rows[0].id) : null,
    cursor_next: rows.length === limit ? toCursor(rows[rows.length - 1].id) : null,
  };
}
function parseCursor(raw: string) {
  const id = parseInt(raw, 10);
  if (!Number.isSafeInteger(id)) {
    throw new HttpError(400, "Invalid cursor");
  }
  return id;
}
export function toCursor(id: number | string) {
  return id.toString();
}
function getStatusWhere(status: ExaminationStatus) {
  switch (status) {
    case ExaminationStatus.upcoming:
      return [
        "e.start_time IS NULL",
        "e.end_time IS NULL",
        `e.allow_time_start IS NOT NULL AND e.allow_time_start > now()`,
      ];
    case ExaminationStatus.ready:
      return [
        "e.start_time IS NULL",
        "e.end_time IS NULL",
        `(e.allow_time_start IS NULL OR e.allow_time_start <= now())`,
        `(e.allow_time_end IS NULL OR e.allow_time_end >= now())`,
      ];
    case ExaminationStatus.ongoing:
      return ["e.start_time IS NOT NULL", "e.end_time IS NULL"];
    case ExaminationStatus.ended:
      return [
        `((e.end_time IS NOT NULL AND e.grade IS NULL) OR (e.end_time IS NULL AND e.allow_time_end IS NOT NULL AND e.allow_time_end < now()))`,
      ];
    case ExaminationStatus.result:
      return ["e.end_time IS NOT NULL", "e.grade IS NOT NULL"];
  }
}

type ExaminationBaseRow = Pick<
  DbExamination,
  "grade" | "allow_time_end" | "allow_time_start" | "start_time" | "end_time"
> & {
  title: string;
  id: string;
  question_number: number | null;
};
function toExaminationInfo(row: ExaminationBaseRow): ExaminationInfoResult {
  const { start_time, end_time, ...rest } = row;
  return {
    ...rest,
    allow_time_end: row.allow_time_end ? row.allow_time_end.toISOString() : null,
    allow_time_start: row.allow_time_start ? row.allow_time_start.toISOString() : null,
    status: getExaminationStatus(row),
  };
}
function getExaminationStatus(item: ExaminationBaseRow, now = new Date()): ExaminationStatus {
  if (item.end_time) {
    return item.grade === null ? ExaminationStatus.ended : ExaminationStatus.result;
  }
  if (item.allow_time_end && item.allow_time_end.getTime() < now.getTime()) {
    return ExaminationStatus.ended;
  }
  if (item.allow_time_start && item.allow_time_start.getTime() > now.getTime()) {
    return ExaminationStatus.upcoming;
  }
  return ExaminationStatus.ready;
}
