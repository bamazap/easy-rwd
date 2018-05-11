#!/usr/bin/env node
const fileio = require('./fileio');
const widgetUtils = require('./widgets');
const layoutUtils = require('./layout');
const buildPageHTML = require('./html');
const buildPageCSS = require('./css');

function build(file, layoutAlg, widthAlg, dir) {
  // read & process inputs
  const widgetsObj = fileio.readIn(file);
  const pagesArr = widgetUtils.pages(widgetsObj);
  const widgetsArr = widgetUtils.topologicallySort(widgetsObj);
  widgetUtils.uniqifyLocally(widgetsArr);

  const userStyles = fileio.readCSS();
  const head = fileio.readHead();
  const appName = file.substr(0, file.lastIndexOf('.'));

  // assemble generated widgets from bottom of widget tree up
  widgetsArr.forEach((widget) => {
    if (widget.children.length > 0) {
      widget.layouts = layoutUtils.createLayouts(widget, layoutAlg, widthAlg);
      widget.width = layoutUtils.widthOfLayouts(widget.layouts);
      widget.height = layoutUtils.heightOfLayouts(widget.layouts, widget.width);
    }
  });

  // output CSS and HTML for each top-level (page) widget
  fileio.buildDir(dir);
  pagesArr.forEach((widget) => {
    const page = widgetUtils.uniqifyGlobally(widget);
    const html = buildPageHTML(page, appName, head);
    const css = `${userStyles}\n${buildPageCSS(page)}`;
    fileio.writeOut(dir, page.name, html, css);
  });
}

module.exports = build;
