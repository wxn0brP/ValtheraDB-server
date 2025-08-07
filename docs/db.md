# Database Operations API (`/db`)

The `/db/:type` endpoint allows direct method calls on a database instance.

- `:type`: The method to execute (e.g., `find`, `add`, `update`, `remove`).

**Body:**

- `db` (string, required): The database name.
- `params` (array, required): Parameters for the method. The first parameter is always the collection name.
- `keys` (array, optional): Paths to keys in `params` that contain stringified functions to be deserialized on the server.

**Example: Insert a document**

```javascript
fetch('http://localhost:14785/db/add', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    db: 'mainDB',
    params: ['users', { name: 'John Doe', age: 30 }]
  })
});
```