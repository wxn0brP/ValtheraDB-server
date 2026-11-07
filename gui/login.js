const form = document.querySelector("#login-form");
const customUrlCheckbox = document.querySelector("#custom-url-checkbox");
const customUrlBox = document.querySelector(".url-box");
const loader = document.querySelector(".loader");
const messageDiv = document.querySelector(".message");
const responseDetails = document.querySelector(".response-details");
const tokenContainer = document.querySelector(".token-container");
const tokenValue = document.querySelector(".token-value");
const copyBtn = document.querySelector(".copy-btn");
const copiedMessage = document.querySelector(".copied-message");
const timeSelect = document.querySelector("#time");
const customTimeInput = document.querySelector("#custom-time");

document.querySelector(".custom-url-toggle").addEventListener("change", () => {
    customUrlBox.style.display = customUrlCheckbox.checked ? "block" : "none";
});

customUrlCheckbox.checked = false;

timeSelect.addEventListener("change", () => {
    customTimeInput.style.display = timeSelect.value === "custom" ? "block" : "none";
});

copyBtn.addEventListener("click", function () {
    const tokenText = tokenValue.textContent;
    navigator.clipboard.writeText(tokenText).then(() => {
        copiedMessage.classList.add("show");
        setTimeout(() => {
            copiedMessage.classList.remove("show");
        }, 2000);
    });
});

form.addEventListener("submit", async function (e) {
    e.preventDefault();

    messageDiv.style.display = "none";
    messageDiv.classList.remove("success", "error");
    responseDetails.style.display = "none";
    tokenContainer.style.display = "none";

    loader.style.display = "block";

    const loginValue = document.getElementById("login").value;
    const passwordValue = document.getElementById("password").value;

    let endpointUrl = "/login";
    if (customUrlCheckbox.checked) {
        const customUrl = document.getElementById("custom-url").value;
        if (customUrl.trim() !== "") {
            endpointUrl = customUrl;
            if (!endpointUrl.endsWith("/login")) {
                endpointUrl += "/login";
            }
        }
    }

    let timeValue = "true";
    if (timeSelect.value === "custom") {
        const customTime = customTimeInput.value.trim();
        if (customTime !== "") {
            timeValue = customTime; // Use custom time if provided
        }
    } else if (timeSelect.value === "") {
        timeValue = "false"; // Permanent
    } else {
        timeValue = timeSelect.value; // Use selected predefined time
    }

    const data = {
        login: loginValue,
        password: passwordValue,
        time: timeValue
    };

    fetch(endpointUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(
        /** @param {{ err: boolean, token?: string, msg?: string }} res */
        res => {
        loader.style.display = "none";

        if (!res.err) {
            messageDiv.textContent = "Login successful!";
            messageDiv.classList.add("success");
            messageDiv.style.display = "block";

            if (res.token) {
                tokenValue.textContent = res.token;
                tokenContainer.style.display = "block";
            }

            console.log("Login successful:", res);
        } else {
            messageDiv.textContent = "Login failed.";
            messageDiv.classList.add("error");
            messageDiv.style.display = "block";

            if (res.msg) {
                messageDiv.textContent += " " + res.msg;
                console.error("Login failed:", res);
            }
        }
    }).catch(error => {
        loader.style.display = "none";

        messageDiv.textContent = "Error connecting to server. Please try again later.";
        messageDiv.classList.add("error");
        messageDiv.style.display = "block";

        console.error("Error:", error);
    });
});
