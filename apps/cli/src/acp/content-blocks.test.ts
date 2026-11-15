import type { ContentBlock } from "@agentclientprotocol/sdk";
import { describe, expect, it } from "vitest";

import {
	extractImageDataUrlsFromContentBlocks,
	extractTextFromContentBlocks,
} from "./content-blocks";

const PNG_BASE64 =
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==";

function text(value: string): ContentBlock {
	return { type: "text", text: value };
}

function image(data: string, mimeType: string): ContentBlock {
	return { type: "image", data, mimeType };
}

describe("extractTextFromContentBlocks", () => {
	it("joins multiple text blocks with a newline", () => {
		expect(extractTextFromContentBlocks([text("first"), text("second")])).toBe(
			"first\nsecond",
		);
	});

	it("returns an empty string when the prompt has no text blocks", () => {
		expect(extractTextFromContentBlocks([image(PNG_BASE64, "image/png")])).toBe(
			"",
		);
		expect(extractTextFromContentBlocks([])).toBe("");
	});

	it("ignores non-text blocks when text is present", () => {
		expect(
			extractTextFromContentBlocks([
				image(PNG_BASE64, "image/png"),
				text("describe this"),
			]),
		).toBe("describe this");
	});
});

describe("extractImageDataUrlsFromContentBlocks", () => {
	it("converts an image block into a base64 data URL", () => {
		expect(
			extractImageDataUrlsFromContentBlocks([image(PNG_BASE64, "image/png")]),
		).toEqual([`data:image/png;base64,${PNG_BASE64}`]);
	});

	it("keeps the declared mime type", () => {
		expect(
			extractImageDataUrlsFromContentBlocks([
				image("AAAA", "image/jpeg"),
				image("BBBB", "image/webp"),
			]),
		).toEqual(["data:image/jpeg;base64,AAAA", "data:image/webp;base64,BBBB"]);
	});

	it("returns no images for a text-only prompt", () => {
		expect(extractImageDataUrlsFromContentBlocks([text("hello")])).toEqual([]);
		expect(extractImageDataUrlsFromContentBlocks([])).toEqual([]);
	});

	it("does not double-wrap data that already carries a data URL prefix", () => {
		// ACP specifies bare base64 in `data`. A client that sends a full data URL
		// anyway would otherwise produce `data:image/png;base64,data:image/png;...`,
		// so the prefix is stripped before wrapping.
		expect(
			extractImageDataUrlsFromContentBlocks([
				image(`data:image/png;base64,${PNG_BASE64}`, "image/png"),
			]),
		).toEqual([`data:image/png;base64,${PNG_BASE64}`]);
	});
});
