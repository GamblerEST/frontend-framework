/**
 * DotComponent - Base Component Class
 * Provides lifecycle, state management, and rendering
 */
class DotComponent {
  constructor(props = {}) {
    this.props = props;
    this.state = {};
    this.localState = {};
    this._mounted = false;
    this._container = null;
    this._element = null;
    this._unsubscribe = null;
    this._store = null;
    this._watchKeys = [];
  }

  /**
   * Render method - must be overridden
   */
  render() {
    throw new Error('Component must implement render()');
  }

  /**
   * Mount component to container
   */
  mount(container, store = null) {
    if (this._mounted) return;

    this._container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;

    if (!this._container) {
      throw new Error('Container not found');
    }

    // Connect to store
    if (store) {
      this._store = store;
      this.state = store.get();
      
      // Subscribe to changes
      const keys = this._watchKeys.length > 0 ? this._watchKeys : '*';
      this._unsubscribe = store.subscribe(this, keys);
    }

    // Call lifecycle
    this.onMount();

    // Initial render
    this._render();
    this._mounted = true;
  }

  /**
   * Internal render
   */
  _render() {
    const newElement = this.render();

    if (!(newElement instanceof DotElement)) {
      throw new Error('render() must return a DotElement');
    }

    if (!this._element) {
      // First render
      this._container.innerHTML = '';
      this._container.appendChild(newElement.render());
      this._element = newElement;
    } else {
      // Update
      this._element.update(newElement);
      this._element = newElement;
    }
  }

  /**
   * Update component
   */
  update() {
    if (!this._mounted) return;

    // Sync state from store
    if (this._store) {
      this.state = this._store.get();
    }

    this.onUpdate();
    this._render();
  }

  /**
   * Unmount component
   */
  unmount() {
    if (!this._mounted) return;

    this.onUnmount();

    if (this._unsubscribe) {
      this._unsubscribe();
    }

    if (this._element) {
      this._element.destroy();
    }

    if (this._container) {
      this._container.innerHTML = '';
    }

    this._mounted = false;
  }

  /**
   * Set local state
   */
  setState(updates) {
    this.localState = { ...this.localState, ...updates };
    this.update();
  }

  /**
   * Watch specific state keys
   */
  watch(...keys) {
    this._watchKeys = keys;
    
    // Re-subscribe if already mounted
    if (this._mounted && this._store && this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = this._store.subscribe(this, keys);
    }
  }

  /**
   * Lifecycle hooks (override in subclasses)
   */
  onMount() {}
  onUpdate() {}
  onUnmount() {}

  /**
   * Check if mounted
   */
  isMounted() {
    return this._mounted;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DotComponent;
}