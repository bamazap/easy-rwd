#!/usr/bin/env node
const fileio = require('./fileio');
const widgetUtils = require('./widgets');
const layoutUtils = require('./layout');
const buildPageHTML = require('./html');
const buildPageCSS = require('./css');

function build(file, layoutAlg, widthAlg) {
  // read & process inputs
  const widgets = widgetUtils.uniqifyLocally(
    widgetUtils.topologicallySort(
      fileio.readIn(file)
    )
  );
  const userStyles = fileio.readCSS();
  const head = fileio.readHead();
  const appName = file.substr(0, file.lastIndexOf('.'));

  // assemble generated widgets from bottom of widget tree up
  widgets.forEach((widget) => {
    if (widget.children.length > 0) {
      widget.layouts = layoutUtils.createLayouts(widget, layoutAlg, widthAlg);
      widget.width = layoutUtils.widthOfLayouts(widget.layouts);
      widget.height = layoutUtils.heightOfLayouts(widget.layouts, widget.width);
    }
  });

  // output CSS and HTML for each top-level (page) widget
  fileio.buildDir();
  const numPages = widgetUtils.countPages(widgets);
  widgets.slice(widgets.length - numPages).forEach((widget) => {
    const page = widgetUtils.uniqifyGlobally(widget);
    const html = buildPageHTML(page, appName, head);
    const css = `${userStyles}\n${buildPageCSS(page)}`;
    fileio.writeOut(page.name, html, css);
  });
}

module.exports = build;
