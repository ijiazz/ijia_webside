import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./modules/app.module.ts";
// import { HttpExceptionFilter } from "./filters/exp.filter.js";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  const mode: string = "dev";
  let port: number;
  switch (mode) {
    case "dev":
      //   app.useGlobalFilters(new HttpExceptionFilter());
      port = 3000;
      break;
    case "prod":
      //   app.use(loggerMiddleware); //首页访问日志
      port = 80;
      break;
    default:
      throw new Error("请通过环境变量设置MODE正确的值");
  }
  //   if (config.LOGS_DIR) app.useGlobalInterceptors(new LoggerInterceptor());

  await app.listen({ port, host: "0.0.0.0" });
  console.log("start:" + port);
}
bootstrap();
