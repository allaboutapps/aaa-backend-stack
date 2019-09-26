import { isEqual, filter } from "lodash";

// creates a duplicate free collection using deep object comparison, automatically infers the type.
// adapted from answer in http://stackoverflow.com/questions/9923890/removing-duplicate-objects-with-underscore-for-javascript
export function getUniqueCollection<T>(duplicateCollectionItems: Array<T> = []): Array<T> {
    return filter(duplicateCollectionItems, function (element, index) {
        // tests if the element has a duplicate in the rest of the array
        for (index += 1; index < duplicateCollectionItems.length; index += 1) {
            if (isEqual(element, duplicateCollectionItems[index])) {
                return false;
            }
        }
        return true;
    });
}
