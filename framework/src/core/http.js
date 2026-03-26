/**
 * DotHTTP - HTTP Client
 * Fetch-based HTTP client with store integration
 */
class DotHTTP {
  constructor(options = {}) {
    this.baseURL = options.baseURL || '';
    this.headers = options.headers || {};
    this.timeout = options.timeout || 30000;
  }

  /**
   * Make HTTP request
   */
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

  /**
   * GET request
   */
  async get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
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

  /**
   * PUT request
   */
  async put(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json', ...options.headers }
    });
  }

  /**
   * DELETE request
   */
  async delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }

  /**
   * Fetch data and update store
   */
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

  /**
   * Post data and update store
   */
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

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DotHTTP;
}