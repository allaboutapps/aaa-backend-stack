import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/storage");

import * as _ from "lodash";
import * as Sequelize from "sequelize";
import { MigrationAdapter, IMigrationAdapterConfig } from "./MigrationAdapter";
import { getModelName } from "../dbHelpers";

export type IModelFactoryFunctionsMap = {
    [name: string]: (sequelize: Sequelize.Sequelize) => Sequelize.Model<any, any>
};

export type IBulkData = { [modelKey: string]: object[] };
export interface IFixtureTreeItem {
    __associate__?: any;
    [modelOrAttributeKey: string]: number | string | string[] | boolean | Date | IFixtureTreeItem | IFixtureTreeItem[];
}
export type IFixtureTrees = Array<{ [modelKey: string]: IFixtureTreeItem[] | IFixtureTreeItem }>;

export interface IModelAdapterConfig extends IMigrationAdapterConfig {
    modelDefinitions: IModelFactoryFunctionsMap;
}

export interface IModels {
    [name: string]: Sequelize.Model<any, any>;
}

export interface IDefaultModelAttributes {
    createdAt: Date;
    updatedAt: Date;
}

export interface IDefaultParanoidModelAttributes extends IDefaultModelAttributes {
    deletedAt: Date;
}

export class ModelAdapter<TModels extends object, TConfig extends IModelAdapterConfig> extends MigrationAdapter<TConfig> {

    protected _models: TModels | IModels;

    public get modelFactoryFunctionsMap(): IModelFactoryFunctionsMap {
        if (!this.CONFIG.modelDefinitions) {
            logger.fatal("ModelAdapter: tried to get uninitialized modelDefinitions (you must call setModelFactoryFunctionMap before initializing the ModelAdapter)");
            throw new Error("ModelAdapter: cannot get IModelFactoryFunctionsMap");
        }

        return this.CONFIG.modelDefinitions;
    }

    public get models(): TModels | IModels { // any as we want allow to redeclare what models actually in applications
        if (!this._sequelize) {
            logger.fatal("StorageImpl.models: tried to get models from disconnected storage");
            throw new Error("StorageImpl.models: cannot get models from a disconnected storage");
        }

        return this._models;
    }

    public destroyModelAdapter(): void {
        logger.warn("ModelAdapter.destroyModelAdapter...");
        this._models = null;
    }

    // fast, however no nested models not allowed
    public async bulkImport(bulkData: IBulkData, validate: boolean = true, hooks: boolean = true) {
        try {
            const modelKeys: string[] = _.keys(bulkData);
            await Promise.each(modelKeys, (bulkModelKey) => {
                return this._models[bulkModelKey].bulkCreate(bulkData[bulkModelKey], {
                    validate,
                    hooks
                });
            });
        } catch (e) {
            logger.fatal({ error: e }, "ModelAdapter.bulkImport fatal error");
            throw e;
        }
    }

    // slow, but more convenient (allows nested models)
    public async treeImport(trees: IFixtureTrees, validate: boolean = true) {
        try {
            await Promise.each(trees, async (tree) => {
                return Promise.each(_.keys(tree), async (rootModelKey, index) => {
                    // welcome to the iteration party
                    if (_.isArray(tree[rootModelKey])) {
                        return Promise.each(<IFixtureTreeItem[]>tree[rootModelKey], async (attributes) => {
                            return this.importTreeInstance(rootModelKey, attributes, {
                                validate
                            });
                        });
                    } else if (_.isObject(tree[rootModelKey])) {
                        return this.importTreeInstance(rootModelKey, <IFixtureTreeItem>tree[rootModelKey], {
                            validate
                        });
                    } else {
                        throw new Error(`ModelAdapter.treeImport: unexpected datatype for rootModelKey %{tree[rootModelKey]} encountered`);
                    }

                });
            });
        } catch (e) {
            logger.fatal({ error: e }, "ModelAdapter.treeImport fatal error");
            throw e;
        }
    }

    protected initModelAdapter(customInitializedModels = null): void {

        if (customInitializedModels !== null) {
            this._models = customInitializedModels;
        } else {
            this._models = this.processModels(this._sequelize);
        }

        logger.debug("ModelAdapter.initModelAdapter: initialized");
    }

    public processModels(sequelizeInstance: Sequelize.Sequelize): TModels | IModels {

        const models: IModels = _.mapValues(this.modelFactoryFunctionsMap, (sequelizeModelFunction, modelName): Sequelize.Model<{}, {}> => {
            return sequelizeModelFunction(sequelizeInstance);
        });

        // then make model associations...
        _.each(_.filter(_.values(models), (model: any) => {
            return _.isFunction(model.associate);
        }), (model: any) => {
            model.associate(models);
        });

        return models;
    }

    protected async importTreeInstance(modelKey: string, attributes: IFixtureTreeItem, createOptions: Sequelize.CreateOptions, contextInstance: Sequelize.Instance<any> | null = null) {

        const Model = this._models[modelKey];

        if (!Model) {
            throw new Error(`importTreeInstance: modelKey ${modelKey} with attributes ${JSON.stringify(attributes, null, 2)} was not found`);
        }

        const modelAttributeKeys = _.keys((this._models[modelKey] as any).rawAttributes);

        // attributes may hold references to child tables, filter them out as we know the raw attributes...
        const attibuteKeys = _.keys(attributes);
        const instanceCreateAttributeKeys = _.intersection(modelAttributeKeys, attibuteKeys);
        const instanceCreateAttributes = _.reduce(instanceCreateAttributeKeys, (sum, attributeKey) => ({
            ...sum,
            [attributeKey]: attributes[attributeKey]
        }), {});

        // anything not within instanceCreateAttributes must be a referenced model...
        const referencedCreateAttributesKeys = _.without(
            _.difference(attibuteKeys, instanceCreateAttributeKeys),
            "__associate__"
        );
        const referencedCreateAttributes = _.reduce(referencedCreateAttributesKeys, (sum, attributeKey) => ({
            ...sum,
            [attributeKey]: attributes[attributeKey]
        }), {});

        if (contextInstance) {
            logger.debug(`ModelAdapter.importTreeInstance: --| ${getModelName(contextInstance.Model)}.${modelKey}`);
        } else {
            logger.debug(`ModelAdapter.importTreeInstance: --> ${modelKey}`);
        }

        logger.trace({
            modelKey,
            instanceCreateAttributes,
            referencedCreateAttributes
        }, "ModelAdapter.importTreeInstance: separated attributes and referencedModels");

        // we are now able to create the instance with the above attributes...
        let instance: Sequelize.Instance<any>;
        if (!contextInstance) {

            logger.trace({
                modelKey,
                modelAttributeKeys,
                instanceCreateAttributes,
            }, "ModelAdapter.importTreeInstance: creating instance...");

            instance = await Model.create(instanceCreateAttributes, createOptions);
        } else {
            // we are operating on an instanceContext, we must call create<ModelKey> or add<ModelKey> on the Instance, e.g. createAccessToken...
            const mode = _.isUndefined(attributes.__associate__) ? "create" : "add";
            const instanceCreatorFnKey = `${mode}${modelKey}`;

            logger.trace({
                modelKey,
                modelAttributeKeys,
                instanceCreateAttributes,
                instanceCreatorFnKey,
            }, "ModelAdapter.importTreeInstance: creating instance on contextInstance...");

            if (_.isFunction(contextInstance[instanceCreatorFnKey]) === false) {
                throw new Error(`importTreeInstance: contextInstance ${getModelName(contextInstance.Model)}
has no instanceCreatorFnKey ${getModelName(contextInstance.Model)}.${instanceCreatorFnKey}
Tried to create ${modelKey} with attributes ${JSON.stringify(attributes, null, 2)}`);
            }

            if (mode === "add") {
                instance = await contextInstance[instanceCreatorFnKey](attributes.__associate__);
            } else {
                instance = await contextInstance[instanceCreatorFnKey](instanceCreateAttributes);
            }

        }

        // instance was successfully created, now we need to recursively add all nested instances...
        // the remaining attributes can be defined as single object or and array of objects.
        await Promise.each(referencedCreateAttributesKeys, async (referencedModelKey: string) => {
            const referencedModelAttributes = <IFixtureTreeItem | IFixtureTreeItem[]> attributes[referencedModelKey];
            if (_.isArray(referencedModelAttributes)) {
                await Promise.each(referencedModelAttributes, async (referencedModelAttribute) => {
                    return this.importTreeInstance(referencedModelKey, referencedModelAttribute, createOptions, instance);
                });
            } else if (_.isObject(referencedModelAttributes)) {
                await this.importTreeInstance(referencedModelKey, <IFixtureTreeItem>referencedModelAttributes, createOptions, instance);
            } else {
                throw new Error(`importTreeInstance: Unexpected datatype for ${referencedModelKey} encountered`);
            }
        });

    }

}

