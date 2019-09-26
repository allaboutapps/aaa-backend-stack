export { instance as AuthenticationService } from "./auth";
export { instance as FacebookAuthenticationService } from "./facebook";
export { instance as GoogleAuthenticationService } from "./google";
export { instance as LocalAuthenticationService } from "./local";
export * from "./_types";

import { instance as AuthenticationService } from "./auth";
export default AuthenticationService;
