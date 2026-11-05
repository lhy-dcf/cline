import { describe, expect, it } from "vitest";
import {
	flattenToolResultContent,
	TOOL_RESULT_CHAR_LIMIT,
} from "./compaction-shared.js";

describe("flattenToolResultContent", () => {
	it("keeps structured run_commands output instead of dropping it", () => {
		const content = [
			{ query: "ls", result: "README.md\nsrc", success: true },
		] as never;
		const flat = flattenToolResultContent(content);
		expect(flat).toContain("README.md");
		expect(flat).toContain("ls");
	});

	it("keeps structured read_files output", () => {
		const content = [
			{ query: "README.md", result: "# Title\nbody", success: true },
			{ query: "missing.ts", result: "file not found", success: false },
		] as never;
		const flat = flattenToolResultContent(content);
		expect(flat).toContain("# Title");
		expect(flat).toContain("file not found");
	});

	it("still flattens typed text and file blocks as before", () => {
		const content = [
			{ type: "text", text: "hello" },
			{ type: "file", path: "a.ts", content: "export {}" },
		] as never;
		expect(flattenToolResultContent(content)).toBe(
			'hello\n<file path="a.ts">\nexport {}\n</file>',
		);
	});

	it("bounds an oversized structured entry", () => {
		const content = [
			{
				query: "big",
				result: "x".repeat(TOOL_RESULT_CHAR_LIMIT * 3),
				success: true,
			},
		] as never;
		const flat = flattenToolResultContent(content);
		expect(flat.length).toBeLessThan(TOOL_RESULT_CHAR_LIMIT * 2);
		expect(flat).toContain("truncated");
	});
});
