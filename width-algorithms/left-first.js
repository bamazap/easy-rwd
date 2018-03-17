const range = require('../utils/range');

// FIXME: update to be in line with new return value
// this version is not meant to be very intelligent
// widgets on the left are given width first
function leftFirst(layout, widthAvailable) {
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

module.exports = leftFirst;
