import { ReviewDisplayItemType, ReviewItem } from "@/api.ts";
import { TextStruct } from "@/components/TextStructure.tsx";
import { ReactNode } from "react";

type RenderDisplayDataProps = {
  data: ReviewItem<unknown>["review_display"];
};
export function RenderDisplayData(props: RenderDisplayDataProps) {
  const { data = [] } = props;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {data.map((item, index) => {
        let element: ReactNode;
        switch (item.type) {
          case ReviewDisplayItemType.text: {
            const { new: news, old } = item;
            element = (
              <>
                {old && <TextStruct structure={old?.testStructure} text={old?.text} />}
                {news && <TextStruct structure={news?.testStructure} text={news?.text} />}
              </>
            );
            break;
          }
          case ReviewDisplayItemType.media: {
            const { new: news, old } = item;
            break;
          }
          default:
            element = <div style={{ whiteSpace: "pre" }}>{JSON.stringify(item)}</div>;
            break;
        }
        return <div key={index}> {element}</div>;
      })}
    </div>
  );
}
