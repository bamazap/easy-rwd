// for use with instances of Graph from graphlib
// which represent a DAG

// return an object mapping node names to longest-path lengths from any source
function longestPathDAG(dag) {
  const pathLengths = {};
  const recursiveStep = (node) => {
    dag.successors(node).forEach((successor) => {
      pathLengths[successor] = Math.max(
        (pathLengths[successor] || 0),
        pathLengths[node] + 1
      );
      recursiveStep(successor);
    });
  };

  dag.sources().forEach((source) => {
    pathLengths[source] = 0;
    recursiveStep(source);
  });
  return pathLengths;
}

// return: string[][]
function sourceToSinkPaths(dag) {
  const recursiveStep = (node) => {
    const successors = dag.successors(node);
    if (successors.length === 0) return [[node]];
    return successors.map(suc =>
      [].concat(...recursiveStep(suc).map(leg => [node].concat(leg))));
  };
  return [].concat(...dag.sources().map(recursiveStep));
}

module.exports = {
  longestPathDAG,
  sourceToSinkPaths,
};
