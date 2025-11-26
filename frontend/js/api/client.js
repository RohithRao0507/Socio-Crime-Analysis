class APIClient {
    constructor(baseURL = null) {
        // Always use 127.0.0.1 for backend to avoid IPv6/IPv4 issues
        if (!baseURL) {
            this.baseURL = `http://127.0.0.1:8000`;
        } else {
            this.baseURL = baseURL;
        }
        
        console.log('API Client initialized with baseURL:', this.baseURL);
        console.log('Frontend location:', window.location.href);
    }
    
    async request(endpoint, options = {}) {
        // Try multiple URLs as fallback
        const urlsToTry = [
            `${this.baseURL}${endpoint}`,
            `http://127.0.0.1:8000${endpoint}`,
            `http://localhost:8000${endpoint}`
        ];
        
        // Remove duplicates
        const uniqueUrls = [...new Set(urlsToTry)];
        
        const config = {
            method: options.method || 'GET',
            mode: 'cors',
            credentials: 'omit',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        // Remove method from config if it's in options to avoid duplication
        if (options.method) {
            delete config.method;
        }
        
        let lastError = null;
        
        // Try each URL until one works
        for (const url of uniqueUrls) {
            try {
                console.log('Trying API request:', {
                    url: url,
                    method: config.method || 'GET'
                });
                
                const response = await fetch(url, config);
                
                console.log('API response:', {
                    url: url,
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok
                });
                
                if (!response.ok) {
                    let errorText = '';
                    try {
                        errorText = await response.text();
                    } catch (e) {
                        errorText = 'No error details available';
                    }
                    console.error('API error response:', errorText);
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }
                
                const data = await response.json();
                console.log('✓ Success with URL:', url);
                // Update baseURL to the working one
                if (url !== `${this.baseURL}${endpoint}`) {
                    const newBase = url.replace(endpoint, '');
                    console.log('Updating baseURL to working URL:', newBase);
                    this.baseURL = newBase;
                }
                return data;
            } catch (error) {
                console.warn(`Failed with ${url}:`, error.message);
                lastError = error;
                // Continue to next URL
                continue;
            }
        }
        
        // If we get here, all URLs failed
        const errorMessage = lastError && (lastError.message === 'Failed to fetch' || lastError.name === 'TypeError')
            ? `Failed to connect to backend. Tried: ${uniqueUrls.join(', ')}. ` +
              `Possible causes: 1) Backend not running on port 8000, 2) CORS issue, 3) Network/firewall blocking. ` +
              `Try opening http://127.0.0.1:8000/health in your browser to test.`
            : `All connection attempts failed. Last error: ${lastError ? lastError.message : 'Unknown'}`;
        
        console.error('API request failed for all URLs:', {
            urls: uniqueUrls,
            error: errorMessage,
            lastError: lastError
        });
        
        throw new Error(errorMessage);
    }
    
    // Data endpoints
    async getAllData() {
        return this.request('/api/data/');
    }
    
    async getDataSummary() {
        return this.request('/api/data/summary');
    }
    
    async getUniqueStates() {
        return this.request('/api/data/unique/states');
    }
    
    async getUniqueCounties(state = null) {
        const endpoint = state 
            ? `/api/data/unique/counties?state=${encodeURIComponent(state)}`
            : '/api/data/unique/counties';
        return this.request(endpoint);
    }
    
    async getUniqueYears() {
        return this.request('/api/data/unique/years');
    }
    
    async getAvailableColumns() {
        return this.request('/api/data/columns');
    }
    
    async getAvailableMetrics() {
        return this.request('/api/data/metrics');
    }
    
    // Filter endpoints
    async filterData(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.states) {
            filters.states.forEach(s => params.append('states', s));
        }
        if (filters.counties) {
            filters.counties.forEach(c => params.append('counties', c));
        }
        if (filters.years) {
            filters.years.forEach(y => params.append('years', y));
        }
        if (filters.gdp_min !== undefined) params.append('gdp_min', filters.gdp_min);
        if (filters.gdp_max !== undefined) params.append('gdp_max', filters.gdp_max);
        if (filters.pop_min !== undefined) params.append('pop_min', filters.pop_min);
        if (filters.pop_max !== undefined) params.append('pop_max', filters.pop_max);
        if (filters.violent_crime_min !== undefined) params.append('violent_crime_min', filters.violent_crime_min);
        if (filters.violent_crime_max !== undefined) params.append('violent_crime_max', filters.violent_crime_max);
        if (filters.property_crime_min !== undefined) params.append('property_crime_min', filters.property_crime_min);
        if (filters.property_crime_max !== undefined) params.append('property_crime_max', filters.property_crime_max);
        
        return this.request(`/api/filter/?${params.toString()}`);
    }
    
    async filterDataAdvanced(filters = {}) {
        return this.request('/api/filter/advanced', {
            method: 'POST',
            body: JSON.stringify(filters),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    
    // Aggregate endpoints
    async aggregateByState(years = null, metrics = null) {
        const params = new URLSearchParams();
        if (years) years.forEach(y => params.append('years', y));
        if (metrics) metrics.forEach(m => params.append('metrics', m));
        
        return this.request(`/api/aggregate/state?${params.toString()}`);
    }
    
    async aggregateByYear(states = null) {
        const params = new URLSearchParams();
        if (states) states.forEach(s => params.append('states', s));
        
        return this.request(`/api/aggregate/year?${params.toString()}`);
    }
    
    async aggregateByCounty(state, years = null) {
        const params = new URLSearchParams();
        params.append('state', state);
        if (years) years.forEach(y => params.append('years', y));
        
        return this.request(`/api/aggregate/county?${params.toString()}`);
    }
    
    async getTimeSeries(state = null, county = null, metric = 'Violent_Crime_Rate') {
        const params = new URLSearchParams();
        if (state) params.append('state', state);
        if (county) params.append('county', county);
        params.append('metric', metric);
        
        return this.request(`/api/aggregate/timeseries?${params.toString()}`);
    }
    
    // Statistics endpoints
    async getCorrelation(variables = null, states = null, years = null) {
        const params = new URLSearchParams();
        if (variables) variables.forEach(v => params.append('variables', v));
        if (states) states.forEach(s => params.append('states', s));
        if (years) years.forEach(y => params.append('years', y));
        
        return this.request(`/api/stats/correlation?${params.toString()}`);
    }
    
    async getStatisticalSummary(variable, states = null, years = null) {
        const params = new URLSearchParams();
        if (states) states.forEach(s => params.append('states', s));
        if (years) years.forEach(y => params.append('years', y));
        
        return this.request(`/api/stats/summary/${variable}?${params.toString()}`);
    }
    
    async getTrendAnalysis(variable, state = null) {
        const params = new URLSearchParams();
        if (state) params.append('state', state);
        
        return this.request(`/api/stats/trend/${variable}?${params.toString()}`);
    }
    
    async getOutliers(variable, method = 'iqr', states = null, years = null) {
        const params = new URLSearchParams();
        params.append('method', method);
        if (states) states.forEach(s => params.append('states', s));
        if (years) years.forEach(y => params.append('years', y));
        
        return this.request(`/api/stats/outliers/${variable}?${params.toString()}`);
    }
}

// Export singleton instance
const apiClient = new APIClient();
