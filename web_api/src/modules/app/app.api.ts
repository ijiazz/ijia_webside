import { ListDto } from "../dto_common.ts";
import { ContributorInfo } from "./app.dto.ts";

export interface AppApi {
  "GET /app/contributors": {
    response: ListDto<ContributorInfo>;
  };
}
