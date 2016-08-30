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

var rule = require("../../../lib/rules/no-short-self-assign"),
  RuleTester = require("eslint").RuleTester;

var Jsonium = require("jsonium");
var j = new Jsonium();

var m = "Shorthand self assignment are hard to read";

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

var operators = [
  {OPERATOR: "+="},
  {OPERATOR: "-="},
  {OPERATOR: "*="},
  {OPERATOR: "/="}
];

var validAssignments = [
  {ASSIGN: "a {{OPERATOR}} b;"},
  {ASSIGN: "a {{OPERATOR}} b.a;"},
  {ASSIGN: "a {{OPERATOR}} b['a'];"},
  {ASSIGN: "a {{OPERATOR}} b.a();"},
  {ASSIGN: "a {{OPERATOR}} a.b;"}
];

var invalidAssignment = [
  {ASSIGN: "a {{OPERATOR}} a + b;"},
  {ASSIGN: "a {{OPERATOR}} b - a;"}
];

var validTestTemplates = [
  {
    code:
      "{{ASSIGN}}"
  }
];

var invalidTestTemplates = [
  {
    code:
      "{{ASSIGN}}",
    errors: [
      {message: m}
    ]
  }
];

var ruleTester = new RuleTester({env: {es6: true}});
ruleTester.run("no-short-self-assign", rule, {
  valid: j
    .setTemplates(validTestTemplates)
    .createCombos(["code"], validAssignments)
    .useCombosAsTemplates()
    .createCombos(["code"], operators)
    .uniqueCombos()
    .getCombos(),
  invalid: j
    .setTemplates(invalidTestTemplates)
    .createCombos(["code", "errors.0.message"], invalidAssignment)
    .useCombosAsTemplates()
    .createCombos(["code"], operators)
    .uniqueCombos()
    .getCombos()
});