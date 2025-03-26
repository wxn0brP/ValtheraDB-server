import fs, { watch } from "fs";

fs.mkdirSync("parsers", { recursive: true });
const parsersDir = process.env.PARSERS_DIR || process.cwd() + "/parsers/";

const parsers = {};
export let parsersList = [];

export async function loadParsers() {
    for (const name of parsersList) {
        const parser = await import(`${parsersDir}${name}.js`);
        parsers[name] = parser.default;
    }
}

function loadParsersList() {
    parsersList = [];
    const parsersFile = fs.readdirSync(parsersDir).filter(file => file.endsWith(".js"));
    for (const parser of parsersFile) {
        const name = parser.replace(".js", "");
        parsersList.push(name);
    }
}

loadParsersList();

let parsersTimeout: NodeJS.Timeout | null = null;
watch(parsersDir, () => {
    if (parsersTimeout) clearTimeout(parsersTimeout);
    parsersTimeout = setTimeout(() => {
        loadParsersList();
        loadParsers();
    }, 100);
});

export default parsers;