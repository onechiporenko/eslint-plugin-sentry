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

const rule = require("../../../lib/rules/no-red-cond"),
  RuleTester = require("eslint").RuleTester;

const Jsonium = require("jsonium");
const j = new Jsonium();

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const validConditions = [
  {COND: "x || y"}
];

const invalidConditions = [
  {COND: "x && y || x", M: "y"},
  {COND: "a && b || a", M: "b"},
  {COND: "a && b && c || a", M: "c, b"},
  {COND: "a && b && c && d || a", M: "d, c, b"},
  {COND: "a && b && c || a && b", M: "c"},
  {COND: "a && b && c && d || a && b", M: "d, c"},
  {COND: "a && b && (c || d) || a && b", M: "d, c"},
  {COND: "a && (b || c || d) || a", M: "d, c, b"}
];

const validTestTemplates = [
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

const invalidTestTemplates = [
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

const ruleTester = new RuleTester({env: {es6: true}});
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