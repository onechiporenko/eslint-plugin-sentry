"use strict";

const ASTProcessor = require("./ast_processor.js");

const allowedTypes = "AssignmentExpression";

class Assignment extends ASTProcessor {

  constructor(assignmentNode) {
    super(assignmentNode);
    this.assignmentNode = assignmentNode;
  }

  getAllowedTypes() {
    return allowedTypes;
  }

}

module.exports = Assignment;