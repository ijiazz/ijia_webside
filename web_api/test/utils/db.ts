import { parserDbConnectUrl } from "@asla/pg";

const TEST_DB_LOGIN_URL = process.env.PG_URL || "pg://postgres@127.0.0.1:5432/postgres";

export const DB_CONNECT_INFO = parserDbConnectUrl(TEST_DB_LOGIN_URL);

const PUBLIC_DB_NAME = "test_ijia_public";

export const PUBLIC_CONNECT_INFO = { ...DB_CONNECT_INFO, database: PUBLIC_DB_NAME };
