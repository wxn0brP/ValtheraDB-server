# Querying API (`/q`)

The `/q/:parserType` endpoint executes queries using a string-based query language.

- `:parserType`: The parser to use (e.g., `sql`, `json`).

**Body:**

- `db` (string, required): The database name.
- `q` (string, required): The query string.

**Example: Using the `sql` parser**

```javascript
fetch('http://localhost:14785/q/sql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    db: 'mainDB',
    q: 'SELECT * FROM users WHERE age > 30'
  })
});
```