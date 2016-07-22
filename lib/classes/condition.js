"use strict";

var vars = require("../vars.js");
var espurify = require("espurify");
var escodegen = require("escodegen");

class Condition {

  constructor(conditionNode) {
    this.conditionNode = conditionNode;
    this.normalizedNodes = {};
    this.operands = {};
  }

  static getNewOperator(oldOperator) {
    const operatorsConvertMap = {
      "<": ">",
      "<=": ">="
    };
    return operatorsConvertMap[oldOperator];
  }

  static swapLeftRight(node) {
    var tmp = node.left;
    node.left = node.right;
    node.right = tmp;
    return node;
  }

  _normalize(node) {
    if (node.left && node.right) {
      var operator = node.operator;
      var newOperator = Condition.getNewOperator(operator) || operator;
      if (newOperator !== operator) {
        node.operator = newOperator;
        node = Condition.swapLeftRight(node);
      }
      if (["===", "==", "!==", "!=", "&&", "||"].indexOf(operator) !== -1) {
        var strLeft = escodegen.generate(node.left, vars.codeGenOptions);
        var strRight = escodegen.generate(node.right, vars.codeGenOptions);
        if (strLeft < strRight) {
          node = Condition.swapLeftRight(node);
        }
      }

      node.left = this._normalize(node.left);
      node.right = this._normalize(node.right);
    }
    return node;
  }

  parse() {
    this.normalize();
    this.getOperands(this.conditionNode);
    this.replaceOperands();
  }

  normalize() {
    // Don't change original node
    var clone = espurify(this.conditionNode);
    this.normalizedNodes = this._normalize(clone);
    return this.normalizedNodes;
  }

  getOperands(node) {
    if (node.left && node.right && ["&&", "||"].indexOf(node.operator) !== -1) {
      this.getOperands(node.left);
      this.getOperands(node.right);
    }
    else {
      var stringifiedNode = escodegen.generate(node, vars.codeGenOptions);
      if (!this.operands.hasOwnProperty(stringifiedNode)) {
        this.operands[stringifiedNode] = "__" + (Object.keys(this.operands).length + 1);
      }
    }
  }

  replaceOperands() {
    const regexRegexp = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g;
    var operands = this.operands;
    var codeBlocks = Object.keys(operands);
    codeBlocks = codeBlocks.sort();
    var normalizedNodes = this.normalizedNodes;
    var normalizedCode = escodegen.generate(normalizedNodes, vars.codeGenOptions);
    codeBlocks.forEach(codeBlock => {
      var replacer = new RegExp(codeBlock.replace(regexRegexp, "\\$&"), "g");
      var replaceTo = operands[codeBlock];
      normalizedCode = normalizedCode.replace(replacer, replaceTo);
    });
    return normalizedCode;
  }

}

module.exports = Condition;