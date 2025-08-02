export const cliMeta = {
    user: {
        createUser: {
            description: "Don't use this command. Use `mgmt` instead. Creates a new user",
            args: [
                {
                    name: "userData",
                    type: "object",
                    required: true,
                    fields: {
                        _id: { type: "Id", description: "The unique ID of the user" },
                        roles: { type: "array<Id>", description: "Optional list of role IDs", optional: true },
                        attrib: { type: "object", description: "Optional custom attributes", optional: true }
                    }
                }
            ],
            returns: "Promise<User>"
        },
        getUser: {
            description: "Retrieves a user by ID",
            args: [
                {
                    name: "user_id",
                    type: "Id",
                    required: true
                }
            ],
            returns: "Promise<User | null>"
        },
        updateUser: {
            description: "Updates a user's data",
            args: [
                {
                    name: "user_id",
                    type: "Id",
                    required: true
                },
                {
                    name: "updates",
                    type: "Partial<User>",
                    required: true
                }
            ],
            returns: "Promise<void>"
        },
        deleteUser: {
            description: "Don't use this command. Use `mgmt` instead. Deletes a user",
            args: [
                {
                    name: "user_id",
                    type: "Id",
                    required: true
                }
            ],
            returns: "Promise<void>"
        },
        addRoleToUser: {
            description: "Adds a role to a user",
            args: [
                {
                    name: "user_id",
                    type: "Id",
                    required: true
                },
                {
                    name: "role_id",
                    type: "Id",
                    required: true
                }
            ],
            returns: "Promise<void>"
        },
        removeRoleFromUser: {
            description: "Removes a role from a user",
            args: [
                {
                    name: "user_id",
                    type: "Id",
                    required: true
                },
                {
                    name: "role_id",
                    type: "Id",
                    required: true
                }
            ],
            returns: "Promise<void>"
        },
        updateAttributes: {
            description: "Updates a user's attributes",
            args: [
                {
                    name: "user_id",
                    type: "Id",
                    required: true
                },
                {
                    name: "attributes",
                    type: "Partial<A>",
                    required: true
                }
            ],
            returns: "Promise<void>"
        }
    },
    mgr: {
        changeRoleNameToId: {
            description: "Converts a role name to its corresponding ID",
            args: [
                {
                    name: "name",
                    type: "string",
                    required: true
                }
            ],
            returns: "Promise<Id>"
        },
        addRole: {
            description: "Adds a new role",
            args: [
                {
                    name: "role",
                    type: "Role",
                    required: true
                }
            ],
            returns: "Promise<Role>"
        },
        addACLRule: {
            description: "Adds an ACL rule for an entity and user",
            args: [
                {
                    name: "entityId",
                    type: "string",
                    required: true
                },
                {
                    name: "p",
                    type: "number",
                    required: true
                },
                {
                    name: "uid",
                    type: "Id",
                    required: false
                }
            ],
            returns: "Promise<void>"
        },
        addRBACRule: {
            description: "Adds an RBAC rule for a role and entity",
            args: [
                {
                    name: "role_id",
                    type: "string",
                    required: true
                },
                {
                    name: "entity_id",
                    type: "string",
                    required: true
                },
                {
                    name: "p",
                    type: "number",
                    required: true
                }
            ],
            returns: "Promise<void>"
        },
        addABACRule: {
            description: "Adds an ABAC rule for an entity",
            args: [
                {
                    name: "entity_id",
                    type: "string",
                    required: true
                },
                {
                    name: "flag",
                    type: "number",
                    required: true
                },
                {
                    name: "condition",
                    type: "ABACRule.condition",
                    required: true
                }
            ],
            returns: "Promise<void>"
        },
        removeRole: {
            description: "Removes a role by ID",
            args: [
                {
                    name: "roleId",
                    type: "string",
                    required: true
                }
            ],
            returns: "Promise<boolean>"
        },
        removeACLRule: {
            description: "Removes an ACL rule for an entity and optionally a user",
            args: [
                {
                    name: "entityId",
                    type: "string",
                    required: true
                },
                {
                    name: "uid",
                    type: "string",
                    required: false
                }
            ],
            returns: "Promise<boolean>"
        },
        removeRBACRule: {
            description: "Removes an RBAC rule for a role and entity",
            args: [
                {
                    name: "roleId",
                    type: "string",
                    required: true
                },
                {
                    name: "entityId",
                    type: "string",
                    required: true
                }
            ],
            returns: "Promise<boolean>"
        },
        removeABACRule: {
            description: "Removes an ABAC rule for an entity and flag",
            args: [
                {
                    name: "entityId",
                    type: "string",
                    required: true
                },
                {
                    name: "flag",
                    type: "number",
                    required: true
                }
            ],
            returns: "Promise<boolean>"
        }
    }
};