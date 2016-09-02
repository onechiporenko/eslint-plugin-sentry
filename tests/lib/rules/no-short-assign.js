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

const rule = require("../../../lib/rules/no-short-assign"),
  RuleTester = require("eslint").RuleTester;

const Jsonium = require("jsonium");
const j = new Jsonium();

const m = "Looks like `a =+ b` is used instead of `a += b` (same for `=-`)";

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const validAssignments = [
  {ASSIGN: "a += b;"},
  {ASSIGN: "a = +b;"},
  {ASSIGN: "a =\t+b;"},
  {ASSIGN: "a -= b;"},
  {ASSIGN: "a = -b;"},
  {ASSIGN: "a =\t-b;"},
  {ASSIGN: "a =-a;"},
  {ASSIGN: "a =- a;"},
  {ASSIGN: "a =- 1;"},
  {ASSIGN: "var a =- 1;"},
  {ASSIGN: "a =+b;"},
  {ASSIGN: "a =-b;"},
  {ASSIGN: "a=+b;"},
  {ASSIGN: "a=-b;"}
];

const invalidAssignment = [
  {ASSIGN: "a =+ b;"},
  {ASSIGN: "a =- b;"}
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
ruleTester.run("no-short-assign", rule, {
  valid: j
    .setTemplates(validTestTemplates)
    .createCombos(["code"], validAssignments)
    .uniqueCombos()
    .getCombos(),
  invalid: j
    .setTemplates(invalidTestTemplates)
    .createCombos(["code", "errors.0.message"], invalidAssignment)
    .uniqueCombos()
    .getCombos()
});