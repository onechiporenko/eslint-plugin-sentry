"use strict";

var rule = require("../../../lib/rules/no-eq-left-right.js"),
  RuleTester = require("eslint").RuleTester;

var ruleTester = new RuleTester({env: {es6: true}});

var Jsonium = require("jsonium");
var j = new Jsonium();
var m = "Expressions parts look like the same";

var independentFromSideOperators = [
  {OPERATOR: "==="},
  {OPERATOR: "=="},
  {OPERATOR: "!=="},
  {OPERATOR: "!="}
];

var notSwappableOperators = [
  {OPERATOR: "-"},
  {OPERATOR: "/"},
  {OPERATOR: "%"},
  {OPERATOR: ">>"},
  {OPERATOR: "<<"},
  {OPERATOR: "in"},
  {OPERATOR: "instanceof"}
];

var notSwappableBinaries = [
  {BINARY: "a {{OPERATOR}} b && b {{OPERATOR}} a"},
  {BINARY: "(a {{OPERATOR}} b) || (b {{OPERATOR}} a)"}
];

var dependentFromSideOperators = [
  {OPERATOR1: ">", OPERATOR2: "<"},
  {OPERATOR1: ">=", OPERATOR2: "<="},
  {OPERATOR1: "<", OPERATOR2: ">"},
  {OPERATOR1: "<=", OPERATOR2: ">="}
];

var validBinaries = [
  {BINARY: "a {{OPERATOR}} b"}, // single logical expression
  {BINARY: "a instanceof b {{OPERATOR}} b instanceof c"}, // instanceof
  {BINARY: "myFunc(a, c) {{OPERATOR}} b && b {{OPERATOR}} myFunc(a, d)"}, // not equal function arguments
  {BINARY: "myFunc(a, c) {{OPERATOR}} b && myFunc(a, d) {{OPERATOR}} b"}, // swapped not equal function arguments
  {BINARY: "a {{OPERATOR}} b && !a {{OPERATOR}} b"}, // AND inversion
  {BINARY: "(a {{OPERATOR}} b) || (!a {{OPERATOR}} b)"}, // OR inversion
  {BINARY: "a {{OPERATOR}} b && !b {{OPERATOR}} a"}, // AND inversion 2
  {BINARY: "(a {{OPERATOR}} b) || (!b {{OPERATOR}} a)"} // OR inversion 2
];
validBinaries = j
  .setTemplates(validBinaries)
  .createCombos(["BINARY"], independentFromSideOperators)
  .getCombos();
validBinaries = j
  .setTemplates(notSwappableBinaries)
  .createCombos(["BINARY"], notSwappableOperators)
  .concatCombos(validBinaries)
  .getCombos();


var ab = [
  {A: "a", B: "b"},
  {A: "a.b.c", B: "x.y.z"},
  {A: "'some string'", B: "b"},
  {A: "myFunc(a, c)", B: "b"},
  {A: "myFunc('a', 'c')", B: "b"},
  {A: "this.get(a, 'c')", B: "b"},
  {A: "typeof a", B: "b"},
  {A: "!a", B: "b"},
  {A: "~a", B: "b"},
  {A: "a('a').b('b')", B: "b('a').a('a')"}
];

var invalidWithIndependentBinaries = [
  {BINARY: "{{A}} {{OPERATOR}} {{A}}", TYPE: "BinaryExpression"}, // comparison itself
  {BINARY: "{{A}} {{OPERATOR}} {{B}} && {{A}} {{OPERATOR}} {{B}}", TYPE: "LogicalExpression"}, // AND
  {BINARY: "(({{A}} {{OPERATOR}} {{B}})) && (({{A}} {{OPERATOR}} {{B}}))", TYPE: "LogicalExpression"}, // extra paren
  {BINARY: "({{A}} {{OPERATOR}} {{B}}) || ({{A}} {{OPERATOR}} {{B}})", TYPE: "LogicalExpression"}, // OR
  {BINARY: "({{A}} {{OPERATOR}} {{B}}) && {{A}} {{OPERATOR}} {{B}}", TYPE: "LogicalExpression"}, // AND with paren
  {BINARY: "{{A}} {{OPERATOR}} {{B}} && ({{A}} {{OPERATOR}} {{B}})", TYPE: "LogicalExpression"}, // AND with paren 2
  {BINARY: "{{A}} {{OPERATOR}} {{B}} && {{B}} {{OPERATOR}} {{A}}", TYPE: "LogicalExpression"}, // swapped a, b
  {BINARY: "({{A}} {{OPERATOR}} {{B}}) && {{B}} {{OPERATOR}} {{A}}", TYPE: "LogicalExpression"}, // swapped a, b + AND with paren
  {BINARY: "{{A}} {{OPERATOR}} {{B}} && ({{B}} {{OPERATOR}} {{A}})", TYPE: "LogicalExpression"}, // swapped a, b + AND with paren 2
  {BINARY: "{{A}} {{OPERATOR}} {{B}} && C {{OPERATOR}} D && {{A}} {{OPERATOR}} {{B}}", TYPE: "LogicalExpression"}, // triple AND
  {BINARY: "({{A}} {{OPERATOR}} {{B}}) || (C {{OPERATOR}} D) || ({{A}} {{OPERATOR}} {{B}})", TYPE: "LogicalExpression"}, // triple OR
  {BINARY: "({{A}} {{OPERATOR}} {{B}} && C {{OPERATOR}} D) && {{A}} {{OPERATOR}} {{B}}", TYPE: "LogicalExpression"}, // triple AND with paren
  {BINARY: "{{A}} {{OPERATOR}} {{B}} && (C {{OPERATOR}} D && {{A}} {{OPERATOR}} {{B}})", TYPE: "LogicalExpression"}, // triple AND with paren 2
  {BINARY: "{{A}} {{OPERATOR}} {{B}} && {{A}} {{OPERATOR}} {{B}} && {{A}} {{OPERATOR}} {{B}}", TYPE: "LogicalExpression"} // triple AND 2
];
invalidWithIndependentBinaries = j
  .setTemplates(invalidWithIndependentBinaries)
  .createCombos(["BINARY"], ab)
  .uniqueCombos()
  .getCombos();

var invalidWithDependentBinaries = [
  {BINARY: "a {{OPERATOR1}} b && b {{OPERATOR2}} a", TYPE: "LogicalExpression"}
];
invalidWithDependentBinaries = j
  .setTemplates(invalidWithDependentBinaries)
  .createCombos(["BINARY"], dependentFromSideOperators)
  .getCombos();

var invalidBinaries = j
  .setTemplates(invalidWithIndependentBinaries)
  .createCombos(["BINARY"], independentFromSideOperators)
  .concatCombos(invalidWithDependentBinaries)
  .getCombos();

var cases = [
  {CODE: "{{BINARY}};"}
];

var validTestTemplates = [
  {
    code:
      "{{CODE}}"
  }
];

var invalidTestTemplates = [
  {
    code:
      "{{CODE}}",
    errors: [
      {message: m, type: "{{TYPE}}"}
    ]
  }
];

ruleTester.run("no-eq-left-right", rule, {
  valid: j
    .setTemplates(validTestTemplates)
    .createCombos(["code"], cases)
    .useCombosAsTemplates()
    .createCombos(["code"], validBinaries)
    .getCombos(),
  invalid: j
    .setTemplates(invalidTestTemplates)
    .createCombos(["code"], cases)
    .useCombosAsTemplates()
    .createCombos(["code", "errors.0.type"], invalidBinaries)
    .getCombos()
});