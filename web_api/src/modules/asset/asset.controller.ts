import { Controller, Get } from "@asla/hono-decorator";
import { selectAssetList } from "./sql/asset.ts";
import { AssetItemDto, GetAssetListParam } from "./asset.dto.ts";
import { autoBody } from "@/global/pipe.ts";
import { ListDto } from "../dto_common.ts";

@autoBody
@Controller({})
class AssetController {
  @Get("/live/asset")
  async getAssetList(option: GetAssetListParam = {}): Promise<ListDto<AssetItemDto>> {
    const raw = await selectAssetList(option);

    const list = raw.map((item): AssetItemDto => {
      const data: AssetItemDto = {
        ...item,
        type: parseInt(item.type, 2),
      };
      //TODO 转换资源格式
      if (item.image?.length) {
        const cover = item.image[0];
        data.cover = {
          origin: {
            url: cover.uri,
            height: cover.height,
            width: cover.width,
          },
          thumb: {
            url: cover.uri,
            height: cover.height,
            width: cover.width,
          },
        };
      }

      return data;
    });
    return { items: list, total: 0 };
  }
}

export const assetController = new AssetController();
