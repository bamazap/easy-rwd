const graphlib = require('graphlib');

const arrUtils = require('./utils/array-utils');
const range = require('./utils/range');
const Breakpoints = require('./utils/breakpoints');

const maxScreenWidth = 1920;

class Layout {
  constructor(widgetArr, widthAlg) {
    // represent with two graphs
    this.right = new graphlib.Graph();
    this.down = new graphlib.Graph();

    this.widgetsByLocalID = {};

    this.widthAlg = widthAlg;

    this.widthMemo = null;
    this.widthAssignmentsMemo = null;
    this.maximumWidth = Infinity;

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
    if (!graph1.nodes().reduce((b, node) => b && graph2.hasNode(node), true)) {
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
    this.widthMemo = null;
    this.widthAssignmentsMemo = null;
    this.right.setEdge(onLeft, onRight);
  }

  // add a widget B is below widget A relation
  addBelow(above, below) {
    this.widthMemo = null;
    this.widthAssignmentsMemo = null;
    this.down.setEdge(above, below);
  }

  // returns a range including the possible widths of the layout
  get width() {
    if (this.widthMemo !== null) {
      return this.widthMemo;
    }

    this.widthMemo = this.calculateWidth();
    return this.widthMemo;
  }

  // returns an array of [minWidth, widthAssignments] pairs
  get widthAssignments() {
    if (this.widthAssignmentsMemo !== null) {
      return this.widthAssignmentsMemo;
    }

    this.widthAssignmentsMemo = this.widthAlg(
      this.right,
      this.widgetsByLocalID,
      this.width
    );
    return this.widthAssignmentsMemo;
  }

  get maxWidth() {
    return this.maximumWidth;
  }

  set maxWidth(maxWidth) {
    this.widthMemo = null;
    this.widthAssignmentsMemo = null;
    this.maximumWidth = maxWidth;
  }

  // calculates the height of the layout for a given width
  height(width) {
    const widthAssignments = this.widthAssignments.find(width).data;

    const heightOfWidget = localID => this.widgetsByLocalID[localID]
      .height(widthAssignments[localID]);

    const recursiveStep = (localID) => {
      // the widgets directly below this one
      const localIDsOfWidgetsBelow = this.down.successors(localID);

      // base case: if there are no widgets below you, return your height
      if (localIDsOfWidgetsBelow.length === 0) {
        return heightOfWidget(localID);
      }

      // recursively calculate the height of all widgets below this one
      const belowHeight = localIDsOfWidgetsBelow
        .map(belowLocalID => recursiveStep(belowLocalID))
        .reduce((maxHeight, height) => Math.max(maxHeight, height));
      // return the added height of this widget and the ones below it
      return heightOfWidget(localID) + belowHeight;
    };

    // call the recursive function on all widgets on the very top
    // and determine the overall height of the widget
    return this.down.sources()
      .map(localID => recursiveStep(localID))
      .reduce((maxHeight, height) => Math.max(maxHeight, height));
  }

  // calculates the range containing all possible widths of this widget
  calculateWidth() {
    // function to recursively calculate width
    const recursiveStep = (localID) => {
      // the widgets directly on the right of this one
      const localIDsOfWidgetsOnRight = this.right.successors(localID);

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
    const width = this.right.sources()
      .map(localID => recursiveStep(localID))
      .reduce((maxWidth, w) => range.maxRanges(maxWidth, w));
    return range.clipRange(width, Number.NEGATIVE_INFINITY, this.maximumWidth);
  }

  toString() {
    return `right: \n${
      this.right.edges()
        .map(({ v, w }) => `  ${v} -> ${w}\n`)
        .reduce((a, b) => a + b, '')
    }down:\n${
      this.down.edges()
        .map(({ v, w }) => `  ${v} -> ${w}\n`)
        .reduce((a, b) => a + b, '')
    }`;
  }
}

// creates layouts with breakpoints for a widget
// ouput is a ResponsiveLayout: array of number, Layout pairs
//   the number specifies the minimum width for which the layout is valid
function createLayouts(widget, layoutAlg, widthAlg) {
  const responsiveLayout = new Breakpoints(true);
  let lastLayout = null;
  arrUtils.range(maxScreenWidth + 1).forEach((i) => {
    const newLayout = layoutAlg(widget, i, widthAlg);
    if (lastLayout === null || !newLayout.equals(lastLayout)) {
      if (lastLayout !== null) lastLayout.maxWidth = i - 1;
      lastLayout = newLayout;
      responsiveLayout.add(i, newLayout);
    }
  });
  return responsiveLayout;
}

// given a layout breakpoints
// return a single width range which contains its possible widths
function widthOfLayouts(layouts) {
  return layouts
    .map((bp) => {
      const maxWidth = bp.next ? bp.next.minValue - 1 : Infinity;
      return range.clipRange(bp.data.calculateWidth(), bp.minValue, maxWidth);
    })
    .reduce((totalWidth, width) => range.unionRanges(totalWidth, width));
}

// given a layouts array (of [minWidth, Layout] length-2 arrays)
// return a range function which maps each value in the width range to a height
// can optionally provide the width range to save computation
function heightOfLayouts(layouts, widthR) {
  const width = widthR === undefined ? widthOfLayouts(layouts) : widthR;
  const responsiveHeight = new Breakpoints(true);
  let breakpoint = layouts.find(range.rangeMin(width));
  let lastHeight = null;
  range.rangeForEach(width, (w) => {
    while (breakpoint.next && breakpoint.next.minValue <= w) {
      breakpoint = breakpoint.next;
    }
    const newHeight = breakpoint.data.height(w);
    if (lastHeight === null || lastHeight !== newHeight) {
      lastHeight = newHeight;
      responsiveHeight.add(w, newHeight);
    }
  });
  return w => responsiveHeight.find(w).data;
}

module.exports = {
  Layout,
  createLayouts,
  widthOfLayouts,
  heightOfLayouts,
};
