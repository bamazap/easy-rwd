const graphlib = require('graphlib');

const utils = require('./utils');
const range = require('./range');

class Layout {
  constructor(widgetArr) {
    // represent with two graphs
    this.right = new graphlib.Graph();
    this.down = new graphlib.Graph();

    this.widgetsByLocalID = {};

    // add nodes to the graphs representing widgets
    widgetArr.forEach((widget) => {
      this.right.setNode(widget.localID);
      this.down.setNode(widget.localID);
      this.widgetsByLocalID[widget.localID] = widget;
    });
  }

  // determines if two graphs used as state in this class are equal
  // note that this does not work on Graph instances in general
  static equalGraphs(graph1, graph2) {
    // node counts and edge counts must be the same
    if (graph1.nodeCount() !== graph2.nodeCount()) return false;
    if (graph1.edgeCount() !== graph2.edgeCount()) return false;
    // node ids must be the same
    if (!graph1.edges().reduce((b, node) => b && graph2.hasNode(node), true)) {
      return false;
    }
    // edges must be between the same nodes
    if (!graph1.edges().reduce((b, edge) => b && graph2.hasEdge(edge), true)) {
      return false;
    }
    return true;
  }

  // determines if another layout object l is equal to this one
  equals(otherLayout) {
    return (
      Layout.equalGraphs(this.right, otherLayout.right) &&
      Layout.equalGraphs(this.down, otherLayout.down)
    );
  }

  // add a widget B is on the right of widget A relation
  addRight(onLeft, onRight) {
    this.right.setEdge(onLeft, onRight);
  }

  // add a widget B is below widget A relation
  addBelow(above, below) {
    this.down.setEdge(above, below);
  }

  // calculates the range containing all possible widths of this widget
  calculateWidth() {
    // function to recursively calculate width
    const recursiveStep = (localID) => {
      // the widgets directly on the right of this one
      const localIDsOfWidgetsOnRight = this.right.successors();
      // base case: if there are no widgets on the right, return your width
      if (localIDsOfWidgetsOnRight.length === 0) {
        return this.widgetsByLocalID[localID].width;
      }
      // recursively calculate the width of all widgets on this one's right
      // and determine the range of possible overall widths for the right
      const rightWidth = localIDsOfWidgetsOnRight
        .map(rightLocalID => recursiveStep(rightLocalID))
        .reduce((maxWidth, width) => range.maxRanges(maxWidth, width));
      // return the added with of this widget and the ones on its right
      return range.addRanges(this.widgetsByLocalID[localID].width, rightWidth);
    };

    // call the recursive function on all widgets on the far left
    // and determine the range of possible overall widths
    return this.right.sources()
      .map(localID => recursiveStep(localID))
      .reduce((maxWidth, width) => range.maxRanges(maxWidth, width));
  }
}

// simply produces a layout
// this version is not really meant to optimize anything
function layoutV1(parent, w) {
  const layout = new Layout(parent.children);
  let x = 0;
  let lastRow = [];
  let thisRow = [];
  parent.children.forEach((child) => {
    if (x + child.width[0][0] >= w) {
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

// creates layouts with breakpoints for a widget
// ouput is a ResponsiveLayout: array of number, Layout pairs
//   the number specifies the minimum width for which the layout is valid
function createLayouts(widget, layoutAlg = layoutV1) {
  const responsiveLayout = [];
  let lastLayout = null;
  let newLayout = null;
  utils.range(1921).forEach((i) => {
    newLayout = layoutAlg(widget, i);
    if (lastLayout === null || !newLayout.equals(lastLayout)) {
      lastLayout = newLayout;
      responsiveLayout.push([i, newLayout]);
    }
  });
  return responsiveLayout;
}

// given a layouts array (of [minWidth, Layout] length-2 arrays)
// return a single width range which contains its possible widths
function widthOfLayouts(layouts) {
  return layouts
    .map(([minWidth, layout], i) => {
      const maxWidth = i + 1 < layouts.width ? layouts[i][0] - 1 : Infinity;
      return range.clipRange(layout.calculateWidth(), minWidth, maxWidth);
    })
    .reduce((totalWidth, width) => range.unionRanges(totalWidth, width));
}

module.exports = {
  createLayouts,
  widthOfLayouts,
};
