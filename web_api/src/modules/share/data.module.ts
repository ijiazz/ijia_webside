import { Module } from "@nestjs/common";
import { getDbPool, DbQuery } from "@ijia/data/yoursql";
import { DB_QUERY_POOL } from "../services/const.ts";

@Module({
  providers: [
    {
      useFactory(...args) {
        return getDbPool();
      },
      provide: DB_QUERY_POOL,
    },
    {
      useFactory(...args) {
        return getDbPool();
      },
      provide: DbQuery,
    },
  ],
  exports: [DB_QUERY_POOL, DbQuery],
})
export class DataModule {
  constructor() {}
}
