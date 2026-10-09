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
	sessionStorage.setItem("config", JSON.stringify(config));

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
		showNotification("Configuration is not set. Please configure the application first.", "error");
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

function showNotification(message, type = "info") {
	const notification = document.createElement("div");
	notification.className = `${type}-state`;
	notification.textContent = message;
	notification.style.position = "fixed";
	notification.style.top = "20px";
	notification.style.right = "20px";
	notification.style.zIndex = "1000";
	notification.style.maxWidth = "400px";
	notification.style.animation = "slideIn 0.3s ease";
	
	document.body.appendChild(notification);
	
	setTimeout(() => {
		notification.style.opacity = "0";
		notification.style.transition = "opacity 0.3s";
		setTimeout(() => notification.remove(), 300);
	}, 3000);
}

function renderExportView() {
	appRoot.innerHTML = `
		<h1>Export SQL File</h1>
		<p>Database: <strong>${config?.dbName || "Not Set"}</strong></p>
		<label>Collections to export (optional, defaults to all):</label>
		<div id="collections-list">
			<div class="loading">Loading collections...</div>
		</div>
		<label for="opts-select">Options (JSON, optional):</label>
		<input id="opts-select" placeholder='{"pretty": true}' />
		<div class="actions">
			<button id="submit-btn">Export SQL</button>
		</div>
		<div id="result-container" style="display: none;">
			<div class="actions">
				<a id="download-link" style="display:none;">Download SQL File</a>
				<button id="copy-btn" style="display:none;">Copy to Clipboard</button>
			</div>
			<pre id="result"></pre>
		</div>
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
				listElement.innerHTML = `<div class="empty-state">No collections found in this database.</div>`;
			}
		} catch (error) {
			listElement.innerHTML = `<div class="error-state">Error loading collections: ${error.message}</div>`;
		}
	};

	loadCollections();

	$("#submit-btn").addEventListener("click", async () => {
		const resultDisplay = $("#result");
		const resultContainer = $("#result-container");
		try {
			const selectedCollections = [];
			document.querySelectorAll(`#collections-list input[type="checkbox"]:checked`).forEach(checkbox => {
				selectedCollections.push(checkbox.value);
			});

			const opts = $("#opts-select").value.trim();

			const requestData = {};
			if (selectedCollections.length > 0) requestData.collections = selectedCollections;
			if (opts) requestData.opts = JSON.parse(opts);

			resultDisplay.textContent = "Generating export...";
			resultContainer.style.display = "block";

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
				showNotification("Copied to clipboard!", "success");
			};

		} catch (error) {
			resultDisplay.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
		}
	});
}

function renderImportView() {
	appRoot.innerHTML = `
		<h1>Import SQL File</h1>
		<p>Database: <strong>${config?.dbName || "Not Set"}</strong></p>
		<label for="sql-file">SQL File:</label>
		<input type="file" id="sql-file" accept=".sql" />
		<div class="actions">
			<button id="submit-btn">Import SQL</button>
		</div>
		<div id="result-container" style="display: none;">
			<pre id="result"></pre>
		</div>
	`;

	if (!config) return;

	$("#submit-btn").addEventListener("click", async () => {
		const resultDisplay = $("#result");
		const resultContainer = $("#result-container");
		try {
			const sqlFile = $("#sql-file").files[0];

			if (!sqlFile) {
				throw new Error("SQL file is required.");
			}

			const sqlContent = await sqlFile.text();
			const requestData = { content: sqlContent };

			resultDisplay.textContent = "Importing...";
			resultContainer.style.display = "block";

			const res = await apiRequest("/sql/import", requestData);
			if (res.err) throw new Error(res.msg);

			resultDisplay.textContent = JSON.stringify(res, null, 2);
			showNotification("Import completed successfully!", "success");

		} catch (error) {
			resultDisplay.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
			resultContainer.style.display = "block";
		}
	});
}

function renderCSVExportView() {
	appRoot.innerHTML = `
		<h1>Export CSV File</h1>
		<p>Database: <strong>${config?.dbName || "Not Set"}</strong></p>
		<label>Collection to export:</label>
		<div id="collections-list">
			<div class="loading">Loading collections...</div>
		</div>
		<div class="actions">
			<button id="submit-btn">Export CSV</button>
		</div>
		<div id="result-container" style="display: none;">
			<div class="actions">
				<a id="download-link" style="display:none;">Download CSV File</a>
				<button id="copy-btn" style="display:none;">Copy to Clipboard</button>
			</div>
			<pre id="result"></pre>
		</div>
	`;

	if (!config) return;

	const loadCollections = async () => {
		const listElement = $("#collections-list");
		try {
			const res = await apiRequest("/db/getCollections", {});
			if (res.err) throw new Error(res.msg);

			listElement.innerHTML = "";
			if (Array.isArray(res.result) && res.result.length > 0) {
				const select = document.createElement("select");
				select.id = "collection-select";
				res.result.forEach(collectionName => {
					const option = document.createElement("option");
					option.value = collectionName;
					option.textContent = collectionName;
					select.appendChild(option);
				});
				listElement.appendChild(select);
			} else {
				listElement.innerHTML = `<div class="empty-state">No collections found in this database.</div>`;
			}
		} catch (error) {
			listElement.innerHTML = `<div class="error-state">Error loading collections: ${error.message}</div>`;
		}
	};

	loadCollections();

	$("#submit-btn").addEventListener("click", async () => {
		const resultDisplay = $("#result");
		const resultContainer = $("#result-container");
		try {
			const selectedCollection = $("#collection-select").value;

			if (!selectedCollection) {
				throw new Error("Please select a collection to export.");
			}

			const requestData = { collection: selectedCollection };

			resultDisplay.textContent = "Generating export...";
			resultContainer.style.display = "block";

			const res = await apiRequest("/csv/export", requestData);
			if (res.err) throw new Error(res.msg);

			resultDisplay.textContent = res.result;

			const blob = new Blob([res.result], { type: "text/csv;charset=utf-8" });
			const urlData = URL.createObjectURL(blob);
			const downloadLink = $("#download-link");
			downloadLink.href = urlData;
			downloadLink.download = `${selectedCollection}.csv`;
			downloadLink.style.display = "inline-block";

			const copyBtn = $("#copy-btn");
			copyBtn.style.display = "inline-block";
			copyBtn.onclick = () => {
				navigator.clipboard.writeText(res.result);
				showNotification("Copied to clipboard!", "success");
			};

		} catch (error) {
			resultDisplay.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
		}
	});
}

function renderCSVImportView() {
	appRoot.innerHTML = `
		<h1>Import CSV File</h1>
		<p>Database: <strong>${config?.dbName || "Not Set"}</strong></p>
		<label for="csv-file">CSV File:</label>
		<input type="file" id="csv-file" accept=".csv" />
		<label for="collection-name">Collection Name:</label>
		<input type="text" id="collection-name" placeholder="Enter collection name" />
		<div class="actions">
			<button id="submit-btn">Import CSV</button>
		</div>
		<div id="result-container" style="display: none;">
			<pre id="result"></pre>
		</div>
	`;

	if (!config) return;

	$("#submit-btn").addEventListener("click", async () => {
		const resultDisplay = $("#result");
		const resultContainer = $("#result-container");
		try {
			const csvFile = $("#csv-file").files[0];
			const collectionName = $("#collection-name").value.trim();

			if (!csvFile) {
				throw new Error("CSV file is required.");
			}

			if (!collectionName) {
				throw new Error("Collection name is required.");
			}

			const csvContent = await csvFile.text();
			const requestData = {
				content: csvContent,
				collection: collectionName
			};

			resultDisplay.textContent = "Importing...";
			resultContainer.style.display = "block";

			const res = await apiRequest("/csv/import", requestData);
			if (res.err) throw new Error(res.msg);

			resultDisplay.textContent = JSON.stringify(res, null, 2);
			showNotification("Import completed successfully!", "success");

		} catch (error) {
			resultDisplay.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
			resultContainer.style.display = "block";
		}
	});
}

function router() {
	const path = window.location.hash.slice(1) || "/sql-export";
	if (path === "/sql-export") {
		renderExportView();
	} else if (path === "/sql-import") {
		renderImportView();
	} else if (path === "/csv-export") {
		renderCSVExportView();
	} else if (path === "/csv-import") {
		renderCSVImportView();
	}
}

function loadConfig() {
	const savedConfig = sessionStorage.getItem("config");
	if (savedConfig) {
		config = JSON.parse(savedConfig);
		router();
	} else {
		showConfigModal();
		router();
	}
}

$("#logout-btn").addEventListener("click", () => {
	sessionStorage.removeItem("config");
	location.reload();
});

window.addEventListener("hashchange", router);

loadConfig();
