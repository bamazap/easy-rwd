const graphlib = require('graphlib');

// returns an array of the widgets that are not children
function getPages(widgets) {
  const pageNames = new Set(Object.keys(widgets));
  Object.keys(widgets).forEach((widgetName) => {
    const widget = widgets[widgetName];
    widget.children.forEach((child) => {
      pageNames.delete(child.name);
    });
  });
  return [...pageNames].map(pageName => widgets[pageName]);
}

// given widgets object, returns widgets in topologically sorted order
// that is, every widget is listed before every widget that contains it
function topologicallySort(widgets) {
  const graph = new graphlib.Graph();
  Object.keys(widgets).forEach((widgetName) => {
    graph.setNode(widgetName);
  });
  Object.keys(widgets).forEach((widgetName) => {
    const widget = widgets[widgetName];
    widget.children.forEach((child) => {
      graph.setEdge(widget.name, child.name);
    });
  });
  const order = graphlib.alg.topsort(graph);
  order.reverse(); // want base widgets first
  return order.map(widgetName => widgets[widgetName]);
}

// starting from a base widget, returns a new widget where all children are
//   unique objects with unique 'id' values
// assumes children have been linked
// note that this returns a new object; it does not mutate
function uniqify(widget) {
  const uniqueWidget = Object.assign({}, widget);
  if (uniqify.d[uniqueWidget.name] === undefined) {
    uniqify.d[uniqueWidget.name] = 0;
  }
  uniqify.d[uniqueWidget.name] += 1;
  uniqueWidget.id = `${uniqueWidget.name}-${uniqify.d[uniqueWidget.name]}`;
  if (uniqueWidget.children.length) {
    uniqueWidget.children = uniqueWidget.children.map(uniqify);
  }
  return uniqueWidget;
}
uniqify.d = {}; // function state

module.exports = {
  getPages,
  uniqify,
  topologicallySort,
};
