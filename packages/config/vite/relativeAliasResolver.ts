import fs from "node:fs/promises";
import path from "node:path";
import type { Alias } from "vite";

const pkgJsonCache = new Map<string, boolean>();

const resolver: Alias = {
	find: /^(~\/.+)/,
	replacement: "$1",
	async customResolver(source, importer) {
		if (!importer) {
			throw new Error(
				`Failed to resolve import path ${source} without an importer`,
			);
		}
		let root: null | string = null;

		const sourcePath = source.slice(2);

		if (importer.includes("/src/")) {
			root = `${importer.slice(0, importer.indexOf("/src/"))}/src`;
		} else {
			let parent = importer;

			while (parent !== "/") {
				parent = path.dirname(parent);

				let hasPkgJson = pkgJsonCache.get(parent);

				if (hasPkgJson === undefined)
					try {
						await fs.stat(`${parent}/package.json`);
						hasPkgJson = true;
						pkgJsonCache.set(parent, hasPkgJson);
					} catch {
						hasPkgJson = false;
						pkgJsonCache.set(parent, hasPkgJson);
					}

				if (hasPkgJson) {
					root = parent;
					break;
				}
			}

			if (root === null)
				throw new Error(
					`Failed to resolve import path ${source} in file ${importer}`,
				);
		}

		const absolutePath = `${root}/${sourcePath}`;

		const folderItems = await fs.readdir(path.join(absolutePath, "../"));

		const item = folderItems.find((i) =>
			i.startsWith(sourcePath.split("/").at(-1) ?? ""),
		);
		if (!item) {
			throw new Error(
				`Failed to resolve import path ${source} in file ${importer}`,
			);
		}

		const fullPath = absolutePath + path.extname(item);

		const stats = await fs.stat(fullPath);

		if (stats.isDirectory()) {
			const directoryItems = await fs.readdir(
				absolutePath + path.extname(item),
			);

			const indexFile = directoryItems.find((i) => i.startsWith("index"));

			return `${absolutePath}/${indexFile}`;
		} else {
			return fullPath;
		}
	},
};

export default resolver;
