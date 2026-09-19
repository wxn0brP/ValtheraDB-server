# Authentication API

All authenticated endpoints accept the token via:

- **Authorization header**: `Authorization: Bearer <token>`
- **Request body**: `auth` field in JSON body

## Token types

### JWT tokens

Standard tokens obtained via `/login` or `./mgr.sh user token`. These are server-specific and expire based on configuration.

### Wolf tokens

Wolf tokens allow multiple servers to share the same authentication token. Format: `_wolf_<token>`.

Create wolf tokens via CLI:

```bash
./mgr.sh user wolf add admin
./mgr.sh user wolf set admin my-shared-secret
```

Use them in API calls:

```javascript
fetch('http://localhost:14785/getDbList', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer _wolf_<token>' }
});
```

Passwordless users (created without a password) cannot use `/login` - obtain tokens via CLI instead:

```bash
./mgr.sh user token admin          # JWT token
./mgr.sh user wolf add admin       # wolf token
```

### `POST /login`

Authenticates a user and returns an access token. Users without a password cannot use this endpoint.

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
