/**
 * Dot.js v1.0.0
 * A lightweight JavaScript framework for building reactive web applications
 * 
 * Copyright (c) 2026
 * Licensed under MIT
 */

(function(window) {
  'use strict';

  // ============================================================================
  // DOTELEMENT - Virtual DOM
  // ============================================================================

  class DotElement {
    constructor(tag, props = {}, ...children) {
      this.tag = tag;
      this.props = props || {};
      this.children = this._flattenChildren(children);
      this.domNode = null;
      this._listeners = new Map();
    }

    _flattenChildren(children) {
      const result = [];
      
      for (let child of children) {
        if (Array.isArray(child)) {
          result.push(...this._flattenChildren(child));
        } else if (child !== null && child !== undefined && child !== false) {
          result.push(child);
        }
      }
      
      return result;
    }

    render() {
      if (typeof this.tag === 'string' && this.tag === 'TEXT_NODE') {
        this.domNode = document.createTextNode(this.props.text || '');
        return this.domNode;
      }

      const el = document.createElement(this.tag);
      this.domNode = el;

      this._applyProps(el, this.props);

      for (let child of this.children) {
        if (child instanceof DotElement) {
          el.appendChild(child.render());
        } else if (typeof child === 'string' || typeof child === 'number') {
          el.appendChild(document.createTextNode(String(child)));
        }
      }

      return el;
    }

    _applyProps(el, props) {
      for (let [key, value] of Object.entries(props)) {
        if (key === 'style' && typeof value === 'object') {
          Object.assign(el.style, value);
        }
        else if (key === 'class' || key === 'className') {
          el.className = Array.isArray(value) ? value.filter(Boolean).join(' ') : value;
        }
        else if (key.startsWith('on') && typeof value === 'function') {
          const eventName = key.substring(2).toLowerCase();
          el.addEventListener(eventName, value);
          this._listeners.set(eventName, value);
        }
        else if (key === 'dataset' && typeof value === 'object') {
          Object.assign(el.dataset, value);
        }
        else if (key === 'ref' && typeof value === 'function') {
          value(el);
        }
        else if (key !== 'key' && key !== 'children') {
          if (typeof value === 'boolean') {
            if (value) el.setAttribute(key, '');
          } else if (value !== null && value !== undefined) {
            el.setAttribute(key, value);
          }
        }
      }
    }

    update(newElement) {
      if (!this.domNode || !(newElement instanceof DotElement)) return;

      if (this.tag !== newElement.tag) {
        const newNode = newElement.render();
        this.domNode.parentNode?.replaceChild(newNode, this.domNode);
        this.destroy();
        return;
      }

      this._updateProps(this.domNode, this.props, newElement.props);
      this._updateChildren(this.domNode, this.children, newElement.children);

      this.props = newElement.props;
      this.children = newElement.children;
    }

    _updateProps(el, oldProps, newProps) {
      for (let key of Object.keys(oldProps)) {
        if (!(key in newProps)) {
          if (key.startsWith('on')) {
            const eventName = key.substring(2).toLowerCase();
            const listener = this._listeners.get(eventName);
            if (listener) {
              el.removeEventListener(eventName, listener);
              this._listeners.delete(eventName);
            }
          } else if (key === 'class' || key === 'className') {
            el.className = '';
          } else if (key !== 'style' && key !== 'dataset' && key !== 'ref' && key !== 'key') {
            el.removeAttribute(key);
          }
        }
      }

      this._applyProps(el, newProps);
    }

    _updateChildren(el, oldChildren, newChildren) {
      const oldLen = oldChildren.length;
      const newLen = newChildren.length;
      const maxLen = Math.max(oldLen, newLen);

      for (let i = 0; i < maxLen; i++) {
        const oldChild = oldChildren[i];
        const newChild = newChildren[i];
        const domChild = el.childNodes[i];

        if (i >= newLen) {
          if (domChild) {
            if (oldChild instanceof DotElement) oldChild.destroy();
            el.removeChild(domChild);
          }
          continue;
        }

        if (i >= oldLen) {
          if (newChild instanceof DotElement) {
            el.appendChild(newChild.render());
          } else {
            el.appendChild(document.createTextNode(String(newChild)));
          }
          continue;
        }

        const oldIsElement = oldChild instanceof DotElement;
        const newIsElement = newChild instanceof DotElement;

        if (oldIsElement && newIsElement) {
          oldChild.update(newChild);
        } else if (!oldIsElement && !newIsElement) {
          if (oldChild !== newChild && domChild) {
            domChild.textContent = String(newChild);
          }
        } else {
          if (oldIsElement) oldChild.destroy();
          const newNode = newIsElement ? newChild.render() : document.createTextNode(String(newChild));
          el.replaceChild(newNode, domChild);
        }
      }
    }

    destroy() {
      if (this.domNode) {
        for (let [eventName, listener] of this._listeners) {
          this.domNode.removeEventListener(eventName, listener);
        }
        this._listeners.clear();
      }

      for (let child of this.children) {
        if (child instanceof DotElement) {
          child.destroy();
        }
      }

      this.domNode = null;
    }
  }

  // ============================================================================
  // DOTSTORE - State Management
  // ============================================================================

  class DotStore {
    constructor(initialState = {}, options = {}) {
      this._state = { ...initialState };
      this._observers = new Map();
      this._persistKey = options.persistKey || 'dot_store';
      this._persist = options.persist !== false;

      if (this._persist) {
        this._loadState();
      }
    }

    get(key) {
      if (key === undefined) {
        return { ...this._state };
      }
      return this._state[key];
    }

    set(keyOrObj, value) {
      const updates = typeof keyOrObj === 'object' ? keyOrObj : { [keyOrObj]: value };
      const changedKeys = [];

      for (let [key, val] of Object.entries(updates)) {
        if (this._state[key] !== val) {
          this._state[key] = val;
          changedKeys.push(key);
        }
      }

      if (this._persist && changedKeys.length > 0) {
        this._saveState();
      }

      if (changedKeys.length > 0) {
        this._notify(changedKeys);
      }

      return this;
    }

    subscribe(observer, keys = '*') {
      const keySet = keys === '*' ? new Set(['*']) : new Set(Array.isArray(keys) ? keys : [keys]);
      this._observers.set(observer, keySet);
      
      return () => this.unsubscribe(observer);
    }

    unsubscribe(observer) {
      this._observers.delete(observer);
    }

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

    delete(key) {
      if (key in this._state) {
        delete this._state[key];
        if (this._persist) this._saveState();
        this._notify([key]);
      }
      return this;
    }

    reset(newState = {}) {
      const allKeys = Object.keys(this._state);
      this._state = { ...newState };
      if (this._persist) this._saveState();
      this._notify(allKeys);
      return this;
    }

    has(key) {
      return key in this._state;
    }

    keys() {
      return Object.keys(this._state);
    }

    _saveState() {
      try {
        localStorage.setItem(this._persistKey, JSON.stringify(this._state));
      } catch (e) {
        console.warn('Failed to persist state:', e);
      }
    }

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

    clearPersisted() {
      try {
        localStorage.removeItem(this._persistKey);
      } catch (e) {
        console.warn('Failed to clear persisted state:', e);
      }
    }
  }

  // ============================================================================
  // DOTCOMPONENT - Component System
  // ============================================================================

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

    render() {
      throw new Error('Component must implement render()');
    }

    mount(container, store = null) {
      if (this._mounted) return;

      this._container = typeof container === 'string' 
        ? document.querySelector(container) 
        : container;

      if (!this._container) {
        throw new Error('Container not found');
      }

      if (store) {
        this._store = store;
        this.state = store.get();
        
        const keys = this._watchKeys.length > 0 ? this._watchKeys : '*';
        this._unsubscribe = store.subscribe(this, keys);
      }

      this.onMount();
      this._render();
      this._mounted = true;
    }

    _render() {
      const newElement = this.render();

      if (!(newElement instanceof DotElement)) {
        throw new Error('render() must return a DotElement');
      }

      if (!this._element) {
        this._container.innerHTML = '';
        this._container.appendChild(newElement.render());
        this._element = newElement;
      } else {
        this._element.update(newElement);
        this._element = newElement;
      }
    }

    update() {
      if (!this._mounted) return;

      if (this._store) {
        this.state = this._store.get();
      }

      this.onUpdate();
      this._render();
    }

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

    setState(updates) {
      this.localState = { ...this.localState, ...updates };
      this.update();
    }

    watch(...keys) {
      this._watchKeys = keys;
      
      if (this._mounted && this._store && this._unsubscribe) {
        this._unsubscribe();
        this._unsubscribe = this._store.subscribe(this, keys);
      }
    }

    onMount() {}
    onUpdate() {}
    onUnmount() {}

    isMounted() {
      return this._mounted;
    }
  }

  // ============================================================================
  // DOTROUTER - Routing
  // ============================================================================

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

    _init() {
      if (this.mode === 'hash') {
        window.addEventListener('hashchange', () => this._handleRoute());
        if (!window.location.hash) {
          window.location.hash = '#' + this.root;
        }
      } else {
        window.addEventListener('popstate', () => this._handleRoute());
      }

      this._handleRoute();
    }

    register(path, handler) {
      this.routes.set(path, handler);
      return this;
    }

    registerRoutes(routes) {
      for (let [path, handler] of Object.entries(routes)) {
        this.register(path, handler);
      }
      return this;
    }

    notFound(handler) {
      this.notFoundHandler = handler;
      return this;
    }

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

    back() {
      window.history.back();
      return this;
    }

    forward() {
      window.history.forward();
      return this;
    }

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

    _getCurrentPath() {
      if (this.mode === 'hash') {
        return window.location.hash.slice(1).split('?')[0] || this.root;
      } else {
        return window.location.pathname;
      }
    }

    _matchRoute(path) {
      if (this.routes.has(path)) {
        return {
          route: path,
          params: {},
          handler: this.routes.get(path)
        };
      }

      for (let [route, handler] of this.routes) {
        const match = this._matchPattern(route, path);
        if (match) {
          return { route, params: match, handler };
        }
      }

      return null;
    }

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

    on(callback) {
      this.listeners.push(callback);
      return () => {
        this.listeners = this.listeners.filter(cb => cb !== callback);
      };
    }

    _notifyListeners(routeInfo) {
      for (let callback of this.listeners) {
        callback(routeInfo);
      }
    }

    getCurrentRoute() {
      return {
        path: this._getCurrentPath(),
        route: this.currentRoute,
        params: this.params,
        query: this.query
      };
    }

    isActive(path) {
      return this._getCurrentPath() === path;
    }
  }

  // ============================================================================
  // DOTHTTP - HTTP Client
  // ============================================================================

  class DotHTTP {
    constructor(options = {}) {
      this.baseURL = options.baseURL || '';
      this.headers = options.headers || {};
      this.timeout = options.timeout || 30000;
    }

    async request(url, options = {}) {
      const config = {
        method: options.method || 'GET',
        headers: { ...this.headers, ...options.headers },
        body: options.body,
        signal: options.signal
      };

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(this.baseURL + url, {
          ...config,
          signal: options.signal || controller.signal
        });

        clearTimeout(timeoutId);

        let data;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        };

      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
    }

    async get(url, options = {}) {
      return this.request(url, { ...options, method: 'GET' });
    }

    async post(url, data, options = {}) {
      const body = data instanceof FormData ? data : JSON.stringify(data);
      const headers = data instanceof FormData 
        ? options.headers 
        : { 'Content-Type': 'application/json', ...options.headers };

      return this.request(url, {
        ...options,
        method: 'POST',
        body,
        headers
      });
    }

    async put(url, data, options = {}) {
      return this.request(url, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json', ...options.headers }
      });
    }

    async delete(url, options = {}) {
      return this.request(url, { ...options, method: 'DELETE' });
    }

    async fetchToStore(url, stateKey, store, options = {}) {
      try {
        const response = await this.get(url, options);
        store.set(stateKey, response.data);
        return response;
      } catch (error) {
        console.error(`Failed to fetch to store (${stateKey}):`, error);
        throw error;
      }
    }

    async postToStore(url, data, stateKey, store, options = {}) {
      try {
        const response = await this.post(url, data, options);
        if (stateKey) {
          store.set(stateKey, response.data);
        }
        return response;
      } catch (error) {
        console.error(`Failed to post to store (${stateKey}):`, error);
        throw error;
      }
    }
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  function generateId(prefix = 'dot') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  function classNames(...args) {
    return args
      .flat()
      .filter(Boolean)
      .map(arg => {
        if (typeof arg === 'string') return arg;
        if (typeof arg === 'object') {
          return Object.entries(arg)
            .filter(([_, value]) => value)
            .map(([key]) => key)
            .join(' ');
        }
        return '';
      })
      .filter(Boolean)
      .join(' ');
  }

  function formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  function debounce(fn, delay = 300) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function throttle(fn, limit = 300) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // ============================================================================
  // PERFORMANCE UTILITIES
  // ============================================================================

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

    getVisibleItems() {
      return this.items.slice(this.visibleStart, this.visibleEnd);
    }

    setItems(items) {
      this.items = items;
      return this.calculateVisible(this.scrollTop);
    }
  }

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

  // ============================================================================
  // DOT - Main API
  // ============================================================================

  const Dot = {
    version: '1.0.0',
    
    store: null,
    router: null,
    http: null,
    
    init(config = {}) {
      this.store = new DotStore(config.initialState || {}, {
        persist: config.persist !== false,
        persistKey: config.persistKey || 'dot_app'
      });

      this.router = new DotRouter({
        mode: config.routerMode || 'hash',
        root: config.root || '/'
      });

      this.http = new DotHTTP({
        baseURL: config.baseURL || '',
        headers: config.headers || {}
      });

      if (config.routes) {
        this.router.registerRoutes(config.routes);
      }

      this.router.on(routeInfo => {
        if (routeInfo.handler) {
          this.render(routeInfo.handler, config.container || '#app');
        }
      });
      //FORCE render on refresh
      this.router._handleRoute();
      return this;
    },

    render(ComponentClass, container) {
      const el = typeof container === 'string'
        ? document.querySelector(container)
        : container;

      if (!el) {
        throw new Error(`Container not found: ${container}`);
      }

      let component;
      if (typeof ComponentClass === 'function' && ComponentClass.prototype instanceof DotComponent) {
        component = new ComponentClass();
      } else if (ComponentClass instanceof DotComponent) {
        component = ComponentClass;
      } else {
        throw new Error('Invalid component');
      }

      component.mount(el, this.store);
      return component;
    },

    navigate(path, state) {
      if (this.router) {
        this.router.navigate(path, state);
      }
    },

    createElement(tag, props, ...children) {
      return new DotElement(tag, props, ...children);
    },

    div(props, ...children) { return this.createElement('div', props, ...children); },
    span(props, ...children) { return this.createElement('span', props, ...children); },
    p(props, ...children) { return this.createElement('p', props, ...children); },
    h1(props, ...children) { return this.createElement('h1', props, ...children); },
    h2(props, ...children) { return this.createElement('h2', props, ...children); },
    h3(props, ...children) { return this.createElement('h3', props, ...children); },
    h4(props, ...children) { return this.createElement('h4', props, ...children); },
    h5(props, ...children) { return this.createElement('h5', props, ...children); },
    h6(props, ...children) { return this.createElement('h6', props, ...children); },
    a(props, ...children) { return this.createElement('a', props, ...children); },
    button(props, ...children) { return this.createElement('button', props, ...children); },
    input(props) { return this.createElement('input', props); },
    textarea(props, ...children) { return this.createElement('textarea', props, ...children); },
    select(props, ...children) { return this.createElement('select', props, ...children); },
    option(props, ...children) { return this.createElement('option', props, ...children); },
    label(props, ...children) { return this.createElement('label', props, ...children); },
    form(props, ...children) { return this.createElement('form', props, ...children); },
    ul(props, ...children) { return this.createElement('ul', props, ...children); },
    ol(props, ...children) { return this.createElement('ol', props, ...children); },
    li(props, ...children) { return this.createElement('li', props, ...children); },
    table(props, ...children) { return this.createElement('table', props, ...children); },
    thead(props, ...children) { return this.createElement('thead', props, ...children); },
    tbody(props, ...children) { return this.createElement('tbody', props, ...children); },
    tr(props, ...children) { return this.createElement('tr', props, ...children); },
    td(props, ...children) { return this.createElement('td', props, ...children); },
    th(props, ...children) { return this.createElement('th', props, ...children); },
    img(props) { return this.createElement('img', props); },
    br(props) { return this.createElement('br', props); },
    hr(props) { return this.createElement('hr', props); },
    section(props, ...children) { return this.createElement('section', props, ...children); },
    article(props, ...children) { return this.createElement('article', props, ...children); },
    header(props, ...children) { return this.createElement('header', props, ...children); },
    footer(props, ...children) { return this.createElement('footer', props, ...children); },
    nav(props, ...children) { return this.createElement('nav', props, ...children); },
    main(props, ...children) { return this.createElement('main', props, ...children); },

    text(content) {
      return new DotElement('TEXT_NODE', { text: String(content) });
    },

    link(props, ...children) {
      const { to, ...otherProps } = props;
      return this.a({
        ...otherProps,
        href: this.router?.mode === 'hash' ? `#${to}` : to,
        onClick: (e) => {
          e.preventDefault();
          this.navigate(to);
          if (props.onClick) props.onClick(e);
        }
      }, ...children);
    },

    when(condition, trueFn, falseFn = () => null) {
      return condition ? trueFn() : falseFn();
    },

    each(items, renderFn) {
      return items.map((item, index) => renderFn(item, index));
    }
  };

  // ============================================================================
  // EXPOSE TO WINDOW
  // ============================================================================

  window.Dot = Dot;
  window.dot = Dot;
  window.DotComponent = DotComponent;
  window.DotElement = DotElement;
  window.DotStore = DotStore;
  window.DotRouter = DotRouter;
  window.DotHTTP = DotHTTP;
  window.VirtualScroller = VirtualScroller;
  window.generateId = generateId;
  window.classNames = classNames;
  window.formatDate = formatDate;
  window.debounce = debounce;
  window.throttle = throttle;
  window.memoize = memoize;

})(window);