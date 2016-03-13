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
var m = "`Consequent` and `Alternate` parts look like the same";
var escodegen = require("escodegen");
var espurify = require("espurify");

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {

  return {

    "ConditionalExpression": function (node) {
      var n = new Normalizer();
      var clone = n.proceedNode(espurify(node));
      var ifPart = o.get(clone, "consequent");
      var elsePart = o.get(clone, "alternate");
      var ifCode = escodegen.generate(ifPart, ast.codeGenOptions);
      var elseCode = escodegen.generate(elsePart, ast.codeGenOptions);
      if (ifCode === elseCode) {
        return context.report(node, m);
      }
    },

    "IfStatement": function (node) {
      var n = new Normalizer();
      var ifPart = n.proceedNode(o.get(node, "consequent"));
      var elsePart = o.get(node, "alternate");
      if (elsePart === null) {
        return;
      }
      elsePart = n.proceedNode(elsePart);
      var ifCode = escodegen.generate(ifPart, ast.codeGenOptions);
      var elseCode = escodegen.generate(elsePart, ast.codeGenOptions);
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
          // so they `if` and `else` are different and there is not sense to check it more accurate
          return;
        }
        elseCode = escodegen.generate(elsePart.body[0], ast.codeGenOptions);
        if (ifCode === elseCode) {
          return context.report(node, m);
        }
      }
      if (ifCodeIsBlock && !elseCodeIsBlock) {
        if (ifPart.body.length !== 1) {
          // `else` is statement expression and `if` body contains not 1 statement,
          // so they `if` and `else` are different and there is not sense to check it more accurate
          return;
        }
        ifCode = escodegen.generate(ifPart.body[0], ast.codeGenOptions);
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