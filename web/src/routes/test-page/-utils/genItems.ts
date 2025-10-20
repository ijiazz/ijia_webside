export async function* genItems(signal: AbortSignal) {
  for (let i = 0; ; i++) {
    yield {
      id: `${i}`,
      like_count: i,
      text: `hello ${i}`,
      user: { avatar_url: "", nickname: `nickname ${i}`, user_id: `${i}` },
    };
    await new Promise((r) => setTimeout(r, 300));
    if (signal.aborted) {
      break;
    }
  }
}
