import { ExpectType, array } from "evlib/validator";

export function imgSelectionVerificationReplyChecker() {
  return { session_id: "string", selectedImageId: array.string } satisfies ExpectType;
}
