# API Documentation

This documentation provides instructions on how to use the server API.

## General Information

- **Server Address:** `http://localhost:14785` by default.
- **Data Format:** All requests and responses are in `JSON` format.
- **Authentication:** Most endpoints require an authentication token. The token should be sent in the `Authorization` header as `Bearer <token>`.

## API Sections

- [Authentication](./auth.md)
- [Database Operations](./db.md)
- [Querying](./query.md)
- [Relations](./relations.md)
- [SQL Import/Export](./sql.md)
