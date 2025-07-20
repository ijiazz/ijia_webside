import React, { useEffect, useRef, useState } from "react";

export function Test() {
  const renderCount = useRef(0);
  renderCount.current++;
  const [mountTime] = useState(() => new Date().toLocaleTimeString());
  useEffect(() => {
    console.log("Mount");
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <div>render count: {renderCount.current}</div>
      <div>mount time: {mountTime}</div>
    </div>
  );
}
