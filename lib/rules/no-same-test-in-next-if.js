/**
 * @fileoverview
 * @author onechiporenko
 * @copyright 2016 onechiporenko. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict";
var ast = require("../utils/ast.js");
var m = "Next `If` has same `condition` as this one";
var escodegen = require("escodegen");

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {

  function check(node, nextStatement) {
    if(nextStatement === null || nextStatement.type !== node.type) {
      return;
    }
    var nodeClone = ast.cloneNodeWithNormalizing(node);
    var nextStatementClone = ast.cloneNodeWithNormalizing(nextStatement);
    if (escodegen.generate(nodeClone.test, ast.codeGenOptions) === escodegen.generate(nextStatementClone.test, ast.codeGenOptions)) {
      context.report(node, m);
    }
  }

  return {

    "IfStatement": function (node) {
      var nextStatement = ast.getNextStatement(node);
      check(node, nextStatement);
    },

    "ConditionalExpression": function (node) {
      var nextStatement = ast.getNextStatement(node.parent);
      nextStatement = nextStatement ? (nextStatement.expression || nextStatement) : null;
      check(node, nextStatement);
    }
  }

};

module.exports.schema = [];