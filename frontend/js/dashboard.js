const { createApp } = Vue;

createApp({
    data() {
        return {
            currentPage: 'dashboard',
            // Data
            filteredData: [],
            uniqueStates: [],
            uniqueCounties: [],
            uniqueYears: [],
            dataSummary: null,
            filteredDataCount: 0,
            availableColumns: null,
            selectedMetrics: [
                'Violent_Crime_Rate',
                'Property_Crime_Rate',
                'Murder and nonnegligent manslaughter',
                'Forcible rape',
                'Robbery',
                'Aggravated assault',
                'Burglary',
                'Larceny-theft',
                'Motor vehicle theft',
                'GDP_Per_Capita'
            ],
            availableMetrics: [
                { key: 'Violent_Crime_Rate', label: 'Violent Crime Rate', category: 'crime' },
                { key: 'Property_Crime_Rate', label: 'Property Crime Rate', category: 'crime' },
                { key: 'Murder and nonnegligent manslaughter', label: 'Murder', category: 'crime' },
                { key: 'Forcible rape', label: 'Forcible Rape', category: 'crime' },
                { key: 'Robbery', label: 'Robbery', category: 'crime' },
                { key: 'Aggravated assault', label: 'Aggravated Assault', category: 'crime' },
                { key: 'Burglary', label: 'Burglary', category: 'crime' },
                { key: 'Larceny-theft', label: 'Larceny-Theft', category: 'crime' },
                { key: 'Motor vehicle theft', label: 'Motor Vehicle Theft', category: 'crime' },
                { key: 'GDP_Per_Capita', label: 'GDP Per Capita', category: 'economic' },
                { key: 'Population', label: 'Population', category: 'economic' },
                { key: 'Real_GDP', label: 'Real GDP', category: 'economic' }
            ],
            
            // Filters
            selectedStates: [],
            selectedCounties: [],
            selectedYears: [],
            gdpRange: [0, 200000],
            gdpMin: 0,
            gdpMax: 200000,
            mapViewMode: false,
            stateChartMetric: 'violentCrimeRate', // Current metric for state chart
            scatterChartMetric: 'violentCrimeRate', // Current metric for scatter chart
            timelineChartMetric: 'violentCrimeRate', // Current metric for timeline chart
            
            // UI State
            loading: false,
            error: null,
            
            // Chart data
            timelineData: [],
            scatterData: [],
            stateData: [],
            parallelData: [],
            radarData: [],
            treemapData: [],
            boxplotData: [],
            correlationData: null,
            crimeBreakdownData: []
        };
    },
    
    filters: {
        number(value) {
            return value ? value.toLocaleString() : '0';
        }
    },
    
    computed: {
        dynamicMetrics() {
            // Calculate metrics based on filtered data
            const data = this.filteredData.length > 0 ? this.filteredData : [];
            
            // Total records
            const totalRecords = this.dataSummary ? this.dataSummary.total_records : 0;
            
            // Unique counties
            const uniqueCounties = new Set();
            data.forEach(d => {
                if (d.County) uniqueCounties.add(d.County);
            });
            const uniqueCountiesCount = uniqueCounties.size || (this.dataSummary ? this.dataSummary.unique_counties : 0);
            
            // Average Violent Crime Rate
            const violentCrimeRates = data
                .map(d => d.Violent_Crime_Rate)
                .filter(v => v != null && !isNaN(v) && v > 0);
            const avgViolentCrimeRate = violentCrimeRates.length > 0
                ? violentCrimeRates.reduce((a, b) => a + b, 0) / violentCrimeRates.length
                : (this.dataSummary ? 0 : 0);
            
            // Average GDP Per Capita
            const gdpValues = data
                .map(d => d.GDP_Per_Capita)
                .filter(v => v != null && !isNaN(v) && v > 0);
            const avgGDPPerCapita = gdpValues.length > 0
                ? gdpValues.reduce((a, b) => a + b, 0) / gdpValues.length
                : (this.dataSummary ? 0 : 0);
            
            // Year range
            const years = data.map(d => d.Year).filter(y => y != null);
            let yearRange = this.dataSummary 
                ? `${this.dataSummary.year_range.min}-${this.dataSummary.year_range.max}`
                : 'N/A';
            if (years.length > 0) {
                const minYear = Math.min(...years);
                const maxYear = Math.max(...years);
                yearRange = minYear === maxYear ? `${minYear}` : `${minYear}-${maxYear}`;
            }
            
            return {
                totalRecords,
                uniqueCounties: uniqueCountiesCount,
                avgViolentCrimeRate,
                avgGDPPerCapita,
                yearRange
            };
        }
    },
    
    async mounted() {
        await this.initializeData();
    },
    
    methods: {
        async initializeData() {
            this.loading = true;
            this.error = null;
            try {
                console.log('=== Dashboard Initialization ===');
                console.log('Frontend URL:', window.location.href);
                console.log('API Client baseURL:', apiClient.baseURL);
                
                // Test backend connection first with timeout
                console.log('Testing backend connection...');
                const healthUrl = `${apiClient.baseURL}/health`;
                console.log('Health check URL:', healthUrl);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
                
                try {
                    const testResponse = await fetch(healthUrl, {
                        signal: controller.signal,
                        method: 'GET',
                        mode: 'cors',
                        credentials: 'omit',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    clearTimeout(timeoutId);
                    
                    if (!testResponse.ok) {
                        throw new Error(`Backend returned status ${testResponse.status}`);
                    }
                    const healthData = await testResponse.json();
                    console.log('✓ Backend connection successful:', healthData);
                } catch (testError) {
                    clearTimeout(timeoutId);
                    if (testError.name === 'AbortError') {
                        throw new Error(`Backend connection timeout. Is the backend running at ${apiClient.baseURL}? Try opening ${apiClient.baseURL}/health in your browser.`);
                    }
                    if (testError.message === 'Failed to fetch' || testError.name === 'TypeError') {
                        throw new Error(`Cannot connect to backend at ${apiClient.baseURL}. ` +
                            `This is usually a CORS or network issue. ` +
                            `Please: 1) Verify backend is running (check terminal), ` +
                            `2) Try opening ${apiClient.baseURL}/health in a new browser tab, ` +
                            `3) Check browser console for CORS errors. ` +
                            `Original error: ${testError.message}`);
                    }
                    throw new Error(`Cannot connect to backend at ${apiClient.baseURL}. Error: ${testError.message}`);
                }
                
                // Load metadata
                console.log('Loading states...');
                this.uniqueStates = await apiClient.getUniqueStates();
                console.log(`✓ Loaded ${this.uniqueStates.length} states`);
                
                console.log('Loading years...');
                this.uniqueYears = await apiClient.getUniqueYears();
                console.log(`✓ Loaded ${this.uniqueYears.length} years`);
                
                console.log('Loading summary...');
                this.dataSummary = await apiClient.getDataSummary();
                console.log('✓ Summary loaded:', this.dataSummary);
                
                // Load available metrics and columns (optional - we have defaults)
                // If API provides metrics, we can merge them, but we have defaults defined above
                try {
                    const apiMetrics = await apiClient.getMetrics();
                    if (apiMetrics && apiMetrics.crime && apiMetrics.economic) {
                        // Merge API metrics with our defaults if needed
                        console.log('✓ API Metrics available:', apiMetrics);
                    }
                } catch (err) {
                    console.log('Using default metrics (API not available)');
                }
                
                this.availableColumns = await apiClient.getAvailableColumns();
                console.log('✓ Columns loaded:', this.availableColumns);
                
                // Set GDP range based on data (non-blocking, use defaults if fails)
                apiClient.getStatisticalSummary('GDP_Per_Capita').then(summary => {
                    if (summary && summary.min !== undefined) {
                        this.gdpMin = Math.floor(summary.min);
                        this.gdpMax = Math.ceil(summary.max);
                        this.gdpRange = [this.gdpMin, this.gdpMax];
                        console.log('✓ GDP range updated:', this.gdpRange);
                    }
                }).catch(err => {
                    console.warn('Could not load GDP range, using defaults:', err);
                });
                
                // Load initial data and render charts
                console.log('Applying initial filters...');
                await this.applyFilters();
                console.log('✓ Dashboard initialized successfully');
            } catch (error) {
                this.error = `Failed to initialize: ${error.message}. Please check: 1) Backend is running on port 8000, 2) No firewall blocking connection, 3) Check browser console for details.`;
                console.error('❌ Initialization error:', error);
                console.error('Error stack:', error.stack);
            } finally {
                this.loading = false;
            }
        },
        
        async onStateChange() {
            this.loading = true;
            try {
                if (this.selectedStates.length === 1) {
                    this.uniqueCounties = await apiClient.getUniqueCounties(this.selectedStates[0]);
                } else {
                    this.uniqueCounties = [];
                }
                await this.applyFilters();
            } catch (error) {
                this.error = `Failed to load counties: ${error.message}`;
            } finally {
                this.loading = false;
            }
        },
        
        async applyFilters() {
            this.loading = true;
            this.error = null;
            try {
                const filters = {
                    states: this.selectedStates.length > 0 ? this.selectedStates : null,
                    years: this.selectedYears.length > 0 ? this.selectedYears : null,
                    counties: this.selectedCounties.length > 0 ? this.selectedCounties : null,
                    gdp_min: this.gdpRange[0],
                    gdp_max: this.gdpRange[1]
                };
                
                const response = await apiClient.filterData(filters);
                this.filteredData = response.data;
                this.filteredDataCount = response.count;
                
                // Prepare data for all charts
                await this.prepareChartData();
                
                // Render all charts with selected metrics
                this.renderCharts();
                
                // Update radar chart after data is prepared
                this.updateRadarChart();
                
            } catch (error) {
                this.error = `Failed to filter data: ${error.message}`;
                console.error('Filter error:', error);
            } finally {
                this.loading = false;
            }
        },
        
        async prepareChartData() {
            if (this.filteredData.length === 0) {
                this.timelineData = [];
                this.scatterData = [];
                this.stateData = [];
                this.parallelData = [];
                this.treemapData = [];
                this.boxplotData = [];
                this.radarData = [];
                this.crimeBreakdownData = [];
                return;
            }
            
            // Prepare timeline data (aggregate by year) - include all crime types
            const yearGroups = {};
            this.filteredData.forEach(d => {
                if (!yearGroups[d.Year]) {
                    yearGroups[d.Year] = {
                        year: d.Year,
                        violent: [],
                        property: [],
                        murder: [],
                        rape: [],
                        robbery: [],
                        assault: [],
                        burglary: [],
                        larceny: [],
                        motorTheft: [],
                        gdp: []
                    };
                }
                if (d.Violent_Crime_Rate) yearGroups[d.Year].violent.push(d.Violent_Crime_Rate);
                if (d.Property_Crime_Rate) yearGroups[d.Year].property.push(d.Property_Crime_Rate);
                if (d['Murder and nonnegligent manslaughter']) yearGroups[d.Year].murder.push(d['Murder and nonnegligent manslaughter']);
                if (d['Forcible rape']) yearGroups[d.Year].rape.push(d['Forcible rape']);
                if (d.Robbery) yearGroups[d.Year].robbery.push(d.Robbery);
                if (d['Aggravated assault']) yearGroups[d.Year].assault.push(d['Aggravated assault']);
                if (d.Burglary) yearGroups[d.Year].burglary.push(d.Burglary);
                if (d['Larceny-theft']) yearGroups[d.Year].larceny.push(d['Larceny-theft']);
                if (d['Motor vehicle theft']) yearGroups[d.Year].motorTheft.push(d['Motor vehicle theft']);
                if (d.GDP_Per_Capita) yearGroups[d.Year].gdp.push(d.GDP_Per_Capita);
            });
            
            this.timelineData = Object.values(yearGroups).map(g => ({
                year: g.year,
                violentCrimeRate: g.violent.length > 0 ? g.violent.reduce((a, b) => a + b, 0) / g.violent.length : 0,
                propertyCrimeRate: g.property.length > 0 ? g.property.reduce((a, b) => a + b, 0) / g.property.length : 0,
                murder: g.murder.length > 0 ? g.murder.reduce((a, b) => a + b, 0) / g.murder.length : 0,
                rape: g.rape.length > 0 ? g.rape.reduce((a, b) => a + b, 0) / g.rape.length : 0,
                robbery: g.robbery.length > 0 ? g.robbery.reduce((a, b) => a + b, 0) / g.robbery.length : 0,
                assault: g.assault.length > 0 ? g.assault.reduce((a, b) => a + b, 0) / g.assault.length : 0,
                burglary: g.burglary.length > 0 ? g.burglary.reduce((a, b) => a + b, 0) / g.burglary.length : 0,
                larceny: g.larceny.length > 0 ? g.larceny.reduce((a, b) => a + b, 0) / g.larceny.length : 0,
                motorTheft: g.motorTheft.length > 0 ? g.motorTheft.reduce((a, b) => a + b, 0) / g.motorTheft.length : 0,
                gdpPerCapita: g.gdp.length > 0 ? g.gdp.reduce((a, b) => a + b, 0) / g.gdp.length : 0
            })).sort((a, b) => a.year - b.year);
            
            // Prepare scatter data - include all crime types
            this.scatterData = this.filteredData
                .filter(d => d.GDP_Per_Capita && d.Violent_Crime_Rate)
                .map(d => ({
                    gdp: d.GDP_Per_Capita,
                    violentCrime: d.Violent_Crime_Rate,
                    propertyCrime: d.Property_Crime_Rate,
                    murder: d['Murder and nonnegligent manslaughter'] || 0,
                    rape: d['Forcible rape'] || 0,
                    robbery: d.Robbery || 0,
                    assault: d['Aggravated assault'] || 0,
                    burglary: d.Burglary || 0,
                    larceny: d['Larceny-theft'] || 0,
                    motorTheft: d['Motor vehicle theft'] || 0,
                    state: d.State_Name,
                    county: d.County_Clean,
                    population: d.Population || 0
                }));
            
            // Prepare state aggregation data - include all crime types
            const stateGroups = {};
            this.filteredData.forEach(d => {
                if (!stateGroups[d.State_Name]) {
                    stateGroups[d.State_Name] = {
                        state: d.State_Name,
                        violent: [],
                        property: [],
                        murder: [],
                        rape: [],
                        robbery: [],
                        assault: [],
                        burglary: [],
                        larceny: [],
                        motorTheft: [],
                        gdp: [],
                        population: []
                    };
                }
                if (d.Violent_Crime_Rate) stateGroups[d.State_Name].violent.push(d.Violent_Crime_Rate);
                if (d.Property_Crime_Rate) stateGroups[d.State_Name].property.push(d.Property_Crime_Rate);
                if (d['Murder and nonnegligent manslaughter']) stateGroups[d.State_Name].murder.push(d['Murder and nonnegligent manslaughter']);
                if (d['Forcible rape']) stateGroups[d.State_Name].rape.push(d['Forcible rape']);
                if (d.Robbery) stateGroups[d.State_Name].robbery.push(d.Robbery);
                if (d['Aggravated assault']) stateGroups[d.State_Name].assault.push(d['Aggravated assault']);
                if (d.Burglary) stateGroups[d.State_Name].burglary.push(d.Burglary);
                if (d['Larceny-theft']) stateGroups[d.State_Name].larceny.push(d['Larceny-theft']);
                if (d['Motor vehicle theft']) stateGroups[d.State_Name].motorTheft.push(d['Motor vehicle theft']);
                if (d.GDP_Per_Capita) stateGroups[d.State_Name].gdp.push(d.GDP_Per_Capita);
                if (d.Population) stateGroups[d.State_Name].population.push(d.Population);
            });
            
            this.stateData = Object.values(stateGroups).map(g => ({
                state: g.state,
                violentCrimeRate: g.violent.length > 0 ? g.violent.reduce((a, b) => a + b, 0) / g.violent.length : 0,
                propertyCrimeRate: g.property.length > 0 ? g.property.reduce((a, b) => a + b, 0) / g.property.length : 0,
                murder: g.murder.length > 0 ? g.murder.reduce((a, b) => a + b, 0) / g.murder.length : 0,
                rape: g.rape.length > 0 ? g.rape.reduce((a, b) => a + b, 0) / g.rape.length : 0,
                robbery: g.robbery.length > 0 ? g.robbery.reduce((a, b) => a + b, 0) / g.robbery.length : 0,
                assault: g.assault.length > 0 ? g.assault.reduce((a, b) => a + b, 0) / g.assault.length : 0,
                burglary: g.burglary.length > 0 ? g.burglary.reduce((a, b) => a + b, 0) / g.burglary.length : 0,
                larceny: g.larceny.length > 0 ? g.larceny.reduce((a, b) => a + b, 0) / g.larceny.length : 0,
                motorTheft: g.motorTheft.length > 0 ? g.motorTheft.reduce((a, b) => a + b, 0) / g.motorTheft.length : 0,
                gdpPerCapita: g.gdp.length > 0 ? g.gdp.reduce((a, b) => a + b, 0) / g.gdp.length : 0,
                population: g.population.length > 0 ? g.population.reduce((a, b) => a + b, 0) : 0
            })).sort((a, b) => b.violentCrimeRate - a.violentCrimeRate);
            
            // Prepare parallel coordinates data (sample for performance) - include all crime types
            this.parallelData = this.filteredData
                .filter(d => d.GDP_Per_Capita && d.Violent_Crime_Rate && d.Property_Crime_Rate && d.Population)
                .slice(0, 500) // Limit for performance
                .map(d => ({
                    state: d.State_Name,
                    county: d.County_Clean,
                    gdp: d.GDP_Per_Capita,
                    violentCrime: d.Violent_Crime_Rate,
                    propertyCrime: d.Property_Crime_Rate,
                    murder: d['Murder and nonnegligent manslaughter'] || 0,
                    rape: d['Forcible rape'] || 0,
                    robbery: d.Robbery || 0,
                    assault: d['Aggravated assault'] || 0,
                    burglary: d.Burglary || 0,
                    larceny: d['Larceny-theft'] || 0,
                    motorTheft: d['Motor vehicle theft'] || 0,
                    population: d.Population
                }));
            
            // Prepare treemap data (hierarchical: state -> counties)
            const treemapGroups = {};
            this.filteredData.forEach(d => {
                if (!treemapGroups[d.State_Name]) {
                    treemapGroups[d.State_Name] = {
                        name: d.State_Name,
                        children: [],
                        totalPopulation: 0,
                        avgCrimeRate: 0,
                        crimeCount: 0
                    };
                }
                if (d.Population && d.Violent_Crime_Rate !== undefined && d.Violent_Crime_Rate !== null) {
                    treemapGroups[d.State_Name].children.push({
                        name: d.County_Clean,
                        value: d.Population || 0,
                        crimeRate: d.Violent_Crime_Rate || 0
                    });
                    treemapGroups[d.State_Name].totalPopulation += (d.Population || 0);
                    treemapGroups[d.State_Name].avgCrimeRate += (d.Violent_Crime_Rate || 0);
                    treemapGroups[d.State_Name].crimeCount += 1;
                }
            });
            
            this.treemapData = Object.values(treemapGroups)
                .map(g => ({
                    ...g,
                    value: g.totalPopulation,
                    avgCrimeRate: g.crimeCount > 0 ? g.avgCrimeRate / g.crimeCount : 0
                }))
                .filter(g => g.children.length > 0 && g.value > 0)
                .sort((a, b) => b.value - a.value)
                .slice(0, 15); // Top 15 states by population
            
            // Prepare boxplot data
            this.boxplotData = this.stateData.map(s => ({
                state: s.state,
                violentCrime: this.filteredData
                    .filter(d => d.State_Name === s.state && d.Violent_Crime_Rate)
                    .map(d => d.Violent_Crime_Rate),
                propertyCrime: this.filteredData
                    .filter(d => d.State_Name === s.state && d.Property_Crime_Rate)
                    .map(d => d.Property_Crime_Rate)
            })).filter(d => d.violentCrime.length > 0).slice(0, 10);
            
            // Prepare crime breakdown data
            this.crimeBreakdownData = this.filteredData
                .filter(d => d.State_Name && d.County_Clean)
                .map(d => ({
                    state: d.State_Name,
                    county: d.County_Clean,
                    murder: d['Murder and nonnegligent manslaughter'] || 0,
                    rape: d['Forcible rape'] || 0,
                    robbery: d.Robbery || 0,
                    assault: d['Aggravated assault'] || 0,
                    burglary: d.Burglary || 0,
                    larceny: d['Larceny-theft'] || 0,
                    motorTheft: d['Motor vehicle theft'] || 0
                }));
            
            // Prepare correlation data (non-blocking, don't wait)
            setTimeout(() => {
                apiClient.getCorrelation(
                    ['GDP_Per_Capita', 'Violent_Crime_Rate', 'Property_Crime_Rate', 'Population',
                     'Murder and nonnegligent manslaughter', 'Forcible rape', 'Robbery', 
                     'Aggravated assault', 'Burglary', 'Larceny-theft', 'Motor vehicle theft'],
                    this.selectedStates.length > 0 ? this.selectedStates : null,
                    this.selectedYears.length > 0 ? this.selectedYears : null
                ).then(corrResponse => {
                    this.correlationData = corrResponse;
                    if (typeof renderCorrelationChart === 'function' && this.correlationData) {
                        renderCorrelationChart(this.correlationData);
                    }
                }).catch(error => {
                    console.warn('Failed to load correlation data (non-critical):', error);
                });
            }, 100);
            
            // Prepare radar data - use selectedStates from main filter
            if (this.selectedStates && this.selectedStates.length > 0) {
                this.radarData = this.stateData
                    .filter(s => this.selectedStates.includes(s.state))
                    .slice(0, 10); // Limit to 10 states for readability
            } else {
                this.radarData = [];
            }
        },
        
        renderCharts() {
            try {
                // Small delay to ensure containers are rendered
                this.$nextTick(() => {
                    // Render all charts with selected metrics
                    if (typeof renderTimelineChart === 'function') {
                        renderTimelineChart(this.timelineData, this.selectedMetrics, this.timelineChartMetric);
                    }
                
                if (typeof renderScatterChart === 'function') {
                    renderScatterChart(this.scatterData, this.selectedMetrics, this.scatterChartMetric);
                }
                
                if (typeof renderStateChart === 'function') {
                    renderStateChart(this.stateData, this.selectedMetrics, this.stateChartMetric);
                }
                
                if (typeof renderParallelCoords === 'function') {
                    renderParallelCoords(this.parallelData, this.selectedMetrics);
                }
                
                if (typeof renderRadarChart === 'function') {
                    renderRadarChart(this.radarData, this.selectedMetrics);
                }
                
                if (typeof renderTreemapChart === 'function') {
                    renderTreemapChart(this.treemapData);
                }
                
                if (typeof renderBoxplotChart === 'function') {
                    renderBoxplotChart(this.boxplotData);
                }
                
                if (typeof renderCorrelationChart === 'function' && this.correlationData) {
                    renderCorrelationChart(this.correlationData);
                }
                
                if (typeof renderCrimeBreakdownChart === 'function') {
                    renderCrimeBreakdownChart(this.crimeBreakdownData);
                }
                
                if (typeof renderCrimeBreakdownChart === 'function') {
                    renderCrimeBreakdownChart(this.crimeBreakdownData);
                }
                
                // Render map if in map view mode (only if toggle is on)
                if (this.mapViewMode && typeof renderUSMap === 'function') {
                    this.$nextTick(() => {
                        try {
                            renderUSMap(
                                this.selectedStates,
                                this.selectedCounties,
                                this.handleStateClick,
                                this.handleCountyClick,
                                this.handleStateDoubleClick
                            );
                        } catch (error) {
                            console.error('Error rendering map:', error);
                        }
                    });
                }
                });
            } catch (error) {
                console.error('Error rendering charts:', error);
            }
        },
        
        handleStateClick(stateName) {
            const index = this.selectedStates.indexOf(stateName);
            if (index > -1) {
                // Deselect
                this.selectedStates.splice(index, 1);
                // Clear counties if this was the only selected state
                if (this.selectedStates.length === 0) {
                    this.selectedCounties = [];
                }
            } else {
                // Select (allow multiple)
                this.selectedStates.push(stateName);
            }
            this.onStateChange();
            this.updateMapSelection();
        },
        
        async handleStateDoubleClick(stateName) {
            // Ensure state is selected
            if (!this.selectedStates.includes(stateName)) {
                this.selectedStates.push(stateName);
            }
            // Load counties for this state
            await this.onStateChange();
            // Render counties on map
            if (typeof loadCountiesForState === 'function') {
                await loadCountiesForState(stateName, this.selectedCounties, this.handleCountyClick);
            }
        },
        
        handleCountyClick(countyName) {
            const index = this.selectedCounties.indexOf(countyName);
            if (index > -1) {
                // Deselect
                this.selectedCounties.splice(index, 1);
            } else {
                // Select (allow multiple)
                this.selectedCounties.push(countyName);
            }
            this.applyFilters();
            this.updateMapSelection();
        },
        
        updateMapSelection() {
            if (typeof updateMapSelection === 'function') {
                updateMapSelection(this.selectedStates, this.selectedCounties);
            }
        },
        
        updateRadarChart() {
            // Use selectedStates from main filter
            if (this.selectedStates && this.selectedStates.length > 0) {
                this.radarData = this.stateData
                    .filter(s => this.selectedStates.includes(s.state))
                    .slice(0, 10); // Limit to 10 states for readability
            } else {
                this.radarData = [];
            }
            
            if (typeof renderRadarChart === 'function') {
                renderRadarChart(this.radarData, this.selectedMetrics);
            }
        },
        
        setStateChartMetric(metric) {
            this.stateChartMetric = metric;
            // Update button states
            this.$nextTick(() => {
                document.querySelectorAll('.state-metric-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.metric === metric) {
                        btn.classList.add('active');
                    }
                });
                // Update label
                const metricLabels = {
                    'violentCrimeRate': 'Violent Crime Rate',
                    'propertyCrimeRate': 'Property Crime Rate',
                    'murder': 'Murder',
                    'rape': 'Rape',
                    'robbery': 'Robbery',
                    'assault': 'Assault',
                    'burglary': 'Burglary',
                    'larceny': 'Larceny',
                    'motorTheft': 'Motor Theft',
                    'gdpPerCapita': 'GDP Per Capita'
                };
                const labelElement = document.getElementById('state-chart-metric-label');
                if (labelElement) {
                    labelElement.textContent = metricLabels[metric] || metric;
                }
                // Re-render chart
                if (typeof renderStateChart === 'function') {
                    renderStateChart(this.stateData, this.selectedMetrics, this.stateChartMetric);
                }
            });
        },
        
        setScatterChartMetric(metric) {
            this.scatterChartMetric = metric;
            // Update button states
            this.$nextTick(() => {
                document.querySelectorAll('.scatter-metric-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.metric === metric) {
                        btn.classList.add('active');
                    }
                });
                // Update label
                const metricLabels = {
                    'violentCrimeRate': 'Violent Crime Rate',
                    'propertyCrimeRate': 'Property Crime Rate',
                    'murder': 'Murder',
                    'rape': 'Rape',
                    'robbery': 'Robbery',
                    'assault': 'Assault',
                    'burglary': 'Burglary',
                    'larceny': 'Larceny',
                    'motorTheft': 'Motor Theft'
                };
                const labelElement = document.getElementById('scatter-chart-metric-label');
                if (labelElement) {
                    labelElement.textContent = metricLabels[metric] || metric;
                }
                // Re-render chart
                if (typeof renderScatterChart === 'function') {
                    renderScatterChart(this.scatterData, this.selectedMetrics, this.scatterChartMetric);
                }
            });
        },
        
        setTimelineChartMetric(metric) {
            this.timelineChartMetric = metric;
            // Update button states
            this.$nextTick(() => {
                document.querySelectorAll('.timeline-metric-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.metric === metric) {
                        btn.classList.add('active');
                    }
                });
                // Re-render chart
                if (typeof renderTimelineChart === 'function') {
                    renderTimelineChart(this.timelineData, this.selectedMetrics, this.timelineChartMetric);
                }
            });
        },
        
        clearFilters() {
            this.selectedStates = [];
            this.selectedCounties = [];
            this.selectedYears = [];
            this.gdpRange = [this.gdpMin, this.gdpMax];
            this.applyFilters();
            if (this.mapViewMode) {
                this.updateMapSelection();
            }
        }
    },
    
    watch: {
        mapViewMode(newVal) {
            if (newVal) {
                // Switch to map view - render map
                this.$nextTick(() => {
                    if (typeof renderUSMap === 'function') {
                        renderUSMap(
                            this.selectedStates,
                            this.selectedCounties,
                            this.handleStateClick,
                            this.handleCountyClick,
                            this.handleStateDoubleClick
                        );
                    }
                });
            }
        },
        selectedStates() {
            if (this.mapViewMode) {
                this.updateMapSelection();
            }
            // Update radar chart when main filter selection changes
            this.$nextTick(() => {
                this.updateRadarChart();
            });
        },
        stateData() {
            // Update radar chart when state data changes (after filtering)
            this.$nextTick(() => {
                this.updateRadarChart();
            });
        },
        selectedMetrics() {
            // Re-render all charts when metrics change
            this.$nextTick(() => {
                this.renderCharts();
            });
        }
    }
}).mount('#app');
