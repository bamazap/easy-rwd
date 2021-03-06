const { Layout } = require('../layout');
const range = require('../utils/range');

// this version is not meant to be very intelligent
// does a simple left to right, row by row approach
// TODO: consider existing constraints
function leftJustified(parent, widthAlg, widthAvailable) {
  const layout = new Layout(parent, widthAlg);
  let thisRowWidth = 0;
  let lastRow = [];
  let thisRow = [];
  parent.children.forEach((child) => {
    const childMinWidth = range.rangeMin(child.width);
    if (thisRowWidth + childMinWidth > widthAvailable) {
      thisRowWidth = 0;
      lastRow = thisRow;
      thisRow = [];
    }
    thisRowWidth += childMinWidth;
    if (thisRow.length > 0) {
      layout.addRight(thisRow[thisRow.length - 1], child.localID);
    }
    thisRow.push(child.localID);
    lastRow.forEach(widgetID => layout.addBelow(widgetID, child.localID));
  });
  return layout;
}

module.exports = leftJustified;
