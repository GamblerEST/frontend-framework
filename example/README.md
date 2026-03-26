# **Weather App** Made Using Dot.js Framework

## Overview

Simple Weather App Made Using Dot.js Framework, Loads realtime weather data from https://ilm.ee/
added 10 Cities  to choose from.

## Setup

1. Clone repository

```bash
git clone https://gitea.kood.tech/martinhiiesalu/frontend-framework.git
```
2. Navigate to repository
```bash
cd frontend-framework/example
```
3. Install dependencies

```bash
npm install
```
4. Start the App
```bash
npm start
```

## Functionality 

### 1. State Management

this.localState in Weather to store weather and error.
this.setState({ ... }) to update state and trigger re-render.
Components reactively update UI based on state.
Dot.store.set/get/watch on successful fetch data is stored to global array named history
/history page loads data from global state and renders

### 2. Routing

Dot.navigate("/weather?city=...") in Home.
Weather reads the URL param via Dot.router.query.
Supports query strings.

### 3. Event Handling

Home: button click triggers navigation.
Weather: modal button click triggers back navigation.
All event listeners are provided in the Dot.button/onClick syntax.

### 4. DOM Manipulation / Component Architecture

defined reusable components: Home, Weather.
Use dot.div, dot.select, dot.option, etc.
Nested elements are handled via virtual DOM (DotElement).
Rendering updates correctly based on state.

### 5. HTTP Client

Weather uses Dot.http.get("/api/weather?city=...").
Handles res.data parsing.
Handles errors (try/catch) and updates state accordingly.

### 6. Performance
history page uses Virtual Scrolling

## FEW IDEAS FOR YOU TO IMPLEMENT

### 1. SEND API REQUEST WITH INTERVALS ONCE DATA CHANGED RE RENDER
### 2. SEARCH BOX AND USE DEBOUNCING TO MAKE IT MORE PERFORMANT
### 3. USE YOUR BRAIN