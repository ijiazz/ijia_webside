import { insertInto, pgSqlTransformer, SqlValuesCreator } from "@asla/yoursql";

export const v = SqlValuesCreator.create(pgSqlTransformer);
export function insertIntoValues(table: string, values: object | object[]) {
  const { columns, text } = v.createImplicitValues(values);

  return insertInto(table, columns).values(text);
}
