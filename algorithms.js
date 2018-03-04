const { Layout } = require('./layout');
const range = require('./range');

// WIDTH ALGORITHMS
// return a dictionary mapping each widget's localID to a width assignment

// this version is not meant to be very intelligent
// widgets on the left are given width first
function widthV1(layout, widthAvailable) {
  const expendableWidth = widthAvailable - layout.width[0][0];
  const allocations = {};

  const recursiveStep = (widgetLocalID) => {
    const widget = layout.widgetsByLocalID[widgetLocalID];
    const canAllocate = widget.width[0][0] + expendableWidth;
    const allocation = range.rangeFloor(widget.width, canAllocate);
    allocations[widget.localID] = allocation;
    layout.right.successors(widget.localID).forEach(recursiveStep);
  };

  layout.right.sources().forEach(recursiveStep);
  return allocations;
}


// LAYOUT ALGORITHMS
// return a Layout object

// this version is not meant to be very intelligent
// does a simple left to right, row by row approach
function layoutV1(parent, widthAvailable, widthAlg = widthV1) {
  const layout = new Layout(parent.children, widthAlg);
  let x = 0;
  let lastRow = [];
  let thisRow = [];
  parent.children.forEach((child) => {
    if (x + child.width[0][0] >= widthAvailable) {
      x = 0;
      lastRow = thisRow;
      thisRow = [];
    } else {
      layout.addRight(thisRow[thisRow.length - 1], child.id);
    }
    thisRow.push(child.id);
    lastRow.forEach(widgetID => layout.addBelow(widgetID, child.id));
  });
  return layout;
}

// TODO: write better algorithms

module.exports = {
  layoutV1,
  widthV1,
};
