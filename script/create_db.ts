
import { createInitIjiaDb, } from "@ijia/school-db/testlib";


const PG_URL = new URL(Deno.env.get("PG_URL") || "pg://postgres@127.0.0.1:5432/postgres");
const DB_NAME = Deno.args[0] || "test_ijia_public";

await createInitIjiaDb(PG_URL, DB_NAME, { dropIfExists: true, test: true })
console.log(`数据库 ${DB_NAME} 初始化完成`);