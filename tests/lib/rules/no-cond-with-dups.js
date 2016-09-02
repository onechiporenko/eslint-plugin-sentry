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

const rule = require("../../../lib/rules/no-cond-with-dups"),
  RuleTester = require("eslint").RuleTester;

const Jsonium = require("jsonium");
const j = new Jsonium();

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const operators = [
  {OP: "&&"},
  {OP: "||"},
  {OP: ">="},
  {OP: ">"},
  {OP: "<"},
  {OP: "<="},
  {OP: "!=="},
  {OP: "!="},
  {OP: "=="},
  {OP: "==="}
];

const validConditions = [
  {COND: "a !== 0 {{OP}} b !== 0"},
  {COND: "a === 1 || a === 2"},
  {COND: "a > 1024 * 1024"},
  {COND: "a === 'abc' || b === 'abc'"},
  {COND: "a === -1 || b === -1"},
  {COND: "a === +1 && b === +1"},
  {COND: "a === -0x020 && b === -0x020"},
  {COND: "this > a || this < b"}
];

const invalidConditions = [
  {COND: "a > b || b < a", M: "a>b"},
  {COND: "a {{OP}} a", M: "a"},
  {COND: "a() {{OP}} a()", M: "a()"},
  {COND: "a.b {{OP}} a.b", M: "a.b"},
  {COND: "a + b {{OP}} a + b", M: "a+b"},
  {COND: "a.b() > 3 || a.b() < 5", M: "a.b()"}
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
      {message: "{{M}} are duplicated"}
    ]
  },
  {
    code:
      "var a = ({{COND}}) ? b : c;",
    errors: [
      {message: "{{M}} are duplicated"}
    ]
  },
  {
    code:
      "if({{COND}}) { c = d; }",
    errors: [
      {message: "{{M}} are duplicated"}
    ]
  }
];

const ruleTester = new RuleTester({env: {es6: true}});
ruleTester.run("no-cond-with-dups", rule, {
  valid: j
    .setTemplates(validTestTemplates)
    .createCombos(["code"], validConditions)
    .useCombosAsTemplates()
    .createCombos(["code"], operators)
    .uniqueCombos()
    .getCombos(),
  invalid: j
    .setTemplates(invalidTestTemplates)
    .createCombos(["code", "errors.0.message"], invalidConditions)
    .useCombosAsTemplates()
    .createCombos(["code"], operators)
    .uniqueCombos()
    .getCombos()
});