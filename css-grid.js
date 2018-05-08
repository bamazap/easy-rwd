const graphlib = require('graphlib');

function getPositions(constraints, sizes) {
  const positions = {};
  constraints.nodes().forEach((widget) => {
    positions[widget] = 0;
  });
  graphlib.alg.topsort(constraints).forEach((widget) => {
    constraints.predecessors(widget).forEach((parent) => {
      positions[widget] = Math.max(
        positions[widget],
        positions[parent] + sizes[parent]
      );
    });
  });
  return positions;
}

function getAssignment(columns, position) {
  return columns.filter(c => (c <= position)).length;
}

function getSpan(columns, position, size) {
  return columns.filter(c => (c >= position && c < position + size)).length;
}

// constraints is a DAG
// sizes is an object {[widget: string]: number}
// returns two objects mapping strings to numbers
// assignments says what cell (row/col) each widget is in
// spans says how many cells (rows/cols) each widget spans
function calculateGridCells(constraints, sizes) {
  const assignments = {};
  const spans = {};
  const positions = getPositions(constraints, sizes);
  const columns = Array
    .from(new Set(Object.values(positions)))
    .sort((a, b) => a - b);
  constraints.nodes().forEach((widget) => {
    const size = sizes[widget];
    const position = positions[widget];
    assignments[widget] = getAssignment(columns, position);
    spans[widget] = getSpan(columns, position, size);
  });
  return { assignments, spans };
}

module.exports = {
  calculateGridCells,
};
