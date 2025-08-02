# Relations API (`/r`)

The `/r/:type` endpoint performs operations on relations between data sources.

- `:type`: The relation operation type (e.g., `find`).

**Body:**

- `accessCfg` (object, required): Configuration for accessing databases (local and remote).
- `params` (array, required): Parameters for the relation operation.

**Example:**

```javascript
fetch('http://localhost:14785/r/find', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    accessCfg: {
      db1: 'mainDB',
      db2: { url: 'http://remote-db-url.com', token: 'remote-token' }
    },
    params: [
      ['db1', 'users'],
      {
        posts: {
          path: ['db2', 'posts'],
          on: { userId: '_id' }
        }
      },
      { name: 'John Doe' }
    ]
  })
});
```