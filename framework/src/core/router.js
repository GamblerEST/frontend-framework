/**
 * DotRouter - Client-Side Routing
 * Handles URL-based navigation with parameters
 */
class DotRouter {
  constructor(options = {}) {
    this.routes = new Map();
    this.currentRoute = null;
    this.params = {};
    this.query = {};
    this.listeners = [];
    this.mode = options.mode || 'hash';
    this.root = options.root || '/';
    this.notFoundHandler = null;

    this._init();
  }

  /**
   * Initialize router
   */
  _init() {
    if (this.mode === 'hash') {
      window.addEventListener('hashchange', () => this._handleRoute());
      if (!window.location.hash) {
        window.location.hash = '#' + this.root;
      }
    } else {
      window.addEventListener('popstate', () => this._handleRoute());
    }

    // Handle initial route
    this._handleRoute();
  }

  /**
   * Register a route
   */
  register(path, handler) {
    this.routes.set(path, handler);
    return this;
  }

  /**
   * Register multiple routes
   */
  registerRoutes(routes) {
    for (let [path, handler] of Object.entries(routes)) {
      this.register(path, handler);
    }
    return this;
  }

  /**
   * Set 404 handler
   */
  notFound(handler) {
    this.notFoundHandler = handler;
    return this;
  }

  /**
   * Navigate to path
   */
  navigate(path, state = {}, replace = false) {
    if (this.mode === 'hash') {
      const hash = '#' + path;
      if (replace) {
        window.location.replace(window.location.pathname + hash);
      } else {
        window.location.hash = hash;
      }
    } else {
      if (replace) {
        history.replaceState(state, '', path);
      } else {
        history.pushState(state, '', path);
      }
      this._handleRoute();
    }
    return this;
  }

  /**
   * Go back
   */
  back() {
    window.history.back();
    return this;
  }

  /**
   * Go forward
   */
  forward() {
    window.history.forward();
    return this;
  }

  /**
   * Handle route change
   */
  _handleRoute() {
    const path = this._getCurrentPath();
    const match = this._matchRoute(path);

    if (match) {
      this.currentRoute = match.route;
      this.params = match.params;
      this.query = this._parseQuery();

      this._notifyListeners({
        path,
        route: match.route,
        params: this.params,
        query: this.query,
        handler: match.handler
      });
    } else if (this.notFoundHandler) {
      this._notifyListeners({
        path,
        route: null,
        params: {},
        query: {},
        handler: this.notFoundHandler
      });
    }
  }

  /**
   * Get current path
   */
  _getCurrentPath() {
    if (this.mode === 'hash') {
      return window.location.hash.slice(1).split('?')[0] || this.root;
    } else {
      return window.location.pathname;
    }
  }

  /**
   * Match route
   */
  _matchRoute(path) {
    // Exact match
    if (this.routes.has(path)) {
      return {
        route: path,
        params: {},
        handler: this.routes.get(path)
      };
    }

    // Pattern match
    for (let [route, handler] of this.routes) {
      const match = this._matchPattern(route, path);
      if (match) {
        return { route, params: match, handler };
      }
    }

    return null;
  }

  /**
   * Match route pattern with parameters
   */
  _matchPattern(pattern, path) {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);

    if (patternParts.length !== pathParts.length) {
      return null;
    }

    const params = {};

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      if (patternPart.startsWith(':')) {
        params[patternPart.slice(1)] = decodeURIComponent(pathPart);
      } else if (patternPart !== pathPart) {
        return null;
      }
    }

    return params;
  }

  /**
   * Parse query string
   */
  _parseQuery() {
    const queryString = this.mode === 'hash'
      ? window.location.hash.split('?')[1]
      : window.location.search.slice(1);

    if (!queryString) return {};

    return queryString.split('&').reduce((acc, pair) => {
      const [key, value] = pair.split('=');
      if (key) {
        acc[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
      }
      return acc;
    }, {});
  }

  /**
   * Add route change listener
   */
  on(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify listeners
   */
  _notifyListeners(routeInfo) {
    for (let callback of this.listeners) {
      callback(routeInfo);
    }
  }

  /**
   * Get current route info
   */
  getCurrentRoute() {
    return {
      path: this._getCurrentPath(),
      route: this.currentRoute,
      params: this.params,
      query: this.query
    };
  }

  /**
   * Check if path is active
   */
  isActive(path) {
    return this._getCurrentPath() === path;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DotRouter;
}