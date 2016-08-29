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

var rule = require("../../../lib/rules/no-short-assign"),
  RuleTester = require("eslint").RuleTester;

var Jsonium = require("jsonium");
var j = new Jsonium();

var m = "Looks like `a =+ b` is used instead of `a += b` (same for `=-`)";

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

var validAssignments = [
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

var invalidAssignment = [
  {ASSIGN: "a =+ b;"},
  {ASSIGN: "a =- b;"}
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