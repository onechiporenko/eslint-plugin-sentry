"use strict";

const ASTProcessor = require("./ast_processor.js");

const vars = require("../utils/vars.js");
const ast = require("../utils/ast.js");
const espurify = require("espurify");
const escodegen = require("escodegen");

const keys = Object.keys;

const allowedTypes = "LogicalExpression";

class Condition extends ASTProcessor {

  constructor(conditionNode) {
    super(conditionNode);
    this.conditionNode = conditionNode;
    this.normalizedNodes = {};
    this.operands = {};
    this.invertedOperands = {};
    this.operandsToGenerate = ["&&", "||"];
    this.identifiers = [];
  }

  /**
   *
   * @param oldOperator
   * @returns {string}
   * @private
   */
  _getNewOperator(oldOperator) {
    const operatorsConvertMap = {
      "<": ">",
      "<=": ">="
    };
    return operatorsConvertMap[oldOperator] || oldOperator;
  }

  /**
   * @param {ASTNode} node
   * @returns {ASTNode}
   * @private
   */
  _swapLeftRight(node) {
    const tmp = node.left;
    node.left = node.right;
    node.right = tmp;
    return node;
  }

  /**
   *
   * @param {string} args
   * @param {string} body
   * @returns {Function}
   * @private
   */
  _getSimplifiedFunction(args, body) {
    return new Function(args, "return " + body + ";");
  }

  /**
   *
   * @returns {ASTNode}
   * @private
   */
  _simplifyOperands() {
    const operands = this.operands;
    let codeBlocks = keys(operands);
    codeBlocks = codeBlocks.sort((a, b) => a.length > b.length ? -1 : 1);
    const normalizedNodes = this.normalizedNodes;
    let normalizedCode = escodegen.generate(normalizedNodes, vars.codeGenOptions);
    codeBlocks.forEach(codeBlock => {
      const replacer = new RegExp(codeBlock.replace(vars.regexRegexp, "\\$&"), "g");
      const replaceTo = operands[codeBlock];
      normalizedCode = normalizedCode.replace(replacer, replaceTo);
    });
    return normalizedCode;
  }

  /**
   * @param {ASTNode} node
   * @returns {ASTNode}
   * @private
   */
  _normalize(node) {
    if (node.left && node.right) {
      const operator = node.operator;
      const newOperator = this._getNewOperator(operator) || operator;
      if (newOperator !== operator) {
        node.operator = newOperator;
        node = this._swapLeftRight(node);
      }
      if (["===", "==", "!==", "!=", "&&", "||"].indexOf(operator) !== -1) {
        const strLeft = escodegen.generate(node.left, vars.codeGenOptions);
        const strRight = escodegen.generate(node.right, vars.codeGenOptions);
        if (strLeft < strRight) {
          node = this._swapLeftRight(node);
        }
      }

      node.left = this._normalize(node.left);
      node.right = this._normalize(node.right);
    }
    return node;
  }

  /**
   *
   * @returns {ASTNode}
   */
  generateNormalizedNode() {
    // Don't change original node
    const clone = espurify(this.conditionNode);
    this.normalizedNodes = this._normalize(clone);
  }

  /**
   *
   * @param {ASTNode} node
   */
  generateOperands(node) {
    if (node.left && node.right && this.operandsToGenerate.indexOf(node.operator) !== -1) {
      this.generateOperands(node.left);
      this.generateOperands(node.right);
    }
    else {
      if (node.type !== "Literal" && !ast.isNumberWithSign(node)) {
        const stringifiedNode = escodegen.generate(node, vars.codeGenOptions);
        if (!this.operands.hasOwnProperty(stringifiedNode)) {
          const k = "__0__" + keys(this.operands).length;
          this.operands[stringifiedNode] = k;
          this.invertedOperands[k] = stringifiedNode;
          if (node.type === "Identifier") {
            this.identifiers.push(node.name);
          }
        }
      }
    }
  }

  parse() {
    this.generateNormalizedNode();
    this.generateOperands(this.normalizedNodes);
  }

  getAllowedTypes() {
    return allowedTypes;
  }

}

module.exports = Condition;