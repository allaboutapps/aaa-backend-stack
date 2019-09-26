import * as serverdate from "@aaa-backend-stack/serverdate";
import { IMigration } from "@aaa-backend-stack/storage";

export const UIDS = {
    USER_ROOT: "e6b4e138-371b-48ca-ba85-991fbacf6d22", // CAB_USER_ROOT_UID
    PERMISSION_ROOT: "ef31ff90-9a94-11e6-a742-6b0596f047a1", // CAB_PERMISSION_ROOT_UID
    PERMISSION_CMS: "a44fdc18-9a94-11e6-b31e-0b591a0b0433" // CAB_PERMISSION_CMS_UID
};

// tslint:disable-next-line:no-object-literal-type-assertion
module.exports = <IMigration>{
    UIDS,
    up: async function (queryInterface, SEQUELIZE) {
        const now = serverdate.getMoment().toDate();

        await queryInterface.bulkInsert("Permissions", [{
            uid: UIDS.PERMISSION_CMS,
            scope: "cms", // this is the base required scope for being able to authenticate as administrator to the cms
            createdAt: now,
            updatedAt: now
        }, {
            uid: UIDS.PERMISSION_ROOT,
            scope: "root", // root = superuser scope (documentation / devtool, should be non removeable through devtools)
            createdAt: now,
            updatedAt: now
        }], {});

        await queryInterface.bulkInsert("Users", [{
            uid: UIDS.USER_ROOT,
            username: "admin",
            // CAB_ROOT_ADMIN_PASSWORD_PLAIN: d3m0
            // tslint:disable-next-line:max-line-length
            password: "f2b033680ee319908856982880ae9fb9e48aac129358aee5acac51bcfdcc022facfdf5710c350639a12315569bb78cc6747bccb4e31110ba49139e1d32a44d6b45f07c00c4dc7e3c7346cdf282a23815bcfc2521fb3c2032b3a499ec9b9549d6339d4988fab06e795cceba12da5e8749d944e74cea8ecd074b60b815a0cee3960f3426c4fa9bec2cf954a5dd16e72938200804a6245887c84b6e9442310b735b321c9e72dd4ef3588e77971ca29c98cf52511e8e80ba36fe09e3bf20b93300dafa13cec7c8a7a4f447de4802d3e92bf2029f6c9c8ab2c1e743a3b6c18832a00f19446435a2337c9fd1a3b0eee5124cbd0193698d0f02bd4605cf2303550c957942f59637c2aabdfd2df99aefd03429bf7c87a75e320d2e610d7f25223562773a30e634415633b22a97d1b82b3d788ce1fd0eb05336fe90a3ded217a8b8c164beca5a105855a5f832cbd27a861d7b8f5f29d2a739d8c993f671fec6b6f48da79ff3b491b04ef85a5df5b86388cef73e7c4f32ae53622c825bfae1ce8d269e890be7f304f8e597dce9b2ad9cef832a3bd781ae11a47838f17f571e3ff228066151a90a55bd1bae958dd569bf84a90a9bffe4b3790f7b7d3620dd1270c8dc8d135db854ba86d3c12cbee664022fc692ed23a3e7ee53d039447cc42e448199d331b7549809e43b537ef4209c6a577f9ca7df370d37a9dd5e6043298ac9885859dba0",
            salt: "11fc78a86bfc861437029284236ab6b42753508b9c98376b31fa3abd28848196cb518063a03aa28e30294c9bbae58ac85784b44b15b546b9a2edaae6201449e7",
            createdAt: now,
            updatedAt: now
        }], {});

        await queryInterface.bulkInsert("UserPermissions", [{
            UserUid: UIDS.USER_ROOT, // link cms permission scope
            PermissionUid: UIDS.PERMISSION_CMS,
            createdAt: now,
            updatedAt: now
        }, {
            UserUid: UIDS.USER_ROOT, // link root permission scope
            PermissionUid: UIDS.PERMISSION_ROOT,
            createdAt: now,
            updatedAt: now
        }], {});

    },

    down: async function (queryInterface, SEQUELIZE) {
        // attention, you need to use singular form of the model!!!
        await queryInterface.sequelize.model("UserPermission").destroy({ where: {} });
        await queryInterface.sequelize.model("Permission").destroy({ where: {} });
        await queryInterface.sequelize.model("User").destroy({ where: {} });
    }
};
