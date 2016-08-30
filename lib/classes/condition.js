"use strict";

const ASTProcessor = require("./ast_processor.js");

class Condition extends ASTProcessor {

  constructor(conditionNode) {
    super(conditionNode, "LogicalExpression");
    this.conditionNode = conditionNode;
  }


  parse() {
    throw new Error("`parse`");
  }

}

module.exports = Condition;