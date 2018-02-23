const graphlib = require('graphlib');

const utils = require('./utils');

class Layout {
  constructor(widgetIDs) {
    // represent with two graphs
    this.right = new graphlib.Graph();
    this.down = new graphlib.Graph();

    // add nodes to the graphs representing widgets
    widgetIDs.forEach((widgetID) => {
      this.right.setNode(widgetID);
      this.down.setNode(widgetID);
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
}

// simply produces a layout
// this version is not really meant to optimize anything
function layoutV1(parent, w) {
  const layout = new Layout(parent.children.map(child => child.id));
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

function createLayouts(page) {
  const responsiveLayout = [];
  let lastLayout = null;
  let newLayout = null;
  utils.range(1920).forEach((i) => {
    newLayout = layoutV1(page, i);
    if (lastLayout && newLayout.equals(lastLayout)) {
      responsiveLayout[responsiveLayout.length - 1][0][1] = i;
    } else {
      lastLayout = newLayout;
      responsiveLayout.push([[i, i], newLayout]);
    }
  });
}

module.exports = createLayouts;
