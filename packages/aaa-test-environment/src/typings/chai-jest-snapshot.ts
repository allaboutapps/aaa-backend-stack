// Type definitions for chai-as-promised
// Project: https://github.com/domenic/chai-as-promised/
// Definitions by: jt000 <https://github.com/jt000>, Yuki Kokubun <https://github.com/Kuniwak>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

/// <reference types="chai" />

declare module "chai-jest-snapshot" {
    function chaiJestSnapshot(chai: any, utils: any): void;
    namespace chaiJestSnapshot { }
    export = chaiJestSnapshot;
}

declare namespace Chai {

    // add matchSnapshot to '.to' operator
    interface Assertion {
        matchSnapshot(snapshotFileName: string, snapshotName: string);
    }

}
