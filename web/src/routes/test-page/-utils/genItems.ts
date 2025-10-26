export async function* genItems(signal: AbortSignal) {
  for (let i = 0; ; i++) {
    yield {
      id: `${i}`,
      like_count: i,
      text: `hello ${i}` + "_".repeat(Math.floor(Math.random() * 20)),
      user: { avatar_url: "", nickname: `nickname ${i}`, user_id: `${i}` },
    };
    await new Promise((r) => setTimeout(r, 300));
    if (signal.aborted) {
      break;
    }
  }
}
