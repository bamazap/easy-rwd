const { minObjRows } = require('./utils/alg-utils');

function minHeight(widget, widthAlg, widthAvailable) {
  const heightOfLayout = layout => layout.height(widthAvailable);
  return minObjRows(widget, widthAlg, widthAvailable, heightOfLayout);
}

module.exports = minHeight;
