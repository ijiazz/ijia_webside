import type {
  ExaminationAnswerInput,
  ExaminationCreateInput,
  ExaminationDeleteInput,
  ExaminationQuestionOutput,
  ExaminationRecordOutput,
  ExaminationResultOutput,
} from "./examination/examination.dto.ts";
import type {
  ExaminationListResult,
  ExaminationInfoResult,
  ExaminationListParam,
} from "./examination/examination-list.dto.ts";

export * from "./examination/examination.dto.ts";
export * from "./examination/examination-list.dto.ts";

export interface ExaminationAPI {
  /** 创建考试 */
  "PUT /examination": {
    body: ExaminationCreateInput;
    response: {
      examination_id: string;
    };
  };
  /** 获取自己的考试列表 */
  "GET /examination": {
    query: ExaminationListParam;
    response: ExaminationListResult;
  };
  /** 获取考试信息 */
  "GET /examination/:exam_id": {
    params: { exam_id: string };
    response: ExaminationInfoResult;
  };
  /** 删除考试 */
  "DELETE /examination/:exam_id": {
    params: { exam_id: string };
    body: ExaminationDeleteInput;
  };
  /** 开始考试 */
  "POST /examination/:exam_id/start": {
    params: { exam_id: string };
  };
  /** 开始作答下一题 */
  "POST /examination/:exam_id/next": {
    params: { exam_id: string };
    response: ExaminationQuestionOutput;
  };
  /** 提交答案 */
  "POST /examination/:exam_id/answer": {
    params: { exam_id: string };
    body: ExaminationAnswerInput;
  };
  /** 交卷(结束考试) */
  "POST /examination/:exam_id/end": {
    params: { exam_id: string };
  };

  /** 查看作答记录 */
  "GET /examination/:exam_id/record": {
    params: { exam_id: string };
    response: ExaminationRecordOutput;
  };

  /** 获取考试结果 */
  "GET /examination/:exam_id/result": {
    params: { exam_id: string };
    response: ExaminationResultOutput;
  };
}
