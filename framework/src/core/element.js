/**
 * DotElement - Virtual DOM Element
 * Provides abstraction over DOM manipulation with efficient updates
 */
class DotElement {
  constructor(tag, props = {}, ...children) {
    this.tag = tag;
    this.props = props || {};
    this.children = this._flattenChildren(children);
    this.domNode = null;
    this._listeners = new Map();
  }

  /**
   * Flatten and filter children
   */
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

  /**
   * Render to actual DOM node
   */
  render() {
    // Handle text nodes
    if (typeof this.tag === 'string' && this.tag === 'TEXT_NODE') {
      this.domNode = document.createTextNode(this.props.text || '');
      return this.domNode;
    }

    // Create element
    const el = document.createElement(this.tag);
    this.domNode = el;

    // Apply props
    this._applyProps(el, this.props);

    // Render children
    for (let child of this.children) {
      if (child instanceof DotElement) {
        el.appendChild(child.render());
      } else if (typeof child === 'string' || typeof child === 'number') {
        el.appendChild(document.createTextNode(String(child)));
      }
    }

    return el;
  }

  /**
   * Apply properties to DOM element
   */
  _applyProps(el, props) {
    for (let [key, value] of Object.entries(props)) {
      // Style object
      if (key === 'style' && typeof value === 'object') {
        Object.assign(el.style, value);
      }
      // Class names
      else if (key === 'class' || key === 'className') {
        el.className = Array.isArray(value) ? value.filter(Boolean).join(' ') : value;
      }
      // Events (onClick, onInput, etc)
      else if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.substring(2).toLowerCase();
        el.addEventListener(eventName, value);
        this._listeners.set(eventName, value);
      }
      // Dataset
      else if (key === 'dataset' && typeof value === 'object') {
        Object.assign(el.dataset, value);
      }
      // Ref callback
      else if (key === 'ref' && typeof value === 'function') {
        value(el);
      }
      // Regular attributes
      else if (key !== 'key' && key !== 'children') {
        if (typeof value === 'boolean') {
          if (value) el.setAttribute(key, '');
        } else if (value !== null && value !== undefined) {
          el.setAttribute(key, value);
        }
      }
    }
  }

  /**
   * Update existing DOM node
   */
  update(newElement) {
    if (!this.domNode || !(newElement instanceof DotElement)) return;

    // Different tag - replace entire element
    if (this.tag !== newElement.tag) {
      const newNode = newElement.render();
      this.domNode.parentNode?.replaceChild(newNode, this.domNode);
      this.destroy();
      return;
    }

    // Update props
    this._updateProps(this.domNode, this.props, newElement.props);

    // Update children
    this._updateChildren(this.domNode, this.children, newElement.children);

    // Update references
    this.props = newElement.props;
    this.children = newElement.children;
  }

  /**
   * Update props on existing element
   */
  _updateProps(el, oldProps, newProps) {
    // Remove old props not in new props
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

    // Apply new props
    this._applyProps(el, newProps);
  }

  /**
   * Update children
   */
  _updateChildren(el, oldChildren, newChildren) {
    const oldLen = oldChildren.length;
    const newLen = newChildren.length;
    const maxLen = Math.max(oldLen, newLen);

    for (let i = 0; i < maxLen; i++) {
      const oldChild = oldChildren[i];
      const newChild = newChildren[i];
      const domChild = el.childNodes[i];

      // Remove extra children
      if (i >= newLen) {
        if (domChild) {
          if (oldChild instanceof DotElement) oldChild.destroy();
          el.removeChild(domChild);
        }
        continue;
      }

      // Add new children
      if (i >= oldLen) {
        if (newChild instanceof DotElement) {
          el.appendChild(newChild.render());
        } else {
          el.appendChild(document.createTextNode(String(newChild)));
        }
        continue;
      }

      // Update existing children
      const oldIsElement = oldChild instanceof DotElement;
      const newIsElement = newChild instanceof DotElement;

      if (oldIsElement && newIsElement) {
        // Both are DotElements - update
        oldChild.update(newChild);
      } else if (!oldIsElement && !newIsElement) {
        // Both are text - update if different
        if (oldChild !== newChild && domChild) {
          domChild.textContent = String(newChild);
        }
      } else {
        // Type changed - replace
        if (oldIsElement) oldChild.destroy();
        const newNode = newIsElement ? newChild.render() : document.createTextNode(String(newChild));
        el.replaceChild(newNode, domChild);
      }
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    // Remove event listeners
    if (this.domNode) {
      for (let [eventName, listener] of this._listeners) {
        this.domNode.removeEventListener(eventName, listener);
      }
      this._listeners.clear();
    }

    // Destroy children
    for (let child of this.children) {
      if (child instanceof DotElement) {
        child.destroy();
      }
    }

    this.domNode = null;
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DotElement;
}