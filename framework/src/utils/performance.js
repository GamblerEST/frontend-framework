/**
 * Performance Utilities
 * Virtual scrolling and optimization helpers
 */

/**
 * Virtual Scroller
 * Renders only visible items for large lists
 */
class VirtualScroller {
  constructor(options = {}) {
    this.items = options.items || [];
    this.itemHeight = options.itemHeight || 50;
    this.containerHeight = options.containerHeight || 400;
    this.overscan = options.overscan || 3;
    
    this.scrollTop = 0;
    this.visibleStart = 0;
    this.visibleEnd = 0;
  }

  /**
   * Calculate visible range
   */
  calculateVisible(scrollTop) {
    this.scrollTop = scrollTop;
    
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
    const start = Math.floor(scrollTop / this.itemHeight);
    
    this.visibleStart = Math.max(0, start - this.overscan);
    this.visibleEnd = Math.min(
      this.items.length,
      start + visibleCount + this.overscan
    );
    
    return {
      start: this.visibleStart,
      end: this.visibleEnd,
      offset: this.visibleStart * this.itemHeight,
      totalHeight: this.items.length * this.itemHeight
    };
  }

  /**
   * Get visible items
   */
  getVisibleItems() {
    return this.items.slice(this.visibleStart, this.visibleEnd);
  }

  /**
   * Update items
   */
  setItems(items) {
    this.items = items;
    return this.calculateVisible(this.scrollTop);
  }
}

/**
 * Memoization
 */
function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    VirtualScroller,
    memoize
  };
}