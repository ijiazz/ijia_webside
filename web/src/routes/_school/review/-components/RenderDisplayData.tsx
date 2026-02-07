import { ReviewDisplayItemType, ReviewItem } from "@/api.ts";
import { TextStruct } from "@/components/TextStructure.tsx";

type RenderDisplayDataProps = {
  data: ReviewItem<unknown>["review_display"];
};
export function RenderDisplayData(props: RenderDisplayDataProps) {
  const { data } = props;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {data.map((item, index) => {
        switch (item.type) {
          case ReviewDisplayItemType.text: {
            const { new: news, old } = item;
            return (
              <>
                {old && <TextStruct structure={old?.testStructure} text={old?.text} />}
                {news && <TextStruct structure={news?.testStructure} text={news?.text} />}
              </>
            );
          }
          case ReviewDisplayItemType.media: {
            const { new: news, old } = item;
          }
          default:
            return <div style={{ whiteSpace: "pre" }}>{JSON.stringify(item)}</div>;
        }
      })}
    </div>
  );
}
