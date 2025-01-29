import { Module } from "@nestjs/common";
import { ExampleModule } from "./example/example.module.ts";
import { StatModule } from "./stat/stat.module.ts";
@Module({
  imports: [ExampleModule, StatModule],
})
export class AppModule {
  constructor() {}
}
