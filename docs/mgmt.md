# Getting Started Guide

A practical walkthrough for setting up ValtheraDB.

> **Tip:** For a full list of commands, run `npm run mgmt` or `npm run right`.

## Prerequisites

### Running in Docker

```bash
docker-compose up -d
```

All commands below run via `docker exec`:

```bash
docker exec -it valtheradb npm run mgmt ...
docker exec -it valtheradb npm run right ...
```

### Running Locally

```bash
npm run mgmt ...
npm run right ...
```

## 1. First Steps - Database & User

### Create a database

```bash
npm run mgmt add-db myproject
```

### Create an admin user

```bash
npm run mgmt add-user admin MySecurePass123
```

### Get an authentication token

```bash
npm run mgmt get-token admin
```

Save this token. You'll need it for API calls (`Authorization: Bearer <token>`).

### Verify everything works

```bash
# List databases
npm run mgmt list-dbs

# List users
npm run mgmt list-users

# Check token via API
curl -X POST http://localhost:14785/auth-check \
  -H "Authorization: Bearer <your_token>"
```

## 2. Direct Permissions - ACL

ACL (Access Control List) grants permissions **directly** to a user on a specific entity. This is the simplest way to control access.

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

### Give a user access to an entity

```bash
# Syntax: npm run right user addACLRule <entity_id (collection)> <permission_level> <user_id>

npm run right user addACLRule doc-report-2024 63 admin-user-id
```

This gives the user full access to the `doc-report-2024` entity.

### Revoke access

```bash
npm run right user removeACLRule doc-report-2024 admin-user-id
```

### When to use ACL

Use ACL for quick, one-off permissions - e.g., granting temporary access or managing a small number of users. For larger setups, use roles instead.

## 3. Roles - RBAC

RBAC (Role-Based Access Control) assigns permissions to **roles**, then assigns users to those roles. This scales much better than ACL.

### Step 1: Create a role

```bash
npm run right user addRole '{"_id": "role-editor", "name": "Editor"}'
```

### Step 2: Grant the role access to an entity

```bash
# Syntax: npm run right user addRBACRule <role_id> <entity_id> <permission_level>

npm run right user addRBACRule role-editor doc-report-2024 16
```

Now any user with the `role-editor` role gets collection management access to `doc-report-2024` collection.

### Step 3: Assign the role to a user

```bash
npm run right user addRoleToUser admin-user-id role-editor
```

### Remove a role from a user

```bash
npm run right user removeRoleFromUser admin-user-id role-editor
```

## Quick Reference

| Task | Command |
|------|---------|
| Create database | `npm run mgmt add-db <name>` |
| Create user | `npm run mgmt add-user <login> <password>` |
| Get token | `npm run mgmt get-token <login>` |
| Give direct access (ACL) | `npm run right user addACLRule <entity> 7 <user_id>` |
| Create role | `npm run right user addRole '{"_id": "role-x", "name": "X"}'` |
| Grant role access (RBAC) | `npm run right user addRBACRule <role> <entity> 3` |
| Assign role to user | `npm run right user addRoleToUser <user_id> <role_id>` |
