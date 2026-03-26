# Dot.js Framework Documentation

A lightweight, reactive JavaScript framework built from scratch - no dependencies, no build required.

**Framework Size**: ~30KB unminified | Modern browsers with ES6+

## Quick Start

```html
<script src="dist/dot.js"></script>
<div id="app"></div>

<script>
  class App extends DotComponent {
    constructor() {
      super();
      this.localState = { count: 0 };
    }
    
    render() {
      return dot.div({},
        dot.h1({}, `Count: ${this.localState.count}`),
        dot.button({
          onClick: () => this.setState({ count: this.localState.count + 1 })
        }, 'Increment')
      );
    }
  }

  Dot.init({ routes: { '/': App } });
</script>
```

Open `test.html` to see the framework in action!

---

## Core Features

### ✅ All Requirements Met

- **State Management**: Reactive state with localStorage persistence
- **Routing**: Hash-based routing with parameters
- **DOM Manipulation**: Declarative element creation
- **Components**: Reusable with lifecycle hooks
- **Event Handling**: Declarative binding (not just addEventListener wrapper)
- **HTTP Client**: Fetch-based with store integration
- **Performance**: Virtual scrolling, debouncing, memoization

---

## Documentation Structure

This README covers:
1. [Installation](#installation)
2. [Architecture](#architecture)
3. [State Management](#state-management)
4. [Routing](#routing)
5. [Components](#components)
6. [Events](#events)
7. [Performance](#performance)
8. [API Reference](#api-reference)

For detailed architecture, see [ARCHITECTURE.md](../../ARCHITECTURE.md)

---

## Installation

**Direct Include:**
```html
<script src="dist/dot.js"></script>
```

The framework exposes:
- `window.Dot` - Main API
- `window.dot` - Alias for Dot
- `window.DotComponent` - Base component class

---

## Architecture

### Framework Convention (Not Library)

Dot.js is a **framework** - it controls your application's lifecycle:

```javascript
// You define components
class MyApp extends DotComponent {
  render() { ... }
}

// Framework manages when/how they render
Dot.init({ routes: { '/': MyApp } });
```

### Data Flow

```
User Action
  ↓
Event Handler
  ↓
Update Store: Dot.store.set('key', value)
  ↓
Notify Observers
  ↓
Component.update()
  ↓
Re-render
  ↓
DOM Patched
```

---

## State Management

### Setting State

```javascript
// Single value
Dot.store.set('count', 0);

// Multiple values
Dot.store.set({
  user: { name: 'John' },
  todos: []
});
```

### Getting State

```javascript
const count = Dot.store.get('count');
const allState = Dot.store.get();
```

### Reactive Updates

```javascript
class MyComponent extends DotComponent {
  constructor() {
    super();
    this.watch('count'); // Re-render when 'count' changes
  }

  render() {
    return dot.div({}, `Count: ${this.state.count}`);
  }
}
```

### State Persistence

```javascript
Dot.init({
  initialState: { todos: [] },
  persist: true, // Automatic localStorage
  persistKey: 'my_app'
});
```

State automatically:
- Saves to localStorage on changes
- Loads from localStorage on init
- Persists across page refreshes

### Sharing State Between Pages

```javascript
// Page 1
Dot.store.set('user', { id: 123, name: 'John' });
Dot.navigate('/dashboard');

// Page 2 (different route)
class Dashboard extends DotComponent {
  constructor() {
    super();
    this.watch('user');
  }
  
  render() {
    return dot.div({}, `Welcome ${this.state.user.name}`);
  }
}
```

---

## Routing

### Defining Routes

```javascript
Dot.init({
  routes: {
    '/': HomePage,
    '/about': AboutPage,
    '/users/:id': UserDetailPage
  }
});
```

### Navigation

```javascript
// Programmatic
Dot.navigate('/about');
Dot.navigate('/users/123');

// Links
dot.link({ to: '/about' }, 'About')
```

### Route Parameters

```javascript
class UserDetailPage extends DotComponent {
  onMount() {
    const userId = Dot.router.params.id; // From /users/:id
    // Load user data
  }
}
```

### URL Controls Application State

```javascript
// URL: #/search?q=test&page=2
const query = Dot.router.query; // { q: 'test', page: '2' }

// Application state updates based on URL
class SearchPage extends DotComponent {
  onMount() {
    const searchQuery = Dot.router.query.q;
    this.performSearch(searchQuery);
  }
}
```

---

## Components

### Basic Component

```javascript
class TodoItem extends DotComponent {
  constructor(props) {
    super(props);
  }

  render() {
    return dot.li({ class: 'todo' },
      dot.span({}, this.props.todo.text),
      dot.button({
        onClick: () => this.props.onDelete(this.props.todo.id)
      }, 'Delete')
    );
  }
}
```

### Lifecycle Hooks

```javascript
class MyComponent extends DotComponent {
  onMount() {
    // After component added to DOM
    console.log('Mounted');
  }

  onUpdate() {
    // After state/props change
    console.log('Updated');
  }

  onUnmount() {
    // Before component removed
    console.log('Unmounting');
  }
}
```

### Local vs Global State

```javascript
class MyComponent extends DotComponent {
  constructor() {
    super();
    // Local state - component only
    this.localState = { inputValue: '' };
    
    // Watch global state
    this.watch('todos');
  }

  updateLocal() {
    this.setState({ inputValue: 'new' }); // Local
  }

  updateGlobal() {
    Dot.store.set('todos', [...]); // Global
  }
}
```

---

## Events

### Declarative Event Binding

Events are registered when elements are rendered (NOT just addEventListener):

```javascript
dot.button({
  onClick: (e) => console.log('Clicked')
}, 'Click')

dot.input({
  onInput: (e) => console.log(e.target.value)
})

dot.form({
  onSubmit: (e) => {
    e.preventDefault();
    // Handle submission
  }
})
```

### Event Delegation

```javascript
class TodoList extends DotComponent {
  handleClick(e) {
    const todoId = e.target.closest('[data-id]')?.dataset.id;
    if (todoId) {
      console.log('Clicked todo:', todoId);
    }
  }

  render() {
    return dot.ul({ onClick: (e) => this.handleClick(e) },
      ...this.state.todos.map(todo =>
        dot.li({ 'data-id': todo.id }, todo.text)
      )
    );
  }
}
```

### Prevent Default & Bubbling

```javascript
dot.a({
  href: '#',
  onClick: (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Custom behavior
  }
}, 'Link')
```

---

## Performance

### Virtual Scrolling

Render only visible items in large lists:

```javascript
class LargeList extends DotComponent {
  constructor() {
    super();
    this.scroller = new VirtualScroller({
      items: Array(10000).fill().map((_, i) => ({ id: i, text: `Item ${i}` })),
      itemHeight: 50,
      containerHeight: 400
    });
  }

  handleScroll(e) {
    this.scroller.calculateVisible(e.target.scrollTop);
    this.update();
  }

  render() {
    const visible = this.scroller.getVisibleItems();
    const { offset, totalHeight } = this.scroller.calculateVisible(this.scroller.scrollTop);

    return dot.div({
      style: { height: '400px', overflow: 'auto' },
      onScroll: (e) => this.handleScroll(e)
    },
      dot.div({ style: { height: `${totalHeight}px`, position: 'relative' } },
        dot.div({ style: { transform: `translateY(${offset}px)` } },
          ...visible.map(item => dot.div({ style: { height: '50px' } }, item.text))
        )
      )
    );
  }
}
```

**Impact**: 10,000 items → only ~20 DOM nodes rendered

### Debouncing

```javascript
class SearchBox extends DotComponent {
  constructor() {
    super();
    this.debouncedSearch = debounce((query) => {
      Dot.http.get(`/api/search?q=${query}`);
    }, 300);
  }

  render() {
    return dot.input({
      onInput: (e) => this.debouncedSearch(e.target.value)
    });
  }
}
```

**Impact**: Reduces API calls from ~100 to 1 per typing session

### Memoization

```javascript
const expensiveCalc = memoize((items) => {
  return items.reduce((sum, item) => sum + item.price, 0);
});

class Cart extends DotComponent {
  render() {
    const total = expensiveCalc(this.state.items);
    return dot.div({}, `Total: $${total}`);
  }
}
```

**Impact**: Caches results, prevents recalculation on every render

---

## API Reference

### Dot

```javascript
Dot.init(config)          // Initialize framework
Dot.navigate(path)        // Navigate to route
Dot.store                 // State management
Dot.router                // Routing
Dot.http                  // HTTP client

// Element creators
dot.div(props, ...children)
dot.button(props, ...children)
dot.input(props)
// ... all HTML elements

// Helpers
dot.link(props, ...children)
dot.when(condition, trueFn, falseFn)
dot.each(items, renderFn)
```

### DotStore

```javascript
store.get(key)                    // Get state
store.set(key, value)             // Set state
store.subscribe(observer, keys)   // Watch state
store.delete(key)                 // Delete key
store.reset(newState)             // Reset all state
store.clearPersisted()            // Clear localStorage
```

### DotRouter

```javascript
router.navigate(path, state)      // Navigate
router.back()                     // Go back
router.forward()                  // Go forward
router.isActive(path)             // Check if active
router.params                     // Route parameters
router.query                      // Query parameters
```

### DotComponent

```javascript
constructor(props)
render()                          // Must implement
mount(container, store)
setState(updates)                 // Update local state
watch(...keys)                    // Watch global state
onMount()                         // Lifecycle hook
onUpdate()                        // Lifecycle hook
onUnmount()                       // Lifecycle hook
```

### DotHTTP

```javascript
http.get(url, options)
http.post(url, data, options)
http.put(url, data, options)
http.delete(url, options)
http.fetchToStore(url, key, store)
http.postToStore(url, data, key, store)
```

---

## Best Practices

1. **Use local state for component-specific data**
2. **Use global state for shared data**
3. **Watch only the state keys you need**
4. **Use keys when rendering lists**
5. **Debounce frequent events**
6. **Use virtual scrolling for 100+ items**

---

## Testing

Open `test.html` in your browser to verify the framework works.

You should see:
- ✅ Component rendering
- ✅ Local state management
- ✅ Global state management
- ✅ State persistence (refresh the page)
- ✅ Event handling
- ✅ Form inputs

---

## Requirements Coverage

### ✅ State Management
- [x] Stores and updates application state
- [x] Reactive updates trigger UI changes
- [x] State shared between elements
- [x] State shared between pages (via routing)
- [x] State persists between sessions (localStorage)

### ✅ Routing
- [x] Controls URL programmatically
- [x] Application state changes based on URL
- [x] Route parameters supported
- [x] Browser history integration

### ✅ DOM Manipulation
- [x] Elements can be created
- [x] Elements can be nested
- [x] System for styles and attributes
- [x] Handles user input and forms
- [x] Reusable component architecture

### ✅ Event Handling
- [x] Event listeners registered when elements rendered
- [x] Event delegation supported
- [x] Prevents default behavior and bubbling
- [x] NOT just addEventListener wrapper
- [x] Integrated with component rendering

### ✅ Implementation
- [x] No other frontend frameworks used
- [x] Implemented as framework (inversion of control)
- [x] HTTP client for API requests
- [x] Performance optimizations implemented

---

## File Structure

```
framework/
├── README.md          # This file
├── test.html          # Framework test
├── dist/
│   └── dot.js         # Bundled framework (~30KB)
└── src/
    ├── core/
    │   ├── element.js    # Virtual DOM
    │   ├── store.js      # State management
    │   ├── component.js  # Component system
    │   ├── router.js     # Routing
    │   ├── http.js       # HTTP client
    │   └── dot.js        # Main API
    └── utils/
        ├── helpers.js    # Helper functions
        └── performance.js # Performance utilities
```

---

## Next Steps

1. Open `test-simple.html` to verify framework works
2. Read [README.md](../README.md) for design details
3. See [example app](../example/) for complete application
4. Start building!

**Framework is ready to use!** 🎯