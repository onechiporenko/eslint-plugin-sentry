"use strict";

const ASTProcessor = require("./ast_processor.js");

class Assignment extends ASTProcessor {

  constructor(assignmentNode) {
    super(assignmentNode, "AssignmentExpression");
    this.assignmentNode = assignmentNode;
  }

  parse() {
    return this._parseAssignment();
  }

  _parseAssignment() {
    throw new Error("Override me!");
  }

}

module.exports = Assignment;