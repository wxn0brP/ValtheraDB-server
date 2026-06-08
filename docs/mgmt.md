# Getting Started Guide

A practical walkthrough for setting up ValtheraDB.

> **Tip:** For a full list of common commands, run `./mgr.sh --help`. `npm run right` is a low-level Gate Warden wrapper for advanced/debug use.

## Prerequisites

### Running in Docker

```bash
docker-compose up -d
```

All common commands below run via `docker exec`:

```bash
docker exec -it valtheradb ./mgr.sh ...
```

### Running Locally

```bash
./mgr.sh ...
```

## 1. First Steps - Database & User

### Create a database

```bash
./mgr.sh db add myDB
```

### Create an admin user

```bash
./mgr.sh user add admin MySecurePass123
```

### Get an authentication token

```bash
./mgr.sh user token admin
```

Save this token. You'll need it for API calls (`Authorization: Bearer <token>`).

### Verify everything works

```bash
# List databases
./mgr.sh db list

# List users
./mgr.sh user list

# Check token via API
curl -X POST http://localhost:14785/auth-check \
  -H "Authorization: Bearer <your_token>"
```

## 2. Permission Entity Schema

### Permission levels

| Level | Meaning |
|-------|---------|
| 1 | Find |
| 2 | Add |
| 4 | Remove |
| 8 | Update |
| 16 | Collection |
| 32 | Unknown |
|-|-|
| 31 | Full access without Unknown |
| 63 | Full access |

> **Note:** `Unknown` is a fallback permission used for operations not recognized by the server (e.g. newly introduced DB operations not covered by existing rights).

You can pass permissions as a number or as readable flags. This helps avoid mistakes when adding bit values manually.

| Input | Result |
|-------|--------|
| `update remove` | `12` |
| `ur` | `12` |
| `find add update` | `11` |
| `fau` | `11` |
| `collection` | `16` |
| `c` | `16` |
| `full` | `63` |

Supported flag names are `find`, `add`, `remove`, `update`, `collection`, and `unknown`. Supported one-letter aliases are `f`, `a`, `r`, `u`, `c`, plus `n`, `x`, or `?` for unknown.

Permissions are the last arguments in `grant` commands, so you can pass them as separate words or as compact aliases:

```bash
./mgr.sh acl grant myDB admin update remove c
./mgr.sh role grant role-editor myDB/users update remove c
```

Permissions are checked against an `entity_id`. It is a logical resource name, so the same permission system can protect a database, a collection, or another named resource.

Common entity shapes:

```text
Database:   myDB
Collection: myDB/users
```

Use one stable naming convention and pass the same exact entity string to ACL and RBAC commands. For normal database operations this is usually the database name. For collection-level management, use the collection entity you want to protect.

Example database-level request:

```text
User request
  user: admin
  operation: find
  entity_id: myDB
```

Example collection-level request:

```text
User request
  user: admin
  operation: collection
  entity_id: myDB/users
```

Access is resolved from rules attached to that same entity:

```text
Access check
  1. Direct ACL: does admin have the required flag on entity_id?
  2. Role RBAC: does any admin role have the required flag on entity_id?
  3. ABAC, when configured
```

So this grants direct full access to the `myDB` database:

```bash
./mgr.sh acl grant myDB admin full
```

This grants role-based collection management access to the `myDB/users` collection entity:

```bash
./mgr.sh role grant role-editor myDB/users c
```

Permission flags are listed below. Combine flags by adding their values, for example `1 + 2 + 8 = 11` for find/add/update.

## 3. Direct Permissions - ACL

ACL (Access Control List) grants permissions **directly** to a user on a specific entity. This is the simplest way to control access.

### Give a user access to an entity

```bash
# Syntax: ./mgr.sh acl grant <entity_id> <user_id_or_login> <permissions...>

./mgr.sh acl grant doc-report-2024 admin full
```

This gives the user full access to the `doc-report-2024` entity.

### Revoke access

```bash
./mgr.sh acl revoke doc-report-2024 admin
```

### When to use ACL

Use ACL for quick, one-off permissions - e.g., granting temporary access or managing a small number of users. For larger setups, use roles instead.

## 4. Roles - RBAC

RBAC (Role-Based Access Control) assigns permissions to **roles**, then assigns users to those roles. This scales much better than ACL.

### Step 1: Create a role

```bash
./mgr.sh role add role-editor Editor
```

### Step 2: Grant the role access to an entity

```bash
# Syntax: ./mgr.sh role grant <role_id_or_name> <entity_id> <permissions...>

./mgr.sh role grant role-editor doc-report-2024 c
```

Now any user with the `role-editor` role gets collection management access to `doc-report-2024` collection.

### Step 3: Assign the role to a user

```bash
./mgr.sh role assign admin role-editor
```

### Remove a role from a user

```bash
./mgr.sh role unassign admin role-editor
```

## Quick Reference

| Task | Command |
|------|---------|
| Create database | `./mgr.sh db add <name>` |
| Remove database | `./mgr.sh db rm <name>` |
| Create user | `./mgr.sh user add <login> <password>` |
| Get token | `./mgr.sh user token <login>` |
| Give direct access (ACL) | `./mgr.sh acl grant <entity> <user_id_or_login> find add remove` |
| Revoke direct access (ACL) | `./mgr.sh acl revoke <entity> <user_id_or_login>` |
| Create role | `./mgr.sh role add <role_id> [name]` |
| Grant role access (RBAC) | `./mgr.sh role grant <role_id_or_name> <entity> find add` |
| Revoke role access (RBAC) | `./mgr.sh role revoke <role_id_or_name> <entity>` |
| Assign role to user | `./mgr.sh role assign <user_id_or_login> <role_id_or_name>` |
| Remove role from user | `./mgr.sh role unassign <user_id_or_login> <role_id_or_name>` |
