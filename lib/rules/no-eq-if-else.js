/**
 * @fileoverview
 * @author onechiporenko
 * @copyright 2016 onechiporenko. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict";
var ast = require("../utils/ast.js");
var Normalizer = require("../utils/normalizer.js");
var m = "`Consequent` and `Alternate` parts look like the same";
var espurify = require("espurify");

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {

  return {

    "ConditionalExpression": function (node) {
      var n = new Normalizer();
      var clone = n.proceedNode(espurify(node));
      var ifCode = ast.stringifyNode(clone.consequent);
      var elseCode = ast.stringifyNode(clone.alternate);
      if (ifCode === elseCode) {
        return context.report(node, m);
      }
    },

    "IfStatement": function (node) {
      var n = new Normalizer();
      var ifPart = n.proceedNode(node.consequent);
      var elsePart = node.alternate;
      if (elsePart === null) {
        return;
      }
      elsePart = n.proceedNode(elsePart);
      var ifCode = ast.stringifyNode(ifPart);
      var elseCode = ast.stringifyNode(elsePart);
      var ifCodeIsBlock = ifPart.type === "BlockStatement";
      var elseCodeIsBlock = elsePart.type === "BlockStatement";
      if (ifCodeIsBlock && elseCodeIsBlock) {
        if (ifCode === elseCode) {
          return context.report(node, m);
        }
      }
      if (!ifCodeIsBlock && elseCodeIsBlock) {
        if (elsePart.body.length !== 1) {
          // `if` is statement expression and `else` body contains not 1 statement,
          // so `if` and `else` are different and there is not sense to check it more accurate
          return;
        }
        elseCode = ast.stringifyNode(elsePart.body[0]);
        if (ifCode === elseCode) {
          return context.report(node, m);
        }
      }
      if (ifCodeIsBlock && !elseCodeIsBlock) {
        if (ifPart.body.length !== 1) {
          // `else` is statement expression and `if` body contains not 1 statement,
          // so `if` and `else` are different and there is not sense to check it more accurate
          return;
        }
        ifCode = ast.stringifyNode(ifPart.body[0]);
        if (ifCode === elseCode) {
          return context.report(node, m);
        }
      }
      if (!ifCodeIsBlock && !elseCodeIsBlock) {
        if (ifCode === elseCode) {
          return context.report(node, m);
        }
      }
    }

  }

};

module.exports.schema = [];