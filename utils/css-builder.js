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
    const oldValue = this.rules[selector][property];
    if (oldValue && oldValue !== value) {
      process.emitWarning(`Warning: reassigning ${selector} ${property} from \
        ${oldValue} to ${value}`);
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

  // deletes redundant rules
  // don't call this until you are confident it is safe to
  squish() {
    const activeRules = {};
    Object.entries(this.rules).forEach(([sel, decl]) => {
      activeRules[sel] = {};
      Object.entries(decl).forEach(([prop, val]) => {
        activeRules[sel][prop] = val;
      });
    });
    const marks = [];
    Object.entries(this.mediaQueries)
      .sort(([mwA, _1], [mwB, _2]) => mwA - mwB)
      .forEach(([minWidth, cssBuilder]) => {
        Object.entries(cssBuilder.rules).forEach(([sel, decl]) => {
          Object.entries(decl).forEach(([prop, val]) => {
            if (!activeRules[sel]) {
              activeRules[sel] = {};
            }
            if (activeRules[sel][prop] === val) {
              marks.push([minWidth, sel, prop]);
            } else {
              activeRules[sel][prop] = val;
            }
          });
        });
      });
    marks.forEach(([minWidth, sel, prop]) => {
      delete this.mediaQueries[minWidth].rules[sel][prop];
    });
  }

  toString(numIndents = 0) {
    const baseIndent = this.indent.repeat(numIndents);
    const rulesCSS = Object.entries(this.rules).map(([sel, decl]) => {
      const declCSS = Object.entries(decl).map(([prop, val]) =>
        `${baseIndent + this.indent}${prop}: ${val};`).join('\n');
      return declCSS ? `${baseIndent}${sel} {\n${declCSS}\n${baseIndent}}` : '';
    }).join('\n\n');
    const mqCSS = Object.entries(this.mediaQueries)
      .sort(([mwA, _1], [mwB, _2]) => mwA - mwB)
      .map(([minWidth, cssBuilder]) => {
        const css = cssBuilder.toString(numIndents + 1);
        const cond = CSSBuilder.mediaQueryString(minWidth);
        return css ? `${baseIndent}${cond} {\n${css}${baseIndent}}` : '';
      })
      .join('\n\n');
    return `${rulesCSS}\n${mqCSS ? '\n' : ''}${mqCSS}`;
  }
}

module.exports = CSSBuilder;
