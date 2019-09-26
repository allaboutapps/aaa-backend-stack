import * as ts from "typescript";
import * as Lint from "tslint";
import { AstUtils } from "./utils/AstUtils";

class NoDateWalker extends Lint.RuleWalker {

    protected visitNewExpression(node: ts.NewExpression) {

        // Get name of class that's being created
        const name = AstUtils.getFunctionName(node);
        if (name === "Date") {
            // create a failure at the current position
            // tslint:disable-next-line
            this.addFailure(this.createFailure(node.getStart(), node.getWidth(), Rule.FAILURE_STRING));
        }

        // call the base version of this visitor to actually parse this node
        super.visitNewExpression(node);
    }
}

export class Rule extends Lint.Rules.AbstractRule {
    public static FAILURE_STRING = "new Date() forbidden, use @aaa-backend-stack/serverdate instead";

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        return this.applyWithWalker(new NoDateWalker(sourceFile, this.getOptions()));
    }
}
