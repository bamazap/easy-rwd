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
// by default, each breakpoint data is an array
//   adding the same breakpoint twice appends to the array
// if you set singleton to true, data is exactly what you pass in
//   adding the same breakpoint twice overwrites the old data
class Breakpoints {
  constructor(singleton = false) {
    this.rep = new LinkedList();
    this.rep.prepend(new Breakpoint(Number.NEGATIVE_INFINITY, []));
    this.singleton = singleton;
    this.skipSentinel = true;
  }

  // add a breakpoint with the given minValue and data
  add(minValue, data) {
    if (minValue === Number.NEGATIVE_INFINITY) this.skipSentinel = false;
    const breakpoint = this.find(minValue, true);
    if (breakpoint.minValue === minValue) {
      if (this.singleton) {
        breakpoint.data = data;
      } else {
        breakpoint.data.push(data);
      }
    } else {
      const newData = this.singleton ? data : [data];
      breakpoint.append(new Breakpoint(minValue, newData));
    }
  }

  // returns the breakpoint with the smallest minValue
  min() {
    return this.skipSentinel === true ? this.rep.head.next : this.rep.head;
  }

  // returns the breakpoint with the highest minValue
  max() {
    const tail = getTail(this.rep);
    return tail.minValue === Number.NEGATIVE_INFINITY ? null : tail;
  }

  // returns the item with the highest minValue <= value
  find(value, returnSentinel = false) {
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
    return breakpoint;
  }

  // calls f on each breakpoint
  forEach(f) {
    let bp = this.skipSentinel === true ? this.rep.head.next : this.rep.head;
    while (bp !== null) {
      if (bp.minValue > Number.NEGATIVE_INFINITY) {
        f(bp, bp.next ? bp.next.minValue : Infinity);
      }
      bp = bp.next;
    }
  }

  // returns an array of the return values of calling f on each breakpoint
  map(f) {
    const arr = [];
    this.forEach((breakpoint) => {
      arr.push(f(breakpoint));
    });
    return arr;
  }
}

module.exports = Breakpoints;
