const espree = require("espree");

function parseExpression(code) {
  return espree.parse(code).body[0].expression;
}

module.exports = {
  parseExpression
};