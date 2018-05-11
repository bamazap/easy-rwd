const graphlib = require('graphlib');
const { Layout } = require('../../layout');
const { rangeMin } = require('../../utils/range');
const { range, product, powerSet } = require('../../utils/array-utils');

function isConnected(layout) {
  const graph = new graphlib.Graph();
  layout.down.nodes().forEach((node) => {
    graph.setNode(node);
  });
  ['down', 'right'].forEach((direction) => {
    layout[direction].edges().forEach((edge) => {
      graph.setEdge(edge);
    });
  });
  return graphlib.alg.components(graph).length === 1;
}

// finds a layout for a widget given the width available
//   which minimizes an objective function (which takes a candidate layout)
//   this minimizer considers all possible constraint combinations
function minObjAllPossible(widget, widthAlg, widthAvailable, objFunc) {
  let bestLayout = null;
  let bestLayoutComplexity = Infinity;
  let bestObjective = Infinity;

  const possibleConstraints = product(widget.children.map(c => c.localID));
  const possibleConstraintSets = powerSet(possibleConstraints);
  possibleConstraintSets.forEach((constraintSetB) => {
    possibleConstraintSets.forEach((constraintSetR) => {
      const layout = new Layout(widget, widthAlg);
      constraintSetB.forEach((constraintB) => {
        layout.addBelow(...constraintB);
      });
      if (!graphlib.alg.isAcyclic(layout.down)) return;

      constraintSetR.forEach((constraintR) => {
        layout.addRight(...constraintR);
      });
      if (!graphlib.alg.isAcyclic(layout.right)) return;

      if (!isConnected(layout)) return;

      const objective = objFunc(layout);
      const complexity = layout.right.edgeCount() + layout.down.edgeCount();
      if (
        objective < bestObjective || (
          objective === bestObjective &&
          complexity < bestLayoutComplexity
        )
      ) {
        bestObjective = objective;
        bestLayout = layout;
        bestLayoutComplexity = complexity;
      }
    });
  });
  // just vertically stack if we cannot satisfy constraints
  if (bestLayout === null) {
    bestLayout = new Layout(widget, widthAlg);
    range(widget.children.length - 1).forEach((i) => {
      bestLayout.addBelow(
        widget.children[i].localID,
        widget.children[i + 1].localID
      );
    });
  }
  return bestLayout;
}

function minObjRows(widget, widthAlg, widthAvailable, objFunc) {
  let bestLayout = null;
  let bestObjective = Infinity;
  let bestLayoutComplexity = Infinity;

  powerSet(range(widget.children.length - 1))
    .map(arr => new Set(arr))
    .forEach((newLines) => {
      const layout = new Layout(widget, widthAlg);
      let lastRow = []
      let thisRow = [widget.children[0].localID];
      range(1, widget.children.length).forEach((i) => {
        if (newLines.has(i - 1)) {
          lastRow = thisRow;
          thisRow = [];
        } else {
          layout.addRight(
            widget.children[i - 1].localID,
            widget.children[i].localID
          );
        }
        thisRow.push(widget.children[i].localID);
        lastRow.forEach((aboveID) => {
          layout.addBelow(aboveID, widget.children[i].localID);
        });
      });
      // cycles may happen if user constraints are used
      if (!graphlib.alg.isAcyclic(layout.right)) return;
      if (!graphlib.alg.isAcyclic(layout.down)) return;
      // skip width check if all widgets are vertically stacked
      if (
        newLines.size !== widget.children.length - 1 &&
        rangeMin(layout.width) > widthAvailable
      ) return;
      const objective = objFunc(layout);
      const complexity = layout.right.edgeCount() + layout.down.edgeCount();
      if (
        objective < bestObjective || (
          objective === bestObjective &&
          complexity < bestLayoutComplexity
        )
      ) {
        bestObjective = objective;
        bestLayout = layout;
        bestLayoutComplexity = complexity;
      }
  });
  return bestLayout
}

module.exports = {
  minObjAllPossible,
  minObjRows,
};
