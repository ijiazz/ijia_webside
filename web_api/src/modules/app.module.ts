import { Module, UseFilters } from "@nestjs/common";
import { ExampleModule } from "./example/example.module.ts";

@UseFilters()
@Module({
  imports: [ExampleModule],
  controllers: [],
})
export class AppModule {
  constructor() {}
}
