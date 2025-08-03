/** @type {(selector: string) => HTMLElement} */
const $ = (selector) => document.querySelector(selector);
const appRoot = $("#app-root");
const configBtn = $("#config-btn");
const configModal = $("#config-modal");
const saveConfigBtn = $("#save-config-btn");
const urlInput = $("#url-input");
const authInput = $("#auth-input");
const dbNameInput = $("#db-name-input");
const closeBtn = $(".close-btn");

let config = null;

function showConfigModal() {
    urlInput.value = config?.url || "";
    authInput.value = config?.auth || "";
    dbNameInput.value = config?.dbName || "";
    configModal.style.display = "block";
}

function hideConfigModal() {
    configModal.style.display = "none";
}

function saveConfig() {
    const url = urlInput.value.trim();
    const auth = authInput.value.trim();
    const dbName = dbNameInput.value.trim() || "local";

    config = {
        url: url || "/",
        auth: auth,
        dbName: dbName
    };

    hideConfigModal();
    router();
}

configBtn.addEventListener("click", showConfigModal);
closeBtn.addEventListener("click", hideConfigModal);
saveConfigBtn.addEventListener("click", saveConfig);
window.addEventListener("click", (event) => {
    if (event.target === configModal) {
        hideConfigModal();
    }
});

async function apiRequest(endpoint, data) {
    if (!config) {
        alert("Configuration is not set. Please configure the application first.");
        showConfigModal();
        return;
    }

    const headers = {
        "Content-Type": "application/json",
    };

    if (config.auth) {
        headers["Authorization"] = config.auth;
    }

    const url = (config.url + endpoint).replace("//", "/");
    const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ ...data, db: config.dbName }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ msg: "Request failed with no error message." }));
        throw new Error(errorData.msg);
    }

    return response.json();
}

function renderExportView() {
    appRoot.innerHTML = `
        <h1>Export SQL File</h1>
        <p>Database: <strong>${config?.dbName || "Not Set"}</strong></p>
        <label>Collections to export (optional, defaults to all):</label>
        <br><br>
        <div id="collections-list">Loading...</div>
        <label for="opts-select">Options (JSON, optional):</label>
        <input id="opts-select" style="margin-bottom: 10px;" />
        <br>
        <button id="submit-btn">Export SQL</button>
        <br><br>
        <a id="download-link" style="display:none;">Download SQL File</a>
        <button id="copy-btn" style="display:none;">Copy to Clipboard</button>
        <br><br>
        <pre id="result"></pre>
    `;

    if (!config) return;

    const loadCollections = async () => {
        const listElement = $("#collections-list");
        try {
            const res = await apiRequest("/db/getCollections", {});
            if (res.err) throw new Error(res.msg);

            listElement.innerHTML = "";
            if (Array.isArray(res.result) && res.result.length > 0) {
                res.result.forEach(collectionName => {
                    const item = document.createElement("div");
                    item.innerHTML = `
                        <input type="checkbox" id="${collectionName}" value="${collectionName}" checked>
                        <label for="${collectionName}">${collectionName}</label>
                    `;
                    listElement.appendChild(item);
                });
            } else {
                listElement.textContent = "No collections found or empty result.";
            }
        } catch (error) {
            listElement.textContent = `Error loading collections: ${error.message}`;
        }
    };

    loadCollections();

    $("#submit-btn").addEventListener("click", async () => {
        const resultDisplay = $("#result");
        try {
            const selectedCollections = [];
            document.querySelectorAll(`#collections-list input[type="checkbox"]:checked`).forEach(checkbox => {
                selectedCollections.push(checkbox.value);
            });

            const opts = $("#opts-select").value.trim();

            const requestData = {};
            if (selectedCollections.length > 0) requestData.collections = selectedCollections;
            if (opts) requestData.opts = JSON.parse(opts);

            const res = await apiRequest("/sql/export", requestData);
            if (res.err) throw new Error(res.msg);

            resultDisplay.textContent = res.result;

            const blob = new Blob([res.result], { type: "text/plain;charset=utf-8" });
            const urlData = URL.createObjectURL(blob);
            const downloadLink = $("#download-link");
            downloadLink.href = urlData;
            downloadLink.download = "export.sql";
            downloadLink.style.display = "inline-block";

            const copyBtn = $("#copy-btn");
            copyBtn.style.display = "inline-block";
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(res.result);
                alert("Copied to clipboard!");
            };

        } catch (error) {
            resultDisplay.textContent = `Error: ${error.message}`;
        }
    });
}

function renderImportView() {
    appRoot.innerHTML = `
        <h1>Import SQL File</h1>
        <p>Database: <strong>${config?.dbName || "Not Set"}</strong></p>
        <label for="sql-file">SQL File:</label>
        <input type="file" id="sql-file" accept=".sql" style="margin-bottom: 10px;" />
        <br>
        <button id="submit-btn">Import SQL</button>
        <br><br>
        <pre id="result"></pre>
    `;

    if (!config) return;

    $("#submit-btn").addEventListener("click", async () => {
        const resultDisplay = $("#result");
        try {
            const sqlFile = $("#sql-file").files[0];

            if (!sqlFile) {
                throw new Error("SQL file is required.");
            }

            const sqlContent = await sqlFile.text();
            const requestData = { content: sqlContent };

            const res = await apiRequest("/sql/import", requestData);
            if (res.err) throw new Error(res.msg);

            resultDisplay.textContent = JSON.stringify(res.result, null, 2);

        } catch (error) {
            resultDisplay.textContent = `Error: ${error.message}`;
        }
    });
}

function router() {
    const path = window.location.hash.slice(1) || "/export";
    if (path === "/export") {
        renderExportView();
    } else if (path === "/import") {
        renderImportView();
    }
}

window.addEventListener("hashchange", router);

showConfigModal();
router();
