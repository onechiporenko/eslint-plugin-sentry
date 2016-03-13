/**
 * @fileoverview
 * @author Ian VanSchooten
 * @copyright 2016 Ian VanSchooten. All rights reserved.
 * See LICENSE in root directory for full license.
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var c = require("../../../lib/utils/collections.js");
var expect = require("chai").expect;

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

describe("collections", function () {

  describe("#intersect", function () {

    [
      {
        v1: [{code: "a==1", operator: "&&"}],
        v2: [{code: "a==1", operator: "&&"}, {code: "a==2", operator: "&&"}],
        e: [{code: "a==1", operator: "&&"}]
      },
      {
        v1: [{code: "a==1", operator: ""}],
        v2: [{code: "a==1", operator: "&&"}, {code: "a==2", operator: "&&"}],
        e: [{code: "a==1", operator: ""}]
      },
      {
        v1: [{code: "a==1", operator: "&&"}],
        v2: [{code: "a==1", operator: ""}],
        e: [{code: "a==1", operator: "&&"}]
      },
      {
        v1: [{code: "a==1", operator: ""}],
        v2: [{code: "a==1", operator: ""}],
        e: [{code: "a==1", operator: ""}]
      },
      {
        v1: [{code: "a==1", operator: "&&"}],
        v2: [{code: "a==1", operator: "||"}, {code: "a==2", operator: "||"}],
        e: []
      }
    ].forEach(function (test, index) {
        it(index, function () {
          expect(c.intersect(test.v1, test.v2)).to.be.eql(test.e);
        });
    });

  });

});