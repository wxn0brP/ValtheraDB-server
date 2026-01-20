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

**Note:** The `JWT` environment variable is automatically generated when the server starts. It's recommended to use the your own secret.