import type { DbExamQuestion, DbExamQuestionOption } from "@ijia/school-db/db";

export interface TestExaminationAPI {
  /**
   * 创建题目
   */
  "POST /test/question/prepare-reviewed": {
    body: { count: number; userId: number };
    response: { questionIds: number[] };
  };
  "POST /test/template/prepare": {
    body: PrepareTemplateInput;
    response: {
      templateId: number;
      questionIds: number[];
    };
  };
  "POST /test/examination/prepare": {
    body: PrepareExaminationInput;
    response: {
      number: number;
    };
  };
}

export type PrepareTemplateInput = {
  questions: TemplateQuestionInput[];
  ownerId?: number;
};

export type PrepareExaminationInput = {
  userId: number;
  allowTimeStart?: Date;
  allowTimeEnd?: Date;
  resultAllowViewDate?: Date;
  useTimeTotalLimit?: number;
  title?: string;
  templateId?: number;
  questionTotal?: number;
};

export type TemplateQuestionInput = Pick<DbExamQuestion, "answer_index" | "question_type"> & {
  score?: number;
  option_map?: number[];
  options?: Partial<DbExamQuestionOption>[];
  time_limit?: number;
};
