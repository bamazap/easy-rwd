#!/usr/bin/env node
const fileio = require('./fileio');
const widgetUtils = require('./widgets');
const htmlcss = require('./htmlcss');
const layoutUtils = require('./layout');

function build(file) {
  let widgets = fileio.readIn(file);
  const userStyles = fileio.readCSS();
  const head = fileio.readHead();

  const appName = file.substr(0, file.lastIndexOf('.'));

  widgets = widgetUtils.uniqifyLocally(widgets);

  widgetUtils.topologicallySort(widgets).forEach((widgetName) => {
    const widget = widgets[widgetName];
    if (!widget.html) {
      widget.html = htmlcss.buildWidgetHTML(widget);
      widget.layouts = layoutUtils.createLayouts(widget);
      // TODO: calculate sizes of generated widgets
    }
  });

  widgetUtils.getPages(widgets).forEach((pageName) => {
    const page = widgets[pageName];
    const html = htmlcss.pageHTML(page, appName, head);
    const css = userStyles; // TODO: generate CSS
    fileio.writeOut(page.name, html, css);
  });
}

module.exports = build;
