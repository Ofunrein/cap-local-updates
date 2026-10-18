import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import resolver from "../../../../packages/config/vite/relativeAliasResolver";

let directory: string;
beforeEach(async () => {
	directory = await mkdtemp(join(tmpdir(), "cap-alias-test-"));
});
afterEach(async () => {
	await rm(directory, { recursive: true, force: true });
});
const resolve = (source: string, importer?: string) => {
	const customResolver = resolver.customResolver;
	if (typeof customResolver !== "function") throw new Error("Missing resolver");
	return Reflect.apply(customResolver, undefined, [source, importer, {}]);
};

describe("relative aliases", () => {
	it("resolves a source-root file without a package walk", async () => {
		await mkdir(join(directory, "src"));
		await writeFile(join(directory, "src", "target.ts"), "export {};");
		await expect(
			resolve("~/target", join(directory, "src", "entry.ts")),
		).resolves.toBe(join(directory, "src", "target.ts"));
	});
	it("finds the enclosing package for an importer outside src", async () => {
		await writeFile(join(directory, "package.json"), "{}");
		await writeFile(join(directory, "target.tsx"), "export {};");
		await mkdir(join(directory, "nested"));
		await expect(
			resolve("~/target", join(directory, "nested", "entry.ts")),
		).resolves.toBe(join(directory, "target.tsx"));
	});
	it("resolves directory imports to their index", async () => {
		await mkdir(join(directory, "src", "target"), { recursive: true });
		await writeFile(join(directory, "src", "target", "index.ts"), "export {};");
		await expect(
			resolve("~/target", join(directory, "src", "entry.ts")),
		).resolves.toBe(join(directory, "src", "target", "index.ts"));
	});
	it("reports a missing importer or module explicitly", async () => {
		await mkdir(join(directory, "src"));
		await expect(resolve("~/target")).rejects.toThrow("without an importer");
		await expect(
			resolve("~/target", join(directory, "src", "entry.ts")),
		).rejects.toThrow("Failed to resolve import path ~/target");
	});
});
