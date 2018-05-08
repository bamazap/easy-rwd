const util = require('util');
const LinkedList = require('linked-list');

// if a linked list has only one item, the tail should be the head
function getTail(linkedList) {
  return linkedList.tail === null ? linkedList.head : linkedList.tail;
}

// represents a single breakpoint with a minimum value and some data
class Breakpoint extends LinkedList.Item {
  constructor(minValue, data) {
    super();
    this.minValue = minValue;
    this.data = data;
  }
}

// represents a set of breakpoints
class Breakpoints {
  constructor() {
    this.rep = new LinkedList();
    this.rep.prepend(new Breakpoint(Number.NEGATIVE_INFINITY, []));
    this.skipSentinel = true;
  }

  static fromFunction(domain, f, cmp = (a, b) => a === b) {
    const newBP = new Breakpoints();
    let last = null;
    domain.forEach((v) => {
      const current = f(v);
      if (last === null || !cmp(last, current)) {
        newBP.add(v, current);
        last = current;
      }
    });
    return newBP;
  }

  // add a breakpoint with the given minValue and data
  add(minValue, data) {
    if (minValue === Number.NEGATIVE_INFINITY) this.skipSentinel = false;
    const breakpoint = this.find(minValue, false, true);
    if (breakpoint.minValue === minValue) {
      breakpoint.data = data;
    } else {
      breakpoint.append(new Breakpoint(minValue, data));
    }
  }

  // returns the breakpoint with the smallest minValue
  min(returnData = true) {
    const bp = this.skipSentinel === true ? this.rep.head.next : this.rep.head;
    return returnData ? bp.data : bp;
  }

  // returns the breakpoint with the highest minValue
  max(returnData = true) {
    const tail = getTail(this.rep);
    const bp = tail.minValue === Number.NEGATIVE_INFINITY ? null : tail;
    return returnData ? bp.data : bp;
  }

  // returns the item with the highest minValue <= value
  find(value, returnData = true, returnSentinel = false) {
    let breakpoint = getTail(this.rep);
    while (breakpoint.minValue > value) {
      breakpoint = breakpoint.prev;
    }
    if (
      breakpoint.minValue === Number.NEGATIVE_INFINITY &&
      this.skipSentinel &&
      !returnSentinel
    ) {
      breakpoint = breakpoint.next;
    }
    return returnData ? breakpoint.data : breakpoint;
  }

  // returns an array of all breakpoints
  toArray() {
    const arr = [];
    let bp = this.skipSentinel === true ? this.rep.head.next : this.rep.head;
    while (bp !== null) {
      arr.push(bp);
      bp = bp.next;
    }
    return arr;
  }

  // returns a new Breakpoints
  // of all breakpoints active at some point between two values
  // minimum values below the lower bound are clipped to the lower bound
  inRange(a, b) {
    const newBP = new Breakpoints();
    this.toArray()
      .filter(({ minValue, next }) =>
        b > minValue && (!next || a < next.minValue))
      .forEach(({ minValue, data }) => {
        newBP.add(Math.max(minValue, a), data);
      });
    return newBP;
  }

  [util.inspect.custom](_depth, _opts) {
    return this.toArray().map(bp =>
      `${bp.minValue}: ${util.inspect(bp.data)}`).join('\n');
  }
}

module.exports = Breakpoints;
