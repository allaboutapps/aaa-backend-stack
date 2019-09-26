export class Query {
    static alterSequenceStartValue(sequenceName: string): string {

        return `
-- Query to reset the start value of a sequence
-- Parameters:
---- startValue: number
ALTER SEQUENCE "${sequenceName}"
    MINVALUE :startValue
    START :startValue
    RESTART :startValue;
        `;
    }

    static getSequenceNextValue(sequenceName: string): string {
        return `SELECT nextval('${sequenceName}');`;
    }

    static createSequence(sequenceName: string, ifNotExists = false): string {
        if (ifNotExists) {
            return `DROP SEQUENCE IF EXISTS ${sequenceName}; CREATE SEQUENCE ${sequenceName};`;
        }

        return `CREATE SEQUENCE ${sequenceName};`;
    }

    static dropSequence(sequenceName: string, ifExists = false): string {
        if (ifExists) {
            return `DROP SEQUENCE IF EXISTS ${sequenceName};`;
        }
        return `DROP SEQUENCE ${sequenceName};`;
    }

    // if you want to generate sequences during runtime, dropping them is mandadory on wiping the database!
    // AFAIK there is no easier way to get + drop all sequences in the database as this.
    // http://grokbase.com/t/postgresql/pgsql-general/032my02pfx/how-to-drop-all-the-sequences
    // this is now executed by default as part of the dropAllTables statement in the storage
    // result --> check result.statement is string for the droppingSequences query
    static getDropAllSequencesPlainQuery(): string {
        return `
SELECT 'drop sequence ' || c.relname || ';' as statement FROM pg_class c WHERE
(c.relkind = 'S');
        `;
    }

}

export default Query;
