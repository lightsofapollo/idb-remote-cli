/**
 *    var list = ['one', 'two'];
 *
 *    var result = sortAndRank(list, function(item) {
 *      return item.indexOf('w');
 *    });
 *
 *    // result => ['two']
 */
function sortAndRank(list, prefix, callback) {
  if (typeof prefix === 'function') {
    callback = prefix;
    prefix = '';
  }

  var i = 0;
  var len = list.length;
  var items = [];

  for (; i < len; i++) {
    var rank = callback(list[i]);
    // rank == null because undefined == null
    if (rank === -1 || null == rank)
      continue;

    if (rank === 0)
      return [prefix + list[i]];

    items.push([rank, list[i]]);
  }

  items = items.sort(function(a, b) {
    if (a[0] < b[0])
      return -1;

    if (a[0] > b[0])
      return 1;

    return 0;
  });

  return items.map(function(item) {
    // return the value not the rank
    return prefix + item[1];
  });
}

module.exports = sortAndRank;
