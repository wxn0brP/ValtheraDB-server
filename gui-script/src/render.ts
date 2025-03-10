import { convertJsonToJS } from "./utils";

const resultDiv = document.querySelector<HTMLDivElement>("#result");
const displayType = document.querySelector<HTMLSelectElement>("#display-type");
const dbResult = { ref: null };

export function writeResult(res: any) {
    dbResult.ref = res;
    renderData();
}

function renderData() {
    const type = displayType.value;
    const res = dbResult.ref;
    if (type === "card") {
        resultDiv.innerHTML = "";
        resultDiv.appendChild(card_renderValue(res));
    } else if (type === "table") {
        resultDiv.innerHTML = "";
        if (Array.isArray(res)) table_render(res, resultDiv);
        else resultDiv.appendChild(card_renderValue(res));
    } else if (type === "raw") {
        resultDiv.innerHTML = convertJsonToJS(JSON.stringify(res));
    }
}

function card_renderValue(value: any, ele: string = "div"): HTMLElement {
    const element = document.createElement(ele);

    if (typeof value === "boolean") {
        element.innerHTML = `<strong>Boolean:</strong> <span>${value}</span>`;
        element.style.color = value ? "green" : "red";
    }
    else if (typeof value === "object" && value !== null) {
        if (Array.isArray(value)) {
            element.innerHTML = `<strong>Array (${value.length})</strong>`;
            value.forEach(item => element.appendChild(card_renderValue(item)));
        } else {
            element.innerHTML = `<strong>Object</strong>`;
            Object.entries(value).forEach(([key, val]) => {
                const div = document.createElement("div");
                div.className = "nested";
                div.innerHTML = `<strong>${key}: </strong>`;
                div.appendChild(card_renderValue(val, "span"));
                element.appendChild(div);
            });
        }
    }
    else if (value === null) {
        element.innerHTML = `<strong>null</strong>`;
        element.style.color = "orange";
    }
    else {
        element.textContent = `${value}`;
    }

    return element;
}

function table_render(data: any[], container: HTMLElement): void {
    const headers = table_getAllHeaders(data);
    const table = document.createElement("table");
    
    table.style.borderCollapse = "collapse";
    table.style.width = "100%";
    table.style.margin = "10px 0";
    
    // Generowanie nagłówków
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    headers.forEach(header => {
        const th = document.createElement("th");
        th.textContent = header;
        th.style.border = "1px solid #ddd";
        th.style.padding = "8px";
        th.style.textAlign = "left";
        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    data.forEach(item => {
        const row = tbody.insertRow();
        headers.forEach(header => {
            const cell = row.insertCell();
            cell.style.border = "1px solid #ddd";
            cell.style.padding = "5px";
            const value = table_resolveValue(item, header);
            cell.textContent = table_formatValue(value);
        });
    });

    container.appendChild(table);
}

function table_getAllHeaders(data: any[]): string[] {
    const headers = new Set<string>();
    
    const collectPaths = (obj: any, currentPath: string = ""): void => {
        if (obj === null || obj === undefined) return;
        
        if (obj instanceof Date || obj instanceof RegExp) {
            if (currentPath) headers.add(currentPath);
            return;
        }
        
        if (typeof obj !== "object") {
            if (currentPath) headers.add(currentPath);
            return;
        }
        
        if (Array.isArray(obj)) {
            obj.forEach((value, index) => {
                const newPath = currentPath ? `${currentPath}.${index}` : `${index}`;
                collectPaths(value, newPath);
            });
        } 
        else {
            for (const key of Object.keys(obj)) {
                const newPath = currentPath ? `${currentPath}.${key}` : key;
                collectPaths(obj[key], newPath);
            }
        }
    };

    data.forEach(item => collectPaths(item));
    return Array.from(headers).sort();
}

function table_resolveValue(obj: any, path: string): any {
    return path.split(".").reduce((acc, part) => {
        if (acc === null || acc === undefined) return undefined;
        return acc[part];
    }, obj);
}

function table_formatValue(value: any): string {
    if (value === null) return "null";
    if (value === undefined) return "";
    
    if (typeof value === "object") {
        if (value instanceof Date) return value.toISOString();
        if (Array.isArray(value)) return `[Array (${value.length})]`;
        return "[Object]";
    }
    
    return String(value);
}

displayType.addEventListener("change", renderData);