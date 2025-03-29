import React, { useState } from "react";

export function HomePage() {
  const [count, setCount] = useState(0);
  return (
    <div style={{ padding: "20px", backgroundColor: "ButtonShadow" }}>
      Home Page {count}
      <button onClick={() => setCount((c) => c + 1)}>Add</button>
    </div>
  );
}
