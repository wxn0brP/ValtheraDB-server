# SQL Import/Export API (`/sql`)

### `POST /sql/import`

Imports data from SQL content.

**Body:**

- `db` (string, required): The target database name.
- `content` (string, required): The SQL content.

**Example:**

```javascript
fetch('http://localhost:14785/sql/import', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    db: 'mainDB',
    content: 'CREATE TABLE users (name TEXT, age INTEGER); INSERT INTO users (name, age) VALUES ("Jane Doe", 28);'
  })
});
```

### `POST /sql/export`

Exports data from a database to SQL format.

**Body:**

- `db` (string, required): The database name.
- `collections` (array, optional): A list of collections to export. Defaults to all.
- `opts` (object, optional): Export options.

**Example:**

```javascript
fetch('http://localhost:14785/sql/export', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    db: 'mainDB',
    collections: ['users', 'products']
  })
});
```