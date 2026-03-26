# Dot.js Framework Architecture

## Overview

Dot.js is a lightweight, reactive JavaScript framework built from scratch without dependencies.

## Core Design Principles

1. **Framework, Not Library**: Inversion of control - the framework manages application lifecycle
2. **Reactive by Default**: UI automatically updates when state changes
3. **Declarative**: Describe what the UI should look like, not how to build it
4. **Simple API**: Minimal learning curve with intuitive methods
5. **No Build Required**: Works directly in browsers with ES6+

---

## Architecture Layers

```
┌─────────────────────────────────────┐
│     Application Layer               │
│  (User Components & App Code)       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│     Component System                │
│  - Lifecycle management             │
│  - Props & State                    │
│  - Rendering pipeline               │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│     State Management                │
│  - Observable Store                 │
│  - Persistence                      │
│  - Reactivity                       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│     Routing System                  │
│  - URL management                   │
│  - Route matching                   │
│  - Navigation                       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│     Virtual DOM                     │
│  - Element abstraction              │
│  - Diffing & Patching               │
│  - Event delegation                 │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│     Browser DOM                     │
└─────────────────────────────────────┘
```

---

## Module Breakdown

### 1. DotElement (Virtual DOM)
**File**: `src/core/element.js`

**Purpose**: Lightweight virtual DOM for efficient rendering

**Responsibilities**:
- Create virtual element representations
- Render virtual elements to real DOM
- Update existing DOM efficiently
- Handle event binding
- Manage element lifecycle

**Key Methods**:
```javascript
createElement(tag, props, ...children)
render() → HTMLElement
update(newElement)
destroy()
```

---

### 2. DotStore (State Management)
**File**: `src/core/store.js`

**Purpose**: Centralized reactive state management

**Responsibilities**:
- Store application state
- Notify observers of changes
- Persist state to localStorage
- Provide reactive subscriptions

**Key Methods**:
```javascript
get(key) → value
set(key, value)
subscribe(observer, keys)
unsubscribe(observer)
```

**Observable Pattern**:
```
State Change → Notify Observers → Component Re-render
```

---

### 3. DotRouter (Routing)
**File**: `src/core/router.js`

**Purpose**: Client-side routing and navigation

**Responsibilities**:
- Match URLs to routes
- Handle browser navigation
- Parse route parameters
- Manage route state

**Key Methods**:
```javascript
register(path, handler)
navigate(path, state)
getCurrentRoute()
on(callback)
```

**Route Matching**:
- Exact match: `/home`
- Parameters: `/users/:id`
- Query strings: `/search?q=term`

---

### 4. DotComponent (Component System)
**File**: `src/core/component.js`

**Purpose**: Reusable UI components with lifecycle

**Responsibilities**:
- Component lifecycle management
- State observation
- Props handling
- Rendering coordination

**Lifecycle Hooks**:
```javascript
onMount()    // After component added to DOM
onUpdate()   // After state/props change
onUnmount()  // Before component removed
```

**State Types**:
- **Local State**: Component-specific, not shared
- **Global State**: From store, shared across app

---

### 5. DotHTTP (HTTP Client)
**File**: `src/core/http.js`

**Purpose**: HTTP requests with store integration

**Responsibilities**:
- Make HTTP requests (GET, POST, PUT, DELETE)
- Handle responses and errors
- Integrate with state store
- Support interceptors

**Key Methods**:
```javascript
get(url, options)
post(url, data, options)
fetchToStore(url, stateKey, store)
```

---

### 6. Dot (Main API)
**File**: `src/core/dot.js`

**Purpose**: Main framework API and initialization

**Responsibilities**:
- Framework initialization
- Provide convenient element creators
- Expose framework instances
- App lifecycle management

**API Surface**:
```javascript
// Initialization
Dot.init(config)

// Element creators
dot.div(props, ...children)
dot.button(props, ...children)
// ... all HTML elements

// Framework access
Dot.store
Dot.router
Dot.http
```

---

## Data Flow

### 1. User Interaction
```
User clicks button
  ↓
Event handler called
  ↓
Update store: Dot.store.set('key', value)
  ↓
Store notifies observers
  ↓
Component.update() called
  ↓
Component re-renders
  ↓
Virtual DOM diffing
  ↓
Real DOM patched
```

### 2. Route Navigation
```
User clicks link / Dot.navigate()
  ↓
Router updates URL
  ↓
Route matched to component
  ↓
Old component unmounted
  ↓
New component mounted
  ↓
Component renders with state
```

### 3. State Synchronization
```
Page A: Dot.store.set('user', data)
  ↓
State persisted to localStorage
  ↓
Navigate to Page B
  ↓
Page B: Dot.store.get('user')
  ↓
Data available (from localStorage)
```

---

## Performance Strategy

### 1. Virtual DOM Diffing
- Compare old and new virtual elements
- Only update changed properties
- Minimize DOM operations

### 2. Selective Updates
- Components watch specific state keys
- Only re-render when watched keys change
- Avoid unnecessary renders

### 3. Event Delegation
- Events bound during render
- Automatic cleanup on destroy
- Memory leak prevention

### 4. Debouncing & Throttling
- Utility functions for rate limiting
- Apply to search, scroll, resize
- Reduce excessive updates

### 5. Virtual Scrolling
- Render only visible items
- Dynamic viewport calculation
- Handle thousands of items

---

## File Loading Strategy

All modules will be bundled into a single `dist/dot.js` file:

```javascript
(function(window) {
  'use strict';
  
  // 1. DotElement class
  // 2. DotStore class
  // 3. DotRouter class
  // 4. DotComponent class
  // 5. DotHTTP class
  // 6. Performance utilities
  // 7. Helper utilities
  // 8. Main Dot object
  
  // Expose to window
  window.Dot = Dot;
  window.dot = Dot;
  window.DotComponent = DotComponent;
  
})(window);
```

---

## API Design Examples

### Creating Elements
```javascript
// Simple element
dot.div({ class: 'container' }, 'Hello')

// Nested elements
dot.div({ class: 'card' },
  dot.h1({}, 'Title'),
  dot.p({}, 'Content')
)

// With events
dot.button({
  onClick: (e) => console.log('Clicked')
}, 'Click me')
```

### Components
```javascript
class MyComponent extends DotComponent {
  constructor() {
    super();
    this.watch('todos'); // Watch specific state
  }
  
  render() {
    return dot.div({},
      dot.h1({}, 'My Component'),
      dot.p({}, `Todos: ${this.state.todos.length}`)
    );
  }
}
```

### State Management
```javascript
// Set state
Dot.store.set('count', 0);

// Get state
const count = Dot.store.get('count');

// Update state (triggers re-render)
Dot.store.set('count', count + 1);
```

### Routing
```javascript
Dot.init({
  routes: {
    '/': HomePage,
    '/about': AboutPage,
    '/users/:id': UserPage
  }
});

// Navigate
Dot.navigate('/about');
```

---

## Error Handling

### Store Errors
- Invalid keys: Return undefined, no throw
- Persistence failures: Log warning, continue

### Router Errors
- Unknown route: Call notFound handler or show 404
- Invalid navigation: Log error, stay on current route

### Component Errors
- Render errors: Log error, show error boundary
- Lifecycle errors: Log error, continue

### HTTP Errors
- Network failures: Throw DotHTTPError
- Timeouts: Abort request, throw error
- Invalid responses: Parse error in response

---

## Testing Requirements Coverage

### ✅ State Management
- Stores and updates state ✓
- Reactive updates ✓
- State shared between elements ✓
- State shared between pages ✓
- State persists between sessions ✓

### ✅ Routing
- Controls URL ✓
- App state changes with URL ✓
- Route parameters ✓
- Programmatic navigation ✓

### ✅ DOM Manipulation
- Create elements ✓
- Nest elements ✓
- Styles and attributes ✓
- Handle user input ✓
- Reusable components ✓

### ✅ Event Handling
- Register when rendered ✓
- Event delegation ✓
- Prevent default & bubbling ✓
- NOT just addEventListener ✓

### ✅ Implementation
- No other frameworks ✓
- Framework convention (IoC) ✓
- HTTP requests ✓
- Performance optimizations ✓

---

## Build Order

1. **DotElement** - Foundation for everything
2. **DotStore** - State before components need it
3. **DotComponent** - Needs store, provides component system
4. **DotRouter** - Needs components for routing
5. **DotHTTP** - Independent, can be added anytime
6. **Utilities** - Performance and helpers
7. **Dot** - Main API that ties everything together
8. **Bundle** - Combine into single file
