import { ExamQuestionType } from "@ijia/school-db/db";

export type QuestionRules = {
  /** 题型数量 */
  number: number;
  /** 题型分数 */
  score: number;
  /** 题型时间限制（单位秒） */
  timeLimit?: number;
  type?: ExamQuestionType;
};


export type PaperTemplateGenRules = {
  total: number;
  rules: QuestionRules[]
};

export function getQuestionGenRulesTotal(rules: QuestionRules[]): number {
  return rules.reduce((total, rule) => total + rule.number, 0);
}