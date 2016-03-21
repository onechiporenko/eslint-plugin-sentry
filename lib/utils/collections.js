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

function areEqual (a1, a2) {
  if (a1.length !== a2.length) {
    return false;
  }
  for (var i = 0; i < a1.length; i++) {
    if (a1[i] !== a2[i]) {
      return false;
    }
  }
  return true;
}

function isSubSet (a1, a2) {
  if (a2.length > a1.length) {
    return false;
  }
  for (var i = 0; i < a2.length; i++) {
    if (a1.indexOf(a2[i]) === -1) {
      return false;
    }
  }
  return true;
}

module.exports = {

  intersect: intersect,
  areEqual: areEqual,
  isSubSet: isSubSet
};