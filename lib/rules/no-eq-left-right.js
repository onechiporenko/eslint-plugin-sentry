/**
 * @fileoverview
 * @author onechiporenko
 * @copyright 2016 onechiporenko. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict";
var ast = require("../utils/ast.js");
var o = require("object-path");
var Normalizer = require("../utils/normalizer.js");
var m = "Expressions parts look like the same";
var escodegen = require("escodegen");

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {

  var independentFromSideOperators = ["===", "==", "!==", "!=", "*", "+"];

  /**
   * K-combinations
   * Get k-sized combinations of elements in a set
   * From https://gist.github.com/axelpale/3118596
   *
   * Example
   * <pre>
   *   var combos = getCombinations([1, 2, 3], 2);
   *   console.log(combos); // [[1,2], [1,3], [2, 3]]
   * </pre>
   *
   * @param {string[]} list Array of objects of any type. They are treated as unique
   * @param {number} k size of combinations to search for
   * @returns {string[][]} Array of found combinations, size of a combination is k
   */
  function getCombinations(list, k) {
    var i, j, combos, head, tailCombos;

    if (k > list.length || k <= 0) {
      return [];
    }

    if (k === list.length) {
      return [list];
    }

    if (k === 1) {
      combos = [];
      for (i = 0; i < list.length; i++) {
        combos.push([list[i]]);
      }
      return combos;
    }

    combos = [];
    for (i = 0; i < list.length - k + 1; i++) {
      head = list.slice(i, i + 1);
      tailCombos = getCombinations(list.slice(i + 1), k - 1);
      for (j = 0; j < tailCombos.length; j++) {
        combos.push(head.concat(tailCombos[j]));
      }
    }
    return combos;
  }

  /**
   * Checks if node has <code>left, right, operator</code> fields
   *
   * @param {ASTNode} node
   * @returns {boolean}
   */
  function hasParts(node) {
    return o.has(node, "left") && o.has(node, "right") && o.has(node, "operator");
  }

  /**
   * Remove duplicate pairs from the provided list
   *
   * @param {object[][]} pairs
   * @returns {object[][]}
   */
  function filterDuplicatesPairs(pairs) {
    var map = {};
    var ret = [];
    pairs.forEach(function (pair) {
      var stringified = JSON.stringify(pair);
      if (!map[stringified]) {
        map[stringified] = true;
        ret.push(pair);
      }
    });
    return ret;
  }

  /**
   * Convert normalized expression to string => `left operator right` or `right operator left` (if inverted is <code>true</code>)
   *
   * @param {normalizedBinary} nb
   * @param {boolean} [inverted]
   * @returns {string}
   */
  function exp2str(nb, inverted) {
    return inverted ? nb.right + nb.operator + nb.left : nb.left + nb.operator + nb.right;
  }

  return {

    "BinaryExpression": function (node) {
      var operator = o.get(node, "operator");
      if (["===", "==", "!==", "!=", ">", ">=", "<=", "<", "in", "instanceof", "%", "/", "-"].indexOf(operator) === -1) {
        return;
      }
      var n = new Normalizer();
      var l = n.proceedNode(node.left);
      var r = n.proceedNode(node.right);
      if (escodegen.generate(l, ast.codeGenOptions) === escodegen.generate(r, ast.codeGenOptions)) {
        context.report(node, m);
      }
    },

    "LogicalExpression": function (node) {
      // don't check parts of the big Logical Expression => `a==b && c==d && e==f` should be checked and not `a==b && c==d`
      if (o.get(node, "parent.type") === "LogicalExpression") {
        return;
      }
      var n = new Normalizer();
      var leftExpression = node.left;
      var rightExpression = node.right;
      var operator = node.operator;
      var leftHasParts = hasParts(leftExpression);
      var rightHasParts = hasParts(rightExpression);
      // expression is something like -> `a==b && c==d`
      if (leftHasParts && rightHasParts) {
        var pairs = filterDuplicatesPairs(getCombinations(ast.groupNodes(node, operator).filter(hasParts).map(n.normalizeBinaryExpression), 2));

        pairs.forEach(function (pair) {
          var l = pair[0];
          var r = pair[1];
          if (exp2str(l) === exp2str(r)) {
            return context.report(node, m);
          }
          // check that expression is something like this -> `a == b && b == a`
          if (l.operator === r.operator && independentFromSideOperators.indexOf(l.operator) !== -1) {
            if (exp2str(l, true) === exp2str(r)) {
              context.report(node, m);
            }
          }
        });
      }
      else {
        // expression is something like -> `a==b` (each part is not another logical or binary expression)
        if (!leftHasParts && !rightHasParts) {
          if (escodegen.generate(leftExpression, ast.codeGenOptions) === escodegen.generate(rightExpression, ast.codeGenOptions)) {
            context.report(node, m);
          }
        }
      }
    }

  }

};

module.exports.schema = [];