import React from "react";
import { CaptionFlow } from "@/lib/components/talk.tsx";

export function Test() {
  return (
    <div style={{ textAlign: "center" }}>
      <CaptionFlow
        text="测试ABCDEFG"
        speed={8}
        pause_ms={1000}
        segments={[
          { length: 2, speed: 4 },
          { length: 4, speed: 6 },
        ]}
        delay={1000}
      ></CaptionFlow>
    </div>
  );
}
