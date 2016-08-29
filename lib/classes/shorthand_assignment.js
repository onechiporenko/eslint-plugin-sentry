"use strict";

var Assignment = require("./assignment.js");

class ShorthandAssignment extends Assignment {

  _parseAssignment() {
    const node = this.assignmentNode;
    if (node.right.type === "UnaryExpression" && node.operator === "=" && ["+", "-"].indexOf(node.right.operator) !== -1) {
      if (node.right.argument.type === "Literal") {
        // `a =- 1;` is ok
        return false;
      }
      if (node.left.name === node.right.argument.name) {
        // `a =- a;` is ok
        return false;
      }
      const unaryStart = node.right.start;
      const unaryArgumentStart = node.right.argument.start;
      return unaryArgumentStart - unaryStart > 1;
    }
  }

}

module.exports = ShorthandAssignment;