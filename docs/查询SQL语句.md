## 数据库

### 数据库相关常数

数据库相关常数在 `@ijia/data/db` 中。`@ijia/data` 通过 git submodule 引入在项目中。

具体位置在 deps/ijia-data 目录下

### 查询 SQL 语句

sql 生成器使用 `@asla/yoursql`(https://github.com/asnowc/yoursql)。你需要了解一下使用方法

**安全转换值，避免 SQL 注入**

```ts
import { PUBLIC_CLASS_ROOT_ID } from "@ijia/data/db";
import { dbPool } from "@/db/client.ts";
import v from "@/db/client.ts";
// 如果 PUBLIC_CLASS_ROOT_ID 是用户参数，需要用 v 函数转换，这会将 JavaScript 值转换成 SQL 值
const rows = await dbPool.queryRows(`SELECT * FROM class WHERE id=${v(PUBLIC_CLASS_ROOT_ID)}`);
```

**直接使用 SQL 文本查询**

```ts
import { v } from "@ijia/data/db";
import { select } from "@asla/yoursql";
import { dbPool } from "@/db/client.ts";

const sqlStr = select("class_id AS id, class_name")
  .from("class")
  .where(`parent_class_id=${v(PUBLIC_CLASS_ROOT_ID)}`)
  .toString(); // 可以不执行查询，而转成 SQL 字符串，方便调试

using conn = await dbPool.connect(); // 使用using ，不需要手动释放连接
const rows1 = await conn.queryRows(sqlStr);
const rows2 = await conn.queryRows("SELECT * from public.user LIMIT 10");
```

**如果需要事务**

```ts
await using transaction = dbPool.begin(); //这会在执行第一条语句时自动从连接池获取连接。 使用using，不需要捕获异常
await transaction.queryRows("SELECT * from public.user LIMIT 10");
await transaction.commit();
```

## Redis 操作

```ts
import { dbPool } from "@/services/redis";

// 从连接池获取 redis 客户端实例，示例方法参见官方文档 https://www.npmjs.com/package/redis
using redis = await redisPool.connect(); // 使用 using ，不需要手动释放连接
await redis.set("test", "test");
```
