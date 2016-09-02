/**
 * Detect nodes that represent -1, +2, -0x020
 *
 * @param {ASTNode} node
 * @return {boolean}
 */
function isNumberWithSign(node) {
  return node.type === "UnaryExpression" && ["+", "-"].indexOf(node.operator) !== -1 && node.argument.type === "Literal";
}

module.exports = {
  isNumberWithSign: isNumberWithSign
};