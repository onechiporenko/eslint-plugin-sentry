/**
 * @fileoverview
 * @author onechiporenko
 * @copyright 2016 onechiporenko. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var rule = require("../../../lib/rules/no-red-cond"),
  RuleTester = require("eslint").RuleTester;

var Jsonium = require("jsonium");
var j = new Jsonium();

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

var validConditions = [
  {COND: "x || y"}
];

var invalidConditions = [
  {COND: "x && y || x", M: "y"}
];

var validTestTemplates = [
  {
    code:
      "var a = {{COND}};"
  },
  {
    code:
      "var a = ({{COND}}) ? b : c;"
  },
  {
    code:
      "if({{COND}}) { c = d; }"
  }
];

var invalidTestTemplates = [
  {
    code:
      "var a = {{COND}};",
    errors: [
      {message: "{{M}} are redundant"}
    ]
  },
  {
    code:
      "var a = ({{COND}}) ? b : c;",
    errors: [
      {message: "{{M}} are redundant"}
    ]
  },
  {
    code:
      "if({{COND}}) { c = d; }",
    errors: [
      {message: "{{M}} are redundant"}
    ]
  }
];

var ruleTester = new RuleTester({env: {es6: true}});
ruleTester.run("no-red-cond", rule, {
  valid: j
    .setTemplates(validTestTemplates)
    .createCombos(["code"], validConditions)
    .uniqueCombos()
    .getCombos(),
  invalid: j
    .setTemplates(invalidTestTemplates)
    .createCombos(["code", "errors.0.message"], invalidConditions)
    .uniqueCombos()
    .getCombos()
});