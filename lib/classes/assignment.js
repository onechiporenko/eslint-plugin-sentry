"use strict";

class Assignment {

  constructor(assignmentNode) {
    this.assignmentNode = assignmentNode;
  }

  parse() {
    return this._parseAssignment();
  }

  _parseAssignment() {
    throw Error("redeclare me!");
  }

}

module.exports = Assignment;