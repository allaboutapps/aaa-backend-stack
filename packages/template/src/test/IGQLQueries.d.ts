/* tslint:disable */
//  This file was automatically generated and should not be edited.

export type TestErrorMutation = {
  // Throws a test error
  testError: boolean | null,
};

export type WhoamiQuery = {
  // Resolves a single User instance.
  // Might throw 'ENTITY_NOT_FOUND'.
  me:  {
    uid: string,
    username: string | null,
    isActive: boolean | null,
  } | null,
};
/* tslint:enable */
