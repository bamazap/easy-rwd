const graphlib = require('graphlib');

const { wrap } = require('./utils/object-utils');
const Counter = require('./utils/counter');

// returns the number of widgets in a list that are pages
//   i.e. not children of any other widgets in the list
function countPages(widgets) {
  const pageNames = new Set(widgets.map(widget => widget.name));
  widgets.forEach((widget) => {
    widget.children.forEach((child) => {
      pageNames.delete(child.name);
    });
  });
  return pageNames.size;
}

// returns widget names in topologically sorted order
// that is, every widget is listed before every widget that contains it
function topologicallySort(widgets) {
  const graph = new graphlib.Graph();
  Object.keys(widgets).forEach((widgetName) => {
    graph.setNode(widgetName);
  });
  Object.values(widgets).forEach((widget) => {
    widget.children.forEach((child) => {
      graph.setEdge(widget.name, child.name);
    });
  });
  // return sorted list (base widgets first)
  return graphlib.alg.topsort(graph).reverse().map(name => widgets[name]);
}

// takes an array of widget objects
// returns a new object where widget objects now have the property localID
// no two objects in the same children array have the same localID
// new objects maintain a view of original widget objects
function uniqifyLocally(widgetArray) {
  const counter = new Counter();
  widgetArray.forEach((widget) => {
    // set localID for each child
    widget.children = widget.children.map((child) => {
      const number = counter.count(child.name);
      const localID = `${child.name}-${number}`;
      return wrap(child, { localID });
    });
    counter.reset(); // only care about numbering within each child array
  });
  return widgetArray;
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
  countPages,
  uniqifyLocally,
  uniqifyGlobally,
  topologicallySort,
};
