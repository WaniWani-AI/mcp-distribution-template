import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import "dotenv/config";
import { wani } from "../server/src/lib/waniwani.js";

// Uploads every markdown file under knowledge-base/ to the WaniWani knowledge
// base, so the `faq` tool can search them. Run with `bun run kb:ingest`.
//
// WARNING: ingestion is destructive — it replaces ALL existing chunks for the
// environment with the files found here. Requires WANIWANI_API_KEY.

const knowledgeDir = join(import.meta.dirname, "../knowledge-base");

async function findMdFiles(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true });
	const files: string[] = [];
	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await findMdFiles(fullPath)));
		} else if (entry.name.endsWith(".md")) {
			files.push(fullPath);
		}
	}
	return files;
}

const mdFilePaths = await findMdFiles(knowledgeDir);

if (mdFilePaths.length === 0) {
	console.error(`No .md files found in ${knowledgeDir}`);
	process.exit(1);
}

const files = await Promise.all(
	mdFilePaths.map(async (path) => ({
		filename: relative(knowledgeDir, path),
		content: await readFile(path, "utf-8"),
	})),
);

console.log(`Ingesting ${files.length} file(s) from ${knowledgeDir}:`);
for (const f of files) console.log(`  - ${f.filename}`);
console.log("⚠️  This replaces all existing KB chunks for this environment.");

const result = await wani.kb.ingest(files);

console.log(
	`\nDone ✅ — ${result.chunksIngested} chunks from ${result.filesProcessed} files.`,
);
process.exit(0);
