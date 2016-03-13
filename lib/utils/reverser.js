var espurify = require("espurify");

function Reverser () {}

Reverser.prototype = {

  constructor: Reverser,

  /**
   * Reverse operator for the provided node
   *
   * @param {ASTNode} node
   * @returns {ASTNode}
   */
  proceedNode: function (node) {
    var clone = espurify(node);
    var operator = node.operator;
    var type = node.type;
    if (type === "UnaryExpression") {
      if (operator === "!") {
        clone.operator = "";
      }
    }
    if (type === "BinaryExpression") {
      var operatorsMap = {
        "===": "!==",
        "==": "!=",
        ">=": "<",
        ">": "<="
      };
      clone.operator = operatorsMap[operator] || operator;
    }
    return clone;
  }
};

module.exports = Reverser;