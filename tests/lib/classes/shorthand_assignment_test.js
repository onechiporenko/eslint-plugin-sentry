var ShorthandAssignment = require("../../../lib/classes/shorthand_assignment.js");
var expect = require("chai").expect;
var espree = require("espree");

function parseExpression(code) {
  return espree.parse(code).body[0].expression;
}


describe("#ShorthandAssignment", function () {

  describe("#parse", function () {

    [
      {
        c: "a =+ b;",
        e: true
      },
      {
        c: "a =+\tb;",
        e: true
      },
      {
        c: "a =+b;",
        e: false
      },
      {
        c: "a = +b;",
        e: false
      },
      {
        c: "a =- b;",
        e: true
      },
      {
        c: "a =-\tb;",
        e: true
      },
      {
        c: "a =-b;",
        e: false
      },
      {
        c: "a = -b;",
        e: false
      }
    ].forEach(function (test) {
      it(test.c, function () {
        var code = parseExpression(test.c);
        var assignment = new ShorthandAssignment(code);
        expect(assignment.parse()).to.be.equal(test.e);
      });
    });

  });

});