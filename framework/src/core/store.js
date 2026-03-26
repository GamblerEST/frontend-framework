/**
 * DotStore - Centralized State Management
 * Observable store with persistence and reactivity
 */
class DotStore {
  constructor(initialState = {}, options = {}) {
    this._state = { ...initialState };
    this._observers = new Map();
    this._persistKey = options.persistKey || 'dot_store';
    this._persist = options.persist !== false;

    // Load persisted state
    if (this._persist) {
      this._loadState();
    }
  }

  /**
   * Get state value
   */
  get(key) {
    if (key === undefined) {
      return { ...this._state };
    }
    return this._state[key];
  }

  /**
   * Set state value(s)
   */
  set(keyOrObj, value) {
    const updates = typeof keyOrObj === 'object' ? keyOrObj : { [keyOrObj]: value };
    const changedKeys = [];

    // Apply updates
    for (let [key, val] of Object.entries(updates)) {
      if (this._state[key] !== val) {
        this._state[key] = val;
        changedKeys.push(key);
      }
    }

    // Persist
    if (this._persist && changedKeys.length > 0) {
      this._saveState();
    }

    // Notify observers
    if (changedKeys.length > 0) {
      this._notify(changedKeys);
    }

    return this;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(observer, keys = '*') {
    const keySet = keys === '*' ? new Set(['*']) : new Set(Array.isArray(keys) ? keys : [keys]);
    this._observers.set(observer, keySet);
    
    return () => this.unsubscribe(observer);
  }

  /**
   * Unsubscribe from state changes
   */
  unsubscribe(observer) {
    this._observers.delete(observer);
  }

  /**
   * Notify observers of changes
   */
  _notify(changedKeys) {
    for (let [observer, watchedKeys] of this._observers) {
      const shouldNotify = watchedKeys.has('*') || changedKeys.some(k => watchedKeys.has(k));
      
      if (shouldNotify) {
        if (typeof observer === 'function') {
          observer(changedKeys);
        } else if (observer && typeof observer.update === 'function') {
          observer.update();
        }
      }
    }
  }

  /**
   * Delete a key
   */
  delete(key) {
    if (key in this._state) {
      delete this._state[key];
      if (this._persist) this._saveState();
      this._notify([key]);
    }
    return this;
  }

  /**
   * Reset state
   */
  reset(newState = {}) {
    const allKeys = Object.keys(this._state);
    this._state = { ...newState };
    if (this._persist) this._saveState();
    this._notify(allKeys);
    return this;
  }

  /**
   * Check if key exists
   */
  has(key) {
    return key in this._state;
  }

  /**
   * Get all keys
   */
  keys() {
    return Object.keys(this._state);
  }

  /**
   * Save state to localStorage
   */
  _saveState() {
    try {
      localStorage.setItem(this._persistKey, JSON.stringify(this._state));
    } catch (e) {
      console.warn('Failed to persist state:', e);
    }
  }

  /**
   * Load state from localStorage
   */
  _loadState() {
    try {
      const stored = localStorage.getItem(this._persistKey);
      if (stored) {
        this._state = { ...this._state, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load state:', e);
    }
  }

  /**
   * Clear persisted state
   */
  clearPersisted() {
    try {
      localStorage.removeItem(this._persistKey);
    } catch (e) {
      console.warn('Failed to clear persisted state:', e);
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DotStore;
}