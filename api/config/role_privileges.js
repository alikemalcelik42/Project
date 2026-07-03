module.exports = {
    privGroups: [
        {
            id: "USERS",
            name: "User Permissions",
        },
        {
            id: "ROLES",
            name: "Role Permissions",
        },
        {
            id: "CATEGORIES",
            name: "Category Permissions",
        },
        {
            id: "AUDITLOGS",
            name: "Audit Log Permissions",
        }

    ],

    privileges: [
        {
            key: "user_view",
            name: "User View",
            group: "USERS",
            description: "Allows viewing of user information.",
        },
        {
            key: "user_add",
            name: "Add Users",
            group: "USERS",
            description: "Allows adding new users."
        },
        {
            key: "user_update",
            name: "Update Users",
            group: "USERS",
            description: "Allows updating existing users."
        },
        {
            key: "user_delete",
            name: "Delete Users",
            group: "USERS",
            description: "Allows deleting users."
        },
        {
            key: "role_view",
            name: "Role View",
            group: "ROLES",
            description: "Allows viewing of role information.",
        },
        {
            key: "role_add",
            name: "Add Roles",
            group: "ROLES",
            description: "Allows adding new roles."
        },
        {
            key: "role_update",
            name: "Update Roles",
            group: "ROLES",
            description: "Allows updating existing roles."
        },
        {
            key: "role_delete",
            name: "Delete Roles",
            group: "ROLES",
            description: "Allows deleting roles."
        },
        {
            key: "category_view",
            name: "Category View",
            group: "CATEGORIES",
            description: "Allows viewing of category information.",
        },
        {
            key: "category_add",
            name: "Add Categories",
            group: "CATEGORIES",
            description: "Allows adding new categories."
        },
        {
            key: "category_update",
            name: "Update Categories",
            group: "CATEGORIES",
            description: "Allows updating existing categories."
        },
        {
            key: "category_delete",
            name: "Delete Categories",
            group: "CATEGORIES",
            description: "Allows deleting categories."
        },
        {
            key: "category_export",
            name: "Export Categories",
            group: "CATEGORIES",
            description: "Allows exports categories."
        },
        {
            key: "auditlog_view",
            name: "Audit Log View",
            group: "AUDITLOGS",
            description: "Allows viewing of audit log information.",
        },
        {
            key: "auditlog_add",
            name: "Add Audit Logs",
            group: "AUDITLOGS",
            description: "Allows adding new audit logs."
        },
        {
            key: "auditlog_update",
            name: "Update Audit Logs",
            group: "AUDITLOGS",
            description: "Allows updating existing audit logs."
        },
        {
            key: "auditlog_delete",
            name: "Delete Audit Logs",
            group: "AUDITLOGS",
            description: "Allows deleting audit logs."
        }
    ]
}