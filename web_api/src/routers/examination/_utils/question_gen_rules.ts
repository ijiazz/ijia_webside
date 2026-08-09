import { ExamQuestionType } from "@ijia/school-db/db";

export type QuestionRules = {
  /** 题型数量 */
  number: number;
  /** 题型分数 */
  score: number;
  /** 题型时间限制（单位秒） */
  timeLimit?: number;
  /** 题目类型 */
  type?: ExamQuestionType;
};

export type PaperTemplateGenRules = {
  /** rules 下面的 number 总和 */
  question_total: number;
  /** 总分 */
  score_total: number;
  rules: QuestionRules[];
};

export function getQuestionGenRulesTotal(rules: QuestionRules[]): number {
  return rules.reduce((total, rule) => total + rule.number, 0);
}
