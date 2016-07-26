var RedundantCondition = require("../../../lib/classes/redundant_condition.js");
var expect = require("chai").expect;
var espree = require("espree");

function parseExpression(code) {
  return espree.parse(code).body[0].expression;
}


describe("#RedundantCondition", function () {

  describe("#checkTruthTableForRedundantConditions", function () {

    [
      {c: "a", e: []},
      {c: "a && b", e: []},
      {c: "a && b || a", e: ["b"]},
      {c: "a && b && c || a", e: ["c", "b"]},
      {c: "a && b && c && d || a", e: ["d", "c", "b"]},
      {c: "a && b && c || a && b", e: ["c"]},
      {c: "a && b && c && d || a && b", e: ["d", "c"]},
      {c: "a && b && (c || d) || a && b", e: ["d", "c"]},
      {c: "a && (b || c || d) || a", e: ["d", "c", "b"]}
    ].forEach(function (test) {
      it(test.c, function () {
        var code = parseExpression(test.c);
        var condition = new RedundantCondition(code);
        expect(condition.parse()).to.be.eql(test.e);
      });
    });

  });

});