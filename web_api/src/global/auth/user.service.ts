import { Injectable } from "@nestjs/common";
import { user_role_bind } from "@ijia/data/db";
import { v } from "@ijia/data/yoursql";

@Injectable()
export class UserService {
  async includeRoles(userId: number, roles: string[]): Promise<boolean> {
    if (!roles.length) return false;
    const select = user_role_bind.select({ role_id: true });

    let count: number;
    if (roles.length === 1) {
      count = await select
        .where(`id=${v(userId)} AND role_id=${v(roles[0])}`)
        .limit(1)
        .queryCount();
    } else {
      count = await select
        .where(`id=${v(userId)} AND role_id IN (${roles.map((item) => v(item))})`)
        .limit(1)
        .queryCount();
    }
    return count > 0;
  }
}
