/**
 * Dot.js - Main Framework API
 * Provides convenient interface and initialization
 */

const Dot = {
  version: '1.0.0',
  
  // Framework instances
  store: null,
  router: null,
  http: null,
  
  /**
   * Initialize framework
   */
  init(config = {}) {
    // Create store
    this.store = new DotStore(config.initialState || {}, {
      persist: config.persist !== false,
      persistKey: config.persistKey || 'dot_app'
    });

    // Create router
    this.router = new DotRouter({
      mode: config.routerMode || 'hash',
      root: config.root || '/'
    });

    // Create HTTP client
    this.http = new DotHTTP({
      baseURL: config.baseURL || '',
      headers: config.headers || {}
    });

    // Register routes
    if (config.routes) {
      this.router.registerRoutes(config.routes);
    }

    // Set up routing integration
    this.router.on(routeInfo => {
      if (routeInfo.handler) {
        this.render(routeInfo.handler, config.container || '#app');
      }
    });

    return this;
  },

  /**
   * Render component
   */
  render(ComponentClass, container) {
    const el = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!el) {
      throw new Error(`Container not found: ${container}`);
    }

    // Create component instance
    let component;
    if (typeof ComponentClass === 'function' && ComponentClass.prototype instanceof DotComponent) {
      component = new ComponentClass();
    } else if (ComponentClass instanceof DotComponent) {
      component = ComponentClass;
    } else {
      throw new Error('Invalid component');
    }

    // Mount component
    component.mount(el, this.store);
    return component;
  },

  /**
   * Navigate to route
   */
  navigate(path, state) {
    if (this.router) {
      this.router.navigate(path, state);
    }
  },

  /**
   * Create element
   */
  createElement(tag, props, ...children) {
    return new DotElement(tag, props, ...children);
  },

  // Element creators
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

  /**
   * Text node
   */
  text(content) {
    return new DotElement('TEXT_NODE', { text: String(content) });
  },

  /**
   * Navigation link
   */
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

  /**
   * Conditional rendering
   */
  when(condition, trueFn, falseFn = () => null) {
    return condition ? trueFn() : falseFn();
  },

  /**
   * List rendering
   */
  each(items, renderFn) {
    return items.map((item, index) => renderFn(item, index));
  }
};

// Expose to window
if (typeof window !== 'undefined') {
  window.Dot = Dot;
  window.dot = Dot;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Dot;
}