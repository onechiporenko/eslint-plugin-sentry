const ast = require("../../../lib/utils/ast.js");
const expect = require("chai").expect;
const helper = require("../../helper.js");

describe("#ast", function () {

  describe("#isNumberWithSign", function () {

    [
      {
        c: "+1",
        e: true
      },
      {
        c: "+1.1",
        e: true
      },
      {
        c: "+0x20",
        e: true
      },
      {
        c: "+0x021",
        e: true
      },
      {
        c: "-1",
        e: true
      },
      {
        c: "-1.1",
        e: true
      },
      {
        c: "-0x20",
        e: true
      },
      {
        c: "-0x021",
        e: true
      },
      {
        c: "+a",
        e: false
      },
      {
        c: "+a.b",
        e: false
      },
      {
        c: "-a",
        e: false
      },
      {
        c: "-a.b",
        e: false
      }
    ].forEach(function (test) {
      it(JSON.stringify(test.c), function () {
        const code = helper.parseExpression(test.c);
        expect(ast.isNumberWithSign(code)).to.be.equal(test.e);
      });
    });

  });

});
