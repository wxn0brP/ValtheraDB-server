
const form = document.getElementById('login-form');
const customUrlCheckbox = document.getElementById('custom-url-checkbox');
const customUrlBox = document.querySelector('.url-box');
const loader = document.querySelector('.loader');
const messageDiv = document.querySelector('.message');
const responseDetails = document.querySelector('.response-details');
const tokenContainer = document.querySelector('.token-container');
const tokenValue = document.querySelector('.token-value');
const copyBtn = document.querySelector('.copy-btn');
const copiedMessage = document.querySelector('.copied-message');

// Toggle custom URL input field
customUrlCheckbox.addEventListener('change', function () {
    customUrlBox.style.display = this.checked ? 'block' : 'none';
});

// Copy to clipboard functionality
copyBtn.addEventListener('click', function () {
    const tokenText = tokenValue.textContent;
    navigator.clipboard.writeText(tokenText).then(() => {
        copiedMessage.classList.add('show');
        setTimeout(() => {
            copiedMessage.classList.remove('show');
        }, 2000);
    });
});

// Form submission
form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Hide any previous messages
    messageDiv.style.display = 'none';
    messageDiv.classList.remove('success', 'error');
    responseDetails.style.display = 'none';
    tokenContainer.style.display = 'none';

    // Show loader
    loader.style.display = 'block';

    // Get form data
    const loginValue = document.getElementById('login').value;
    const passwordValue = document.getElementById('password').value;

    // Get endpoint URL (default or custom)
    let endpointUrl = '/login';
    if (customUrlCheckbox.checked) {
        const customUrl = document.getElementById('custom-url').value;
        if (customUrl.trim() !== '') {
            // Append "/login" to the custom URL if not already ending with it
            endpointUrl = customUrl;
            if (!endpointUrl.endsWith('/login')) {
                endpointUrl += '/login';
            }
        }
    }

    // Prepare data for submission
    const data = {
        login: loginValue,
        password: passwordValue
    };

    // Send POST request
    fetch(endpointUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(response => {
        // First get the response data regardless of status
        return response.json().then(data => {
            return { ok: response.ok, data };
        });
    }).then(result => {
        // Hide loader
        loader.style.display = 'none';

        // Process response based on format { err: boolean, msg?: string, token?: string }
        if (!result.data.err) {
            // Success case
            messageDiv.textContent = 'Login successful!';
            messageDiv.classList.add('success');
            messageDiv.style.display = 'block';

            // Display token in the pretty container
            if (result.data.token) {
                tokenValue.textContent = result.data.token;
                tokenContainer.style.display = 'block';
            }

            console.log('Login successful:', result.data);
        } else {
            // Error case
            messageDiv.textContent = 'Login failed.';
            messageDiv.classList.add('error');
            messageDiv.style.display = 'block';

            // Display error message
            if (result.data.msg) {
                messageDiv.textContent += ' ' + result.data.msg;
                console.error('Login failed:', result.data);
            }
        }
    }).catch(error => {
        // Hide loader
        loader.style.display = 'none';

        // Show error message
        messageDiv.textContent = 'Error connecting to server. Please try again later.';
        messageDiv.classList.add('error');
        messageDiv.style.display = 'block';

        console.error('Error:', error);
    });
});