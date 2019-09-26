/**
 * checks if the string value matches the UIDv4 format
 * @param value
 * @returns {boolean}
 */
const expression = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function isUID(value: string): boolean {
    return expression.test(value);
}
