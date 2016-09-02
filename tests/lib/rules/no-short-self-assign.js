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

const rule = require("../../../lib/rules/no-short-self-assign"),
  RuleTester = require("eslint").RuleTester;

const Jsonium = require("jsonium");
const j = new Jsonium();

const m = "Shorthand self assignment are hard to read";

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const operators = [
  {OPERATOR: "+="},
  {OPERATOR: "-="},
  {OPERATOR: "*="},
  {OPERATOR: "/="}
];

const validAssignments = [
  {ASSIGN: "a {{OPERATOR}} b;"},
  {ASSIGN: "a {{OPERATOR}} b.a;"},
  {ASSIGN: "a {{OPERATOR}} b['a'];"},
  {ASSIGN: "a {{OPERATOR}} b.a();"},
  {ASSIGN: "a {{OPERATOR}} a.b;"}
];

const invalidAssignment = [
  {ASSIGN: "a {{OPERATOR}} a + b;"},
  {ASSIGN: "a {{OPERATOR}} b - a;"}
];

const validTestTemplates = [
  {
    code:
      "{{ASSIGN}}"
  }
];

const invalidTestTemplates = [
  {
    code:
      "{{ASSIGN}}",
    errors: [
      {message: m}
    ]
  }
];

const ruleTester = new RuleTester({env: {es6: true}});
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