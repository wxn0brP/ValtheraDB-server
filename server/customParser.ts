import fs from "fs";

fs.mkdirSync("parsers", { recursive: true });
const parsersDir = process.cwd() + "/parsers/";

const parsers = {};
export const parsersList = [];

export async function loadParsers() {
    for (const name of parsersList) {
        const parser = await import(`${parsersDir}${name}.js`);
        parsers[name] = parser.default;
    }
}

const parsersFile = fs.readdirSync(parsersDir).filter(file => file.endsWith(".js"));
for (const parser of parsersFile) {
    const name = parser.replace(".js", "");
    parsersList.push(name);
}

export default parsers;