import { Module } from "@nestjs/common";
import { getDbPool, DbQuery } from "@ijia/data/yoursql";

export const DB_QUERY_POOL = "db_query_pool";
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
