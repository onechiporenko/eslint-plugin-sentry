"use strict";

const ASTProcessor = require("./ast_processor.js");

class Assignment extends ASTProcessor {

  constructor(assignmentNode) {
    super(assignmentNode, "AssignmentExpression");
    this.assignmentNode = assignmentNode;
  }

}

module.exports = Assignment;