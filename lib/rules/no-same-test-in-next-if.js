/**
 * @fileoverview
 * @author onechiporenko
 * @copyright 2016 onechiporenko. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict";
var ast = require("../utils/ast.js");
var Normalizer = require("../utils/normalizer.js");
var m = "Next `If` has same `condition` as this one";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {

  function check(node, nextStatement) {
    if(nextStatement === null || nextStatement.type !== node.type) {
      return;
    }
    var n = new Normalizer();
    var nodeClone = n.proceedNode(node);
    var nextStatementClone = n.proceedNode(nextStatement);
    if (ast.stringifyNode(nodeClone.test) === ast.stringifyNode(nextStatementClone.test)) {
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