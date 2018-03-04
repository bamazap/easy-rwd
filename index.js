#!/usr/bin/env node
const fileio = require('./fileio');
const widgetUtils = require('./widgets');
const htmlcss = require('./htmlcss');
const layoutUtils = require('./layout');
const algorithms = require('./algorithms');

function build(file) {
  // read & process inputs
  const widgets = widgetUtils.uniqifyLocally(fileio.readIn(file));
  const userStyles = fileio.readCSS();
  const head = fileio.readHead();
  const appName = file.substr(0, file.lastIndexOf('.'));

  // assemble generated widgets from bottom of widget tree up
  widgetUtils.topologicallySort(widgets).forEach((widgetName) => {
    const widget = widgets[widgetName];
    if (widget.children.length > 0) {
      widget.html = htmlcss.buildWidgetHTML(widget);
      widget.layouts = layoutUtils.createLayouts(widget, algorithms.layoutV1);
      widget.width = layoutUtils.widthOfLayouts(widget.layouts);
      widget.height = layoutUtils.heightOfLayouts(widget.layouts, widget.width);
    }
  });

  // output CSS and HTML for each top-level (page) widget
  widgetUtils.getPages(widgets).forEach((pageName) => {
    const page = widgetUtils.uniqifyGlobally(widgets[pageName]);
    const html = htmlcss.pageHTML(page, appName, head);
    const css = htmlcss.pageCSS(page) + userStyles;
    fileio.writeOut(pageName, html, css);
  });
}

module.exports = build;
