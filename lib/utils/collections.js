/**
 * Get intersection of the two collections
 * Their items code and operators should be the same
 * Only code is checked if some of the operators is empty
 * Example:
 * <pre>
 *   var a = [{code: "a==1", operator: "&&"}];
 *   var b = [{code: "a==1", operator: "&&"}];
 *   intersect(a, b); // [{code: "a==1", operator: "&&"}]
 *
 *   a = [{code: "a==1", operator: "||"}];
 *   b = [{code: "a==1", operator: "&&"}];
 *   intersect(a, b); // []
 *
 *   a = [{code: "a==1", operator: ""}];
 *   b = [{code: "a==1", operator: "&&"}];
 *   intersect(a, b); // [{code: "a==1", operator: "&&"}]
 * </pre>
 *
 * @param {{code: string, operator: string}[]} v1
 * @param {{code: string, operator: string}[]} v2
 * @returns {boolean}
 */
function intersect(v1, v2) {
  return v1.filter(function (v1Item) {
    return v2.filter(function (v2Item) {
        return v1Item.code === v2Item.code && (v1Item.operator === v2Item.operator || !v1Item.operator || !v2Item.operator);
      }).length !== 0;
  });
}

module.exports = {

  intersect: intersect
};