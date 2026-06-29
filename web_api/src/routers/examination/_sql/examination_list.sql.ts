import { dbPool } from "@/db/client.ts";
import { ExaminationInfoOutput, ExaminationListParam, ExaminationListOutput, ExaminationStatus } from "@/dto.ts";
import { v } from "@/sql/utils.ts";
import { select } from "@asla/yoursql";
import { DbExamination } from "@ijia/school-db/db";
import { HttpError } from "@/common/errors.ts";

export async function getExaminationList(
  userId: number,
  param: ExaminationListParam & { id?: number },
): Promise<ExaminationListOutput> {
  const { cursor, limit = 15, status, id } = param;
  const cursorId = cursor ? parseCursor(cursor) : undefined;

  const sql = select([
    "e.id::TEXT",
    "COALESCE(e.title, '未命名考试') AS title",
    "e.allow_time_start",
    "e.allow_time_end",
    "e.start_time",
    "e.end_time",
    "e.result_allow_view_date",
    "e.use_time_total_limit / 1000 AS use_time_total_limit",
    "e.grade",
    "e.question_total AS question_number",
    `${examinationStatus("e")} AS status`,
  ])
    .from("examination", { as: "e" })
    .where(() => {
      const conditions = [`e.user_id=${v(userId)}`];
      if (id !== undefined) {
        conditions.push(`e.id=${v(id)}`);
      }
      if (cursorId) {
        conditions.push(`e.id < ${v(cursorId)}`);
      }
      if (status) {
        if (status instanceof Array) {
          const condition = status.map((status) => "(" + getStatusWhere(status).join(" AND ") + ")").join(" OR ");
          conditions.push("(" + condition + ")");
        } else {
          conditions.push(...getStatusWhere(status));
        }
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
      return [
        "e.end_time IS NOT NULL",
        "e.grade IS NOT NULL",
        "e.result_allow_view_date IS NULL OR e.result_allow_view_date <= now()",
      ];
  }
}

type ExaminationBaseRow = Pick<
  DbExamination,
  "grade" | "allow_time_end" | "allow_time_start" | "use_time_total_limit"
> & {
  title: string;
  id: string;
  question_number: number | null;
  status: ExaminationStatus;
};
function toExaminationInfo(row: ExaminationBaseRow): ExaminationInfoOutput {
  return {
    ...row,
    allow_time_end: row.allow_time_end ? row.allow_time_end.toISOString() : null,
    allow_time_start: row.allow_time_start ? row.allow_time_start.toISOString() : null,
  };
}

function examinationStatus(table: string) {
  return `CASE
    WHEN ${table}.end_time IS NOT NULL THEN
        CASE
          WHEN ${table}.grade IS NULL THEN 'ended'
          WHEN ${table}.result_allow_view_date IS NULL OR ${table}.result_allow_view_date <= now() THEN 'result'
          ELSE 'ended' END
    WHEN ${table}.allow_time_end IS NOT NULL AND ${table}.allow_time_end < now() THEN 'ended'
    WHEN ${table}.allow_time_start IS NOT NULL AND ${table}.allow_time_start > now() THEN 'upcoming'
    WHEN ${table}.start_time IS NOT NULL AND ${table}.end_time IS NULL THEN 'ongoing'
    ELSE 'ready'
  END`;
}
