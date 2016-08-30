"use strict";

const Assignment = require("./assignment.js");
const estraverse = require("estraverse");

class ShorthandSelfAssignment extends Assignment {

  _parseAssignment() {
    const assignmentNode = this.assignmentNode;
    const operatorsToCheck = ["+=", "-=", "/=", "*="];
    const leftIdentifier = assignmentNode.left.name;
    let leftExistsInRight = false;

    if (operatorsToCheck.indexOf(assignmentNode.operator) !== -1) {
      estraverse.traverse(assignmentNode.right, {
        enter: function (node, parent) {
          if (node.type === "Identifier" && node.name === leftIdentifier) {
            if (parent && parent.type === "MemberExpression") {
              return;
            }
            leftExistsInRight = true;
            this.break();
          }
        }
      });
    }
    return leftExistsInRight;
  }

}

module.exports = ShorthandSelfAssignment;