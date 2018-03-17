// counts hashable inputs
class Counter {
  constructor() {
    this.counts = {};
  }

  count(key) {
    if (this.counts[key] === undefined) {
      this.counts[key] = 0;
    }
    this.counts[key] += 1;
    return this.counts[key];
  }

  reset() {
    this.counts = {};
  }
}

module.exports = Counter;
