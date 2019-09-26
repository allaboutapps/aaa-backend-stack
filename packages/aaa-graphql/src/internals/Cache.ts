import * as GQL from "graphql";
import * as _ from "lodash";

// Internal datastructure to reuse gql type definitions for specific generated types
export default class Cache {

    private _enumTypeCache = {}; // internal graphql-sequelize type cache
    private _listTypeCache = {}; // list type caches for offsetList and relay list to disallow name collisions
    private _registeredEnumCache: {
        [key: string]: GQL.GraphQLEnumType
    } = {}; // helper to allow getting enum values within a registered enum type

    public registerNewEnumType(config: GQL.GraphQLEnumTypeConfig): GQL.GraphQLEnumType {
        const newEnum = new GQL.GraphQLEnumType(config);

        if (this._registeredEnumCache[config.name]) {
            // throw, reregister is not allowed!
            throw new Error("Cache.registerNewEnumType: tried to reregister enum named " + config.name);
        }

        this._registeredEnumCache[config.name] = newEnum;
        return newEnum;
    }

    public getRegisteredEnumType(name: string): GQL.GraphQLEnumType {
        return this._registeredEnumCache[name];
    }

    public getRegisteredEnumTypeValue(name: string, enumValueIdentifier: string): GQL.GraphQLEnumType {
        const type = _.find(this.getRegisteredEnumType(name).getValues(), { name: enumValueIdentifier });

        if (type) {
            return type.value;
        }

        throw new Error(`getRegisteredEnumTypeValue: unabled to find name ${name} with enumValueIdentifier ${enumValueIdentifier}.`);
    }

    public get enumTypeCache(): any {
        return this._enumTypeCache;
    }

    public set enumTypeCache(v: any) {
        this._enumTypeCache = v;
    }

    public get listTypeCache(): any {
        return this._listTypeCache;
    }

    public set listTypeCache(v: any) {
        this._listTypeCache = v;
    }

}
