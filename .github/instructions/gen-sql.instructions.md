# 生成 SQL 语句的 Copilot Instructions

本文件用于指导 GitHub Copilot 如何生成 SQL 语句释代码。

## 在 TypeScript 中编写 SQL 查询语句的约定

编写 SQL 时，优先使用 sql 生成工具库 `@asla/yoursql`(https://github.com/asnowc/yoursql)

### 一些示例

**安全转换值，避免 SQL 注入**

```ts
import { PUBLIC_CLASS_ROOT_ID } from "@ijia/data/db";
import { dbPool } from "@/db/client.ts";
import { v } from "@/sql/utils.ts";
// 如果 PUBLIC_CLASS_ROOT_ID 是用户参数，需要用 v 函数转换，这会将 JavaScript 值转换成 SQL 值
const rows = await dbPool.queryRows(`SELECT * FROM class WHERE id=${v(PUBLIC_CLASS_ROOT_ID)}`);
```

**直接使用 SQL 文本查询**

```ts
import { dbPool } from "@/db/client.ts";
const rows1 = await dbPool.queryRows("SELECT * from public.user LIMIT 10"); // 自动获取连接，查询完成后自动释放连接
```

**获取一个 SQL 连接来查询**

```ts
import { dbPool } from "@/db/client.ts";
using conn = await dbPool.connect(); // 离开作用域自动释放连接
const rows1 = await conn.queryRows("SELECT * from public.user LIMIT 10"); // 自动获取连接，查询完成后自动释放连接
```

**如果需要事务**

```ts
await using transaction = dbPool.begin(); //这会在执行第一条语句时自动从连接池获取连接。 使用 using，不需要捕获异常
await transaction.queryRows("SELECT * from public.user LIMIT 10");
await transaction.commit();
```

**使用 SQL 生成工具**

```ts
import { v } from "@/sql/utils.ts";
import { select } from "@asla/yoursql";

const sqlStr = select("class_id AS id, class_name")
  .from("class")
  .where(`parent_class_id=${v(PUBLIC_CLASS_ROOT_ID)}`)
  .genSql();
```

## 数据库相关文件定义

数据库相关常数在 `@ijia/data/db` 包中。

- 这个包导出了项目在数据库中需要用到的一些表结构类型、枚举常量
- 这个包在 `deps/ijia-data/src/db` 目录下，通过 git submodule 引入在项目中。

### 数据库表的定义说明

所有的数据库的初始化 sql 文件都在 `deps/ijia-data/sql/init` 目录下
