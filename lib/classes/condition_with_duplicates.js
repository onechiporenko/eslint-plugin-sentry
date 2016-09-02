"use strict";

const Condition = require("./condition.js");

const vars = require("../utils/vars.js");
const escodegen = require("escodegen");

const keys = Object.keys;

const allowedTypes = ["LogicalExpression", "BinaryExpression"];

class ConditionWithDuplicates extends Condition {

  constructor(conditionNode) {
    super(conditionNode);
    this.operandsToGenerate = ["===", "==", "!==", "!=", "&&", "||", ">", "<", ">=", "<="];
    this.duplicates = [];
  }

  parse() {
    this.generateNormalizedNode();
    this.checkForDuplicatesAfterNormalize(this.normalizedNodes);
    this.generateOperands(this.normalizedNodes);
    return this.checkForDuplicates();
  }

  _lrEqual(node) {
    const strLeft = escodegen.generate(node.left, vars.codeGenOptions);
    const strRight = escodegen.generate(node.right, vars.codeGenOptions);
    const typesToIgnore = ["Literal", "ThisExpression"];
    return strLeft === strRight && typesToIgnore.indexOf(node.left.type) === -1 && typesToIgnore.indexOf(node.right.type) === -1;
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
      const strLeft = escodegen.generate(node.left, vars.codeGenOptions);
      const strRight = escodegen.generate(node.right, vars.codeGenOptions);
      if (this._lrEqual(node)) {
        this.duplicates.push(strLeft);
      }
      if (["===", "==", "!==", "!=", "&&", "||"].indexOf(operator) !== -1) {
        if (strLeft < strRight) {
          node = this._swapLeftRight(node);
        }
      }

      node.left = this._normalize(node.left);
      node.right = this._normalize(node.right);
    }
    return node;
  }

  checkForDuplicatesAfterNormalize(node) {
    if (node.left && node.right) {
      if (this._lrEqual(node)) {
        this.duplicates.push(escodegen.generate(node.left, vars.codeGenOptions));
      }
      else {
        this.checkForDuplicatesAfterNormalize(node.left);
        this.checkForDuplicatesAfterNormalize(node.right);
      }
    }
  }

  /**
   *
   * @returns {string[]}
   */
  checkForDuplicates() {
    const operands = this.operands;
    let codeBlocks = keys(operands);
    codeBlocks = codeBlocks.sort((a, b) => a.length > b.length ? -1 : 1);
    const normalizedNodes = this.normalizedNodes;
    let normalizedCode = escodegen.generate(normalizedNodes, vars.codeGenOptions);
    codeBlocks.forEach(codeBlock => {
      const replacerBody = codeBlock.replace(vars.regexRegexp, "\\$&");
      const replacer = new RegExp(replacerBody, "g");
      const replaceTo = operands[codeBlock];
      const matchesCount = (normalizedCode.match(replacer) || []).length;
      const isNotIdentifier = this.identifiers.indexOf(replacerBody) === -1;
      const isNotThis = replacerBody !== "this";
      if (matchesCount > 1 && isNotIdentifier && isNotThis) {
        this.duplicates.push(codeBlock);
      }
      normalizedCode = normalizedCode.replace(replacer, replaceTo);
    });
    return this.duplicates.filter((elem, pos) => this.duplicates.indexOf(elem) === pos);
  }

  getAllowedTypes() {
    return allowedTypes;
  }

}

module.exports = ConditionWithDuplicates;