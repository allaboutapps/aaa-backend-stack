import { IMigration, sql } from "@aaa-backend-stack/storage";

// tslint:disable-next-line:no-object-literal-type-assertion
module.exports = <IMigration>{
    up: async function (queryInterface, SEQUELIZE) {
        await queryInterface.sequelize.query(sql`
            CREATE INDEX idx_access_tokens_fk_user_uid ON "AccessTokens"("UserUid");
            CREATE INDEX idx_refresh_tokens_fk_user_uid ON "RefreshTokens"("UserUid");
            CREATE INDEX idx_user_permissions_fk_permission_uid ON "UserPermissions"("PermissionUid");
            CREATE INDEX idx_push_tokens_fk_user_uid ON "PushTokens"("UserUid");
            CREATE INDEX idx_password_reset_tokens_fk_user_uid ON "PasswordResetTokens"("UserUid");
        `);
    },

    down: async function (queryInterface, SEQUELIZE) {
        //
    }
};
