var tsort = require('tsort');

// adds a name field to each widget (so each widget knows its key)
var addNameProperty = function(widgets) {
  Object.keys(widgets).forEach(function(widgetName) {
    widgets[widgetName]['name'] = widgetName;
  });
}

// replaces names in all children widgets with references to actual widgets
var linkChildren = function(widgets) {
  Object.keys(widgets).forEach(function(widgetName) {
    widgets[widgetName]['children'].forEach(function(childOrChildName, i) {
      if (typeof childOrChildName === 'string') {
        widgets[widgetName]['children'][i] = widgets[childOrChildName];
      }
    });
  });
}

// adds a field 'page' to each widget in widgets object
// value is a boolean saying if the widget is not contained in any other widget
// assumes linkChildren has been called on the input
var markPages = function(widgets) {
  Object.keys(widgets).forEach(function(widgetName) {
    widgets[widgetName]['page'] = true;
  });
  Object.keys(widgets).forEach(function(widgetName) {
    widgets[widgetName]['children'].forEach(function(child, i) {
        child['page'] = false;
    });
  });
}

// doea a few nice mutations on the widgets object
//   adds a name property to each widget
//   replaces names in children arrays to references to child objects
//   adds a page property to each widget, specifying which are top-level
var processWidgets = function(widgets) {
  addNameProperty(widgets);
  linkChildren(widgets);
  markPages(widgets);
}

// given widget object (linked or not) returns widget names in order
// that is, every widget is listed before every widget that contains it
var topologicallySort = function(widgets) {
  var graph = tsort();
  Object.keys(widgets).forEach(function(widgetName) {
    widgets[widgetName]['children'].forEach(function(childOrChildName, i) {
      if (typeof childOrChildName === 'string') {
        graph.add(widgetName, childOrChildName);
        widgets[childOrChildName]['page'] = false;
      } else {
        graph.add(widgetName, childOrChildName['name']);
        childOrChildName['page'] = false;
      }
    });
  });
  var order = graph.sort();
  order.reverse(); // want base widgets first
  return order;
}

// starting from a base widget, returns a new widget where all children are
//   unique objects with unique 'id' values
// assumes children have been linked
// note that this returns a new object; it does not mutate
var uniqify = function(widget) {
  var w = Object.assign({}, widget);
  if (uniqify.d[w['name']] === undefined) {
    uniqify.d[w['name']] = 0;
  }
  uniqify.d[w['name']] += 1;
  w['id'] = `${w['name']}-${uniqify.d[w['name']]}`;
  if (w['children'].length) {
    w['children'] = w['children'].map(uniqify);
  }
  return w
}
uniqify.d = {};

var widgets = {
  processWidgets: processWidgets,
  topologicallySort: topologicallySort,
  uniqify: uniqify,
}

module.exports = widgets;
