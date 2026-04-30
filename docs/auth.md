# Authentication API

All authenticated endpoints accept the token via:

- **Authorization header**: `Authorization: Bearer <token>`
- **Request body**: `auth` field in JSON body

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

**Example:**

```javascript
fetch('http://localhost:14785/auth-check', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer <token>' }
});

// Or with auth in body:
fetch('http://localhost:14785/auth-check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ auth: '<token>' })
});
```

### `POST /getDbList`

Retrieves a list of available databases.

**Example:**

```javascript
fetch('http://localhost:14785/getDbList', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer <token>' }
});

// Or with auth in body:
fetch('http://localhost:14785/getDbList', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ auth: '<token>' })
});
```
