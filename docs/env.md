# Environment Variables

| Name | default | Description |
| ---- | ------- | ----------- |
| `PORT` | `14785` | Server port |
| `JWT` | `*generated` | JWT secret |
| `TOKEN_CACHE_TTL` | `900` (15 minutes) | Token cache TTL in seconds |
| `PERM_CACHE_TTL` | `900` (15 minutes) | Permission cache TTL in seconds |
| `VALTHERA_DB_DATA_DIR` | `./volumes` | ValtheraDB data directory |
| `VALTHERA_DB_SERVER_DB` | `./volumes/serverDB` | ValtheraDB server database directory |
| `VALTHERA_RUNTIME_DIR` | `./` | ValtheraDB runtime directory |
| `RATE_LIMIT_ONCE_MAX` | `5` | Max requests per window for once routes |
| `RATE_LIMIT_ONCE_WINDOW` | `60000` | Once routes rate limit window (ms) |
| `RATE_LIMIT_API_MAX` | `100` | Max API requests per window |
| `RATE_LIMIT_API_WINDOW` | `60000` | API rate limit window (ms) |

**Note:** The `JWT` environment variable is automatically generated when the server starts. It's recommended to use the your own secret.