import esbuild from "esbuild";

const workerEntryPoints = [
	"vs/language/json/json.worker.js",
	"vs/language/css/css.worker.js",
	"vs/language/html/html.worker.js",
	"vs/language/typescript/ts.worker.js",
	"vs/language/typescript/ts.worker.js",
	"vs/editor/editor.worker.js"
];

esbuild.build({
	entryPoints: workerEntryPoints.map((entry) => `node_modules/monaco-editor/esm/${entry}`),
	bundle: true,
	format: "iife",
	outbase: "node_modules/monaco-editor/esm/",
	outdir: "dist",
    splitting: false,
});

esbuild.build({
	entryPoints: ["src/index.ts"],
    outdir: "dist",
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    sourcemap: true,
    minify: true,
    treeShaking: true,
    splitting: false,
    keepNames: true,
    tsconfig: "tsconfig.json",
    logLevel: "info",
	loader: {
		".ttf": "file",
        ".ts": "ts"
	}
});