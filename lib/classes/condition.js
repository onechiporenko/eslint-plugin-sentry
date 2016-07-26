"use strict";

var vars = require("../utils/vars.js");
var misc = require("../utils/misc.js");
var espurify = require("espurify");
var escodegen = require("escodegen");

const keys = Object.keys;

class Condition {

  constructor(conditionNode) {
    this.conditionNode = conditionNode;
    this.normalizedNodes = {};
    this.operands = {};
    this.invertedOperands = {};
    this.truthTable = {};
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
    var tmp = node.left;
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
    var operands = this.operands;
    var codeBlocks = keys(operands);
    codeBlocks = codeBlocks.sort((a, b) => a.length > b.length ? -1 : 1);
    var normalizedNodes = this.normalizedNodes;
    var normalizedCode = escodegen.generate(normalizedNodes, vars.codeGenOptions);
    codeBlocks.forEach(codeBlock => {
      var replacer = new RegExp(codeBlock.replace(vars.regexRegexp, "\\$&"), "g");
      var replaceTo = operands[codeBlock];
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
      var operator = node.operator;
      var newOperator = this._getNewOperator(operator) || operator;
      if (newOperator !== operator) {
        node.operator = newOperator;
        node = this._swapLeftRight(node);
      }
      if (["===", "==", "!==", "!=", "&&", "||"].indexOf(operator) !== -1) {
        var strLeft = escodegen.generate(node.left, vars.codeGenOptions);
        var strRight = escodegen.generate(node.right, vars.codeGenOptions);
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
   * Parse condition expression and generates truth table for it
   * It's a primary method and only it should be called directly
   */
  parse() {
    this.generateNormalizedNode();
    this.generateOperands(this.normalizedNodes);
    this.generateTruthTable();
  }

  /**
   *
   * @returns {ASTNode}
   */
  generateNormalizedNode() {
    // Don't change original node
    var clone = espurify(this.conditionNode);
    this.normalizedNodes = this._normalize(clone);
  }

  /**
   *
   * @param {ASTNode} node
   */
  generateOperands(node) {
    if (node.left && node.right && ["&&", "||"].indexOf(node.operator) !== -1) {
      this.generateOperands(node.left);
      this.generateOperands(node.right);
    }
    else {
      if (node.type !== "Literal") {
        var stringifiedNode = escodegen.generate(node, vars.codeGenOptions);
        if (!this.operands.hasOwnProperty(stringifiedNode)) {
          var k = "__0__" + keys(this.operands).length;
          this.operands[stringifiedNode] = k;
          this.invertedOperands[k] = stringifiedNode;
        }
      }
    }
  }

  /**
   *
   * @returns {object}
   */
  generateTruthTable() {
    let args = keys(this.invertedOperands);
    if (args.length === 1) {
      return [];
    }
    let simplifiedBody = this._simplifyOperands();
    let simplifiedFunction = this._getSimplifiedFunction(args, simplifiedBody);
    let argNames = args.sort();
    var ret = {};
    argNames.forEach(function (argName, indx) {
      var argNames2 = argNames.filter(_argName => _argName !== argName);
      if(!ret.hasOwnProperty(argName)) {
        ret[argName] = {};
      }
      var combos = misc.getBinaryCombos(argNames2);
      [true, false].forEach(function (v) {
        var strV = "" + v;
        if (!ret[argName].hasOwnProperty(strV)) {
          ret[argName][strV] = {};
        }
        combos.forEach(function (combo) {
          let args = argNames2.map(_argName => combo[_argName]);
          var _args = args.slice();
          args.splice(indx, 0, v);
          var value = simplifiedFunction.apply(null, args);
          var key = _args.join();
          ret[argName][strV][key] = value;
        });
      });
    });
    this.truthTable = ret;
  }

}

module.exports = Condition;