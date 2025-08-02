# Authentication API

### `POST /login`

Authenticates a user and returns an access token.

**Body:**

- `login` (string, required): The username.
- `password` (string, required): The password.

**Example:**

```javascript
fetch('http://localhost:14785/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ login: 'admin', password: 'password123' })
});
```

### `POST /auth-check`

Checks if the provided token is valid.

**Headers:**

- `Authorization: Bearer <token>`

**Example:**

```javascript
fetch('http://localhost:14785/auth-check', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer <token>' }
});
```

### `POST /getDbList`

Retrieves a list of available databases.

**Headers:**

- `Authorization: Bearer <token>`

**Example:**

```javascript
fetch('http://localhost:14785/getDbList', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer <token>' }
});
```