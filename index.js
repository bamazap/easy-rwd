#!/usr/bin/env node
var fileio = require('./fileio');
var widgetUtils = require('./widgets');
var htmlcss = require('./htmlcss');

var build = function(file) {
  var widgets = fileio.readIn(file);
  var userStyles = fileio.readCSS();
  var head = fileio.readHead();

  widgetUtils.processWidgets(widgets);

  var appName = file.substr(0, file.lastIndexOf('.'));

  Object.keys(widgets).forEach(function(widgetName) {
    if (widgets[widgetName]['page'] === true) {
      var page = widgetUtils.uniqify(widgets[widgetName]);
      var html = htmlcss.buildPageHTML(page, appName, head);
      var css = ''; // TODO
      fileio.writeOut(page['name'], html, css);
    }
  });
}

module.exports = build;
