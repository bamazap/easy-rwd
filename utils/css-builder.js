// class for building CSS files.
class CSSBuilder {
  constructor(indent = '  ') {
    this.indent = indent;
    this.rules = {};
    this.mediaQueries = {};
  }

  static mediaQueryString(minWidth) {
    return `@media only screen and (min-width: ${minWidth}px)`;
  }

  addRule(selector, property, value) {
    if (!({}).hasOwnProperty.call(this.rules, selector)) {
      this.rules[selector] = {};
    }
    this.rules[selector][property] = value;
  }

  // only min-width (px) media queries are supported
  mediaQuery(minWidth) {
    if (!({}).hasOwnProperty.call(this.mediaQueries, minWidth)) {
      this.mediaQueries[minWidth] = new CSSBuilder(this.indent);
    }
    return this.mediaQueries[minWidth];
  }

  toString(numIndents = 0) {
    const baseIndent = this.indent.repeat(numIndents);
    const rulesCSS = Object.entries(this.rules).map(([sel, decl]) => {
      const declCSS = Object.entries(decl).map(([prop, val]) =>
        `${baseIndent + this.indent}${prop}: ${val};`).join('\n');
      return `${baseIndent}${sel} {\n${declCSS}\n${baseIndent}}`;
    }).join('\n\n');
    const mqCSS = Object.entries(this.mediaQueries)
      .sort(([mwA, _1], [mwB, _2]) => mwA - mwB)
      .map(([minWidth, cssBuilder]) => {
        const nestedCSS = cssBuilder.toString(numIndents + 1);
        const condition = CSSBuilder.mediaQueryString(minWidth);
        return `${baseIndent}${condition} {\n${nestedCSS}${baseIndent}}`;
      })
      .join('\n\n');
    return `${rulesCSS}\n${mqCSS ? '\n' : ''}${mqCSS}`;
  }
}

module.exports = CSSBuilder;
