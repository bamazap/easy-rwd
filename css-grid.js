const graphlib = require('graphlib');

// constraints is a DAG
// sizes is an object {[widget: string]: number}
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
    assignments[widget] = getAssignment(columns, position, size);
    spans[widget] = getSpan(columns, position, size);
  });
  return { assignments, spans };
}

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

function getAssignment(columns, position, size) {
  return columns.filter(c => (c <= position)).length;
}

function getSpan(columns, position, size) {
  return columns.filter(c => (c >= position && c < position + size)).length;
}

module.exports = {
  calculateGridCells,
};
