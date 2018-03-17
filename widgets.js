const graphlib = require('graphlib');

const { wrap } = require('./utils/object-utils');
const Counter = require('./utils/counter');

// returns an array of the names of the widgets that are not children
function getPages(widgets) {
  const pageNames = new Set(Object.keys(widgets));
  Object.keys(widgets).forEach((widgetName) => {
    const widget = widgets[widgetName];
    widget.children.forEach((child) => {
      pageNames.delete(child.name);
    });
  });
  return Array.from(pageNames);
}

// given widgets object, returns widget names in topologically sorted order
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
  return graphlib.alg.topsort(graph).reverse(); // want base widgets first
}

// takes an object mapping widget names to widget objects
// returns a new object where widget objects now have the property localID
// no two objects in the same children array have the same localID
// new objects maintain a view of original widget objects
function uniqifyLocally(widgets) {
  const newWidgets = {};
  const counter = new Counter();
  topologicallySort(widgets).forEach((widgetName) => {
    // set localID for each child
    const children = widgets[widgetName].children.map((child) => {
      const number = counter.count(child.name);
      const newChild = newWidgets[child.name];
      newChild.localID = `${child.name}-${number}`;
      return newChild;
    });
    // new object has new children and a number field
    const newProps = {
      children,
      localID: `${widgetName}-0`,
    };
    newWidgets[widgetName] = wrap(widgets[widgetName], newProps);
    counter.reset(); // only care about numbering within each child array
  });
  return newWidgets;
}

// starting from a base widget, returns a new widget where all children are
//   unique objects with unique 'globalID' values
// unique widget objects maintain views of their original widget objects
function uniqifyGlobally(widget, counter) {
  const counts = counter === undefined ? new Counter() : counter;
  const globalID = `${widget.name}-${counts.count(widget.name)}`;
  const children = widget.children.map(child => uniqifyGlobally(child, counts));
  return wrap(widget, { globalID, children });
}

module.exports = {
  getPages,
  uniqifyLocally,
  uniqifyGlobally,
  topologicallySort,
};
