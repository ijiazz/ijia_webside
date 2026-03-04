export type ListenStreamOption = {
  onStart?: () => void;
  onProgress?: (uploadedBytes: number) => void;
  onFinish?: () => void;
};
export function listenStream(stream: ReadableStream<Uint8Array>, option: ListenStreamOption) {
  const { onStart, onProgress, onFinish } = option ?? {};

  let uploaded = 0;
  return stream.pipeThrough(
    new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(chunk);
        uploaded += chunk.length;
        onProgress?.(uploaded);
      },
      start: onStart ? () => onStart() : undefined,
      flush: onFinish ? () => onFinish() : undefined,
    }),
  );
}
