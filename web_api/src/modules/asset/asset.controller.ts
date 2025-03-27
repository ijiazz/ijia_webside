import { Controller, Get } from "@asla/hono-decorator";
import { selectAssetList } from "./sql/asset.ts";
import { AssetItemDto, GetAssetListParam } from "./asset.dto.ts";

@Controller({})
class AssetController {
  @Get("/live/asset")
  async getAssetList(option: GetAssetListParam & { published_id?: string } = {}): Promise<AssetItemDto[]> {
    const list = await selectAssetList(option);

    return list.map((item): AssetItemDto => {
      const data: AssetItemDto = {
        ...item,
        type: parseInt(item.type, 2),
      };
      //TODO 转换资源格式
      if (item.image?.length) {
        const cover = item.image[0];
        data.cover = {
          origin: { url: cover.uri },
        };
      }

      return data;
    });
  }
}

export const assetController = new AssetController();
