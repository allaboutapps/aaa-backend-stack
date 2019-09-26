import * as path from "path";
import { FS_EXTRA } from "@aaa-backend-stack/build-tools";
import * as _ from "lodash";

const PATH_TO_TEMPLATE = path.join(__dirname, "../static/index.html");
const devToolsTemplate = FS_EXTRA.readFileSync(PATH_TO_TEMPLATE);

export function buildWebTemplate(gitBranch: string, gitTag: string, gitHash: string, gitMessage: string, wsPath: string) {
    // we need to evaluate the loaded string from the file directly so we can use it as template string
    // attention, eval is normally pretty insecure and should not be used, however:
    // * this allows us to decouple the .html from the src
    // * properly format the index.html file in editors

    // tslint:disable-next-line:no-eval
    return eval("`" + devToolsTemplate.toString() + "`"); // params in this function scope are automatically injected through eval
}

// Performance: memorize the evaluation of constructing the webtemplate
const memorizedWebTemplate = _.once(buildWebTemplate);

export default memorizedWebTemplate;
