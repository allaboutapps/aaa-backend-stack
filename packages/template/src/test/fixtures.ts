import * as serverdate from "@aaa-backend-stack/serverdate";
import { IBulkData, IFixtureTrees } from "@aaa-backend-stack/storage";

// General used password: password and salt data...
// password: "password"
// tslint:disable-next-line:max-line-length
const PASSWORD_HASH = "d79f8266fc2942c27af782e2daab181fb6948835fbef33ec4d6c1f3886b3d901381c048a4539bf4ae2ae01d31016e1ca7432917dabd11db27dbc28579dfbfee007f685746788e2bea36ff07fdc45806ff48e9551634b2675534d1169114d5564443c350476df985d6be0cec0fea0d7e3b248c7022a0d9cecbd10d481aecf7b0c97c5756a4f640138fa459729e0921e05c77e77c0a7b025007f2c6d780a1824fe404030f3b9117130818deb370465a9f5f9e32d5508ab06cb8867283b524c6e3a02e7002c95a69fca95f789f82c53d8ab3b2e435983ab25a8544ee9db3cd896c1fc2e9ba24c528754665a0785fe4f25d9d72e47807804d09360e38dc11d02febad845dd233c5227f8cd8c970ab3b117ce9d000b6af0aaf01a6ee6d82627e022ece143642b157f5f883e5fd930deaf4a253e5c5566fbd9ccbd2e9d8a3605dfe979856ca3e743b8d3027448718bba21d73baeb2d459f909b66f257c01bd76e23bf09da8ae1bbab5a6c6cef8b23ec260f25db4d9191a14142db762f4043896c49f6aca4b317f00394715612107b4b360d7120fda3022a7d67aa11380acaa676e43195f527824cf12346898040ed77bb6eb760c3b5861777809b6cfd0e57257584803e18ef580c07eeb0102f04603676702cc83c26aa30bc2bdca2cea51fe5937ff3616467ab9f40a8f1192669f06a387d2d9ed6831fd6371f4c6ad309e9730482a07";
const SALT = "3f9dd9e6d89c7b545ad2f22cf4f68f25188fbf1b2c2fec30c2884c939eead8b5";

import { UIDS as MIGRATION_010_UIDS } from "../migrations/010-insert-administration-user";

// Old fixtures (IBulkData) handling is still supported, and will take precedence (will be run first)
// however try to limit you usage of this, as it's not as convenient as fixture trees
const fixtures: IBulkData = null;
export default fixtures;

export const user1 = {
    uid: "12ab55e3-1418-418b-abbf-35d8cc68d477",
    username: "user1@test.com",
    password: PASSWORD_HASH,
    salt: SALT,
    AppUserProfile: {},
    AccessToken: {
        token: "57e97a9a-0928-11e5-9ca6-6c4008ac6d80",
        validUntil: serverdate.getMoment().add(1000, "years").toDate()
    },
    RefreshToken: {
        token: "06beb1e0-0927-11e5-9520-6c4008ac6d80"
    },
    PasswordResetToken: [{
            // valid
            token: "867a6d89-82fc-471d-bc54-8bff89a4fdfa",
            validUntil: serverdate.getMoment().add(15, "minutes").toDate()
    }, {
            // expired
            token: "14268983-7381-462d-9a58-215b1171b922",
            validUntil: serverdate.getMoment().subtract(15, "minutes").toDate() // make an invalid token
    }],
    PushToken: {
        deviceType: "android",
        deviceToken: "token1001"
    }
};

export const user2 = {
    uid: "368d83d6-d367-4dc4-a6a2-a6cc167604f4",
    username: "user2@test.com",
    password: PASSWORD_HASH,
    salt: SALT,
    AppUserProfile: {},
    AccessToken: {
        token: "de2393f0-0e8e-11e5-8a53-6c4008ac6d80",
        validUntil: serverdate.getMoment().add(1000, "years").toDate()
    },
    RefreshToken: {
        token: "d3d3d1e4-0e8e-11e5-a93c-6c4008ac6d80"
    },
    PushToken: {
        deviceType: "android",
        deviceToken: "token1002"
    }
};

export const nopasswordUser = {
    uid: "bc317a85-fe14-471a-ad2c-0a95e09b5629",
    username: "nopassword.user@test.com",
    password: null as string, // no password set!
    salt: null as string, // no password set!
    AppUserProfile: {}
};

export const admin1 = {
    uid: "5ddf8a1e-ab4d-404b-9490-80f12c7151ab",
    username: "admin1@test.com",
    password: PASSWORD_HASH,
    salt: SALT,
    AccessToken: {
        token: "c53eda22-ba3c-4790-856c-e41a9fdfab6f",
        validUntil: serverdate.getMoment().add(1000, "years").toDate()
    },
    RefreshToken: {
        token: "006a1431-8691-4c59-b584-03ee446c3e4c"
    },
    Permission: {
        // don't add a new permission instance, instead associate with an existing one
        __associate__: MIGRATION_010_UIDS.PERMISSION_CMS
    }
};

export const guest1 = {
    uid: "7c79cde4-a80f-46ac-bef9-6dc1f7d8e045",
    AppUserProfile: {},
    AccessToken: {
        token: "39093067-810a-45d5-bb92-5aed5e3e88e0",
        validUntil: null as Date // guest users have no accesstoken expiry
    }
};

export const deactivated = {
    uid: "7aa69531-2508-45df-a7a3-bf44b35c624f",
    username: "deactivated@test.com",
    password: PASSWORD_HASH,
    salt: SALT,
    isActive: false,
    AccessToken: {
        token: "89df3988-246b-4389-aa6c-916041686e21",
        validUntil: serverdate.getMoment().add(1000, "years").toDate()
    },
    RefreshToken: {
        token: "6a1f2366-4fcb-4162-98a6-10986d0bafbd"
    }
};

export const googleUser = {
    uid: "f2076755-4ba5-4f91-8d16-55bca6dffafc",
    username: "google@test.com",
    password: null as string,
    salt: null as string,
    googleId: "superuniquegoogleid",
    googleInfo: {
        aud: "totallylegitaudience",
        exp: serverdate.getMoment().add(1, "year").unix(),
        iat: serverdate.getMoment().subtract(1, "minute").unix(),
        iss: "https://accounts.google.com.definitely.not.fake",
        sub: "superuniquegoogleid"
    },
    isActive: true,
    AccessToken: {
        token: "45f4bc44-c19b-4c8e-b527-8d116f35446b",
        validUntil: serverdate.getMoment().add(1000, "years").toDate()
    },
    RefreshToken: {
        token: "823b0f7b-6d37-446a-b0a4-3da189b6841e"
    }
};

export const facebookUser = {
    uid: "491ae2ba-d305-4e52-bcee-920b47344d17",
    username: "facebook@test.com",
    password: null as string,
    salt: null as string,
    facebookId: "superuniquefacebookid",
    facebookInfo: {
        id: "superuniquefacebookid"
    },
    isActive: true,
    AccessToken: {
        token: "417a8b46-d553-4fef-9410-ada65cc476f5",
        validUntil: serverdate.getMoment().add(1000, "years").toDate()
    },
    RefreshToken: {
        token: "91f6a3e2-4faf-4668-888d-1a7fb8f8214c"
    }
};

export const fixtureTrees: IFixtureTrees = [{
    User: [
        user1,
        user2,
        admin1,
        guest1,
        deactivated,
        nopasswordUser,
        googleUser,
        facebookUser
    ]
}];
