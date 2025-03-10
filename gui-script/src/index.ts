import { changeEditor } from "./monaco";
import "./db";
import { editorType, run } from "./run";
import { loadMonacoTypes } from "./monaco.types";

document.querySelector<HTMLButtonElement>("#run").addEventListener("click", run);
window.addEventListener("keydown", (e) => {
    if (!e.ctrlKey) return;
    if (e.key !== "s") return;
    e.preventDefault();

    run();
});

editorType.addEventListener("change", (e) => {
    changeEditor((e.target as HTMLSelectElement).value as any);
});
setTimeout(() => {
    editorType.value = "ts";
    changeEditor("ts");
}, 100);
loadMonacoTypes();