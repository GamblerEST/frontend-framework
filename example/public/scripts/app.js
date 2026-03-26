import Home from './home.js';
import Weather from './weather.js';
import History from './history.js';

Dot.init({
	routes: {
		'/': Home,
		'/weather': Weather,
		'/history': History
	},
	initialState: { history: [] },
    persist: true
});