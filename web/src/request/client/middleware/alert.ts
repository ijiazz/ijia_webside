import { HoContext, HoResponse } from "@asla/hofetch";
import { apiEvent, MaintenanceEvent } from "../event.ts";

export async function alert(ctx: HoContext, next: () => Promise<HoResponse>): Promise<HoResponse> {
  const res = await next();

  /** 格式 ISO/ISO */
  const maintenance = res.headers.get("x-service-maintenance");
  MaintenanceEvent.maintenance = maintenance;
  const message = MaintenanceEvent.parseMessage(maintenance);
  if (message) {
    apiEvent.dispatchEvent(new MaintenanceEvent(message));
  }

  return res;
}
