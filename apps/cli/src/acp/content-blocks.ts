import type { ContentBlock } from "@agentclientprotocol/sdk";

/**
 * Matches a leading `data:<mimeType>;base64,` prefix.
 *
 * `:` is not part of the base64 alphabet, so a string carrying this prefix is
 * not bare base64 and stripping it cannot damage a well-formed payload.
 */
const DATA_URL_PREFIX = /^data:[^;,]+;base64,/;

/**
 * Joins the text blocks of an ACP prompt into a single string.
 *
 * Non-text blocks are ignored here; images are handled separately by
 * {@link extractImageDataUrlsFromContentBlocks} so they can be forwarded as
 * attachments instead of being dropped.
 */
export function extractTextFromContentBlocks(blocks: ContentBlock[]): string {
	return blocks
		.filter((b): b is ContentBlock & { type: "text" } => b.type === "text")
		.map((b) => b.text)
		.join("\n");
}

/**
 * Converts the image blocks of an ACP prompt into the base64 data URLs that the
 * runtime expects in `SendSessionInput.userImages`.
 *
 * ACP sends `data` as bare base64 plus a required `mimeType`; the runtime wants
 * the `data:<mimeType>;base64,<data>` form produced by `bufferToImageDataUrl`.
 * A client that sends a full data URL anyway is unwrapped rather than wrapped
 * twice.
 */
export function extractImageDataUrlsFromContentBlocks(
	blocks: ContentBlock[],
): string[] {
	return blocks
		.filter((b): b is ContentBlock & { type: "image" } => b.type === "image")
		.map(
			(b) => `data:${b.mimeType};base64,${b.data.replace(DATA_URL_PREFIX, "")}`,
		);
}
