import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/storage");

import * as _ from "lodash";
import * as Sequelize from "sequelize";
import * as util from "util";

// db-helpers...

// use SELECT enum_range(NULL::"enumIdentifier"); to find this in the database
// attention, this handling cannot run transactional!
// set executeInTransaction: false in your migration file!
export function addValueToEnum(queryInterface: Sequelize.QueryInterface, enumIdentifier: string, additionalValue: any): Promise<void> {
    return queryInterface.sequelize.query(`ALTER TYPE "${enumIdentifier}" ADD VALUE '${additionalValue}'`); // appends to enum list
}

export interface IEnumLiteralOptions {
    prependLiteral: string;
    appendLiteral: string;
}

export function getModelName<TInstance, TAttributes>(model: Sequelize.Model<TInstance, TAttributes>): string {
    // Do NOT use: return `${util.inspect(model)}`; -> according to node docs util.inspect() result
    // can change anytime. You should not rely on it.

    // This takes model.toString() which returns [object SequelizeModel:User] and extracts "User" to
    // stay compatible with current code base
    return model.toString().match(/(?<=\:)(.*?)(?=\])/g)[0];
}

export function getOrderByEnumLiteral<TInstance, TAttributes>(model: Sequelize.Model<TInstance, TAttributes>, attributeName: keyof TAttributes, sortedEnumValues: string[], options: Partial<IEnumLiteralOptions> = {}): Sequelize.literal {

    const whenStates = _.reduce(sortedEnumValues, (sum, value, index) => {
        sum += `
            when '${value}' then ${index}
        `;
        return sum;
    }, "");

    return Sequelize.literal(`${options.prependLiteral ? (options.prependLiteral + ", ") : ""}(
        case "${getModelName(model)}"."${attributeName}"
            ${whenStates}
            else ${sortedEnumValues.length}
        end
    )${options.appendLiteral ? (", " + options.appendLiteral) : ""}`);
}

