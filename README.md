# Socio-Crime Analysis Dashboard

An interactive web-based data visualization dashboard for exploring relationships between crime rates, economic indicators (GDP), and population demographics across U.S. counties (2011-2017).

## Project Overview

This project provides an interactive dashboard that enables users to:
- Explore crime statistics across U.S. counties with interactive filtering
- Analyze relationships between crime rates and economic indicators
- Visualize trends over time (2011-2017) with dynamic metric selection
- Compare states and counties using multiple visualization types
- Perform statistical analysis and correlation studies
- Interact with an interactive US map for state and county selection

## Architecture

- **Backend**: FastAPI (Python) - RESTful API for data processing and analysis
- **Frontend**: Vue.js + D3.js - Interactive visualizations and user interface
- **Data**: Merged dataset combining crime, GDP, and population data (stored in `backend/data/`)

## Project Structure

```
Socio-Crime-Analysis/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/         # API route handlers
│   │   │       ├── data.py     # Data retrieval endpoints
│   │   │       ├── filter.py   # Data filtering endpoints
│   │   │       ├── aggregate.py # Data aggregation endpoints
│   │   │       └── statistics.py # Statistical analysis endpoints
│   │   ├── services/          # Business logic services
│   │   │   ├── data_loader.py  # Data loading and caching
│   │   │   ├── data_filter.py   # Data filtering logic
│   │   │   ├── aggregator.py   # Data aggregation logic
│   │   │   └── statistics.py   # Statistical calculations
│   │   ├── config.py           # Application configuration
│   │   └── main.py             # FastAPI application entry point
│   ├── data/                   # Data files
│   │   └── merged_crime_gdp_population.csv
│   ├── requirements.txt        # Python dependencies
│   └── venv/                   # Python virtual environment
├── frontend/                   # Vue.js frontend
│   ├── dashboard.html          # Main dashboard page
│   ├── css/
│   │   └── style.css           # Custom styles
│   └── js/
│       ├── dashboard.js         # Main Vue.js application
│       ├── api/
│       │   └── client.js       # API client for backend communication
│       └── components/         # D3.js chart components
│           ├── timeline-chart.js        # Time series visualization
│           ├── scatter-chart.js        # GDP vs Crime scatter plot
│           ├── state-chart.js           # State comparison bar chart
│           ├── radar-chart.js           # Multi-state radar comparison
│           ├── treemap-chart.js         # Hierarchical treemap
│           ├── parallel-coords.js       # Parallel coordinates plot
│           ├── boxplot-chart.js         # Crime rate distribution
│           ├── correlation-chart.js     # Correlation heatmap
│           ├── crime-breakdown-chart.js  # Crime type breakdown
│           └── us-map-chart.js          # Interactive US map
└── README.md                   # This file
```

## Quick Start

### Prerequisites
- Python 3.8+ (Python 3.13 recommended)
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No Node.js required (frontend uses CDN resources)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd Socio-Crime-Analysis/backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the FastAPI server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

   The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd Socio-Crime-Analysis/frontend
   ```

2. **Start a local web server (choose one method):**

   **Option 1: Python HTTP Server**
   ```bash
   python3 -m http.server 8001
   ```

   **Option 2: VS Code Live Server**
   - Install the "Live Server" extension
   - Right-click on `dashboard.html` and select "Open with Live Server"

   **Option 3: Any other static file server**
   - Serve the `frontend` directory on port 8001

3. **Open in browser:**
   - Navigate to `http://localhost:8001/dashboard.html`

### Access Points

- **API Base URL**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (Interactive Swagger UI)
- **API Health Check**: http://localhost:8000/health
- **Frontend Dashboard**: http://localhost:8001/dashboard.html

## Features

### Interactive Visualizations

1. **Crime Trends Over Time** - Time series chart with metric selection buttons
   - Toggle between different crime types and GDP per capita
   - Interactive legend with click-to-toggle functionality
   - Smooth curves and gradient area fills

2. **GDP vs Crime Rates** - Scatter plot with trend analysis
   - Dynamic metric selection (Violent, Property, Murder, etc.)
   - Linear regression trend line with correlation coefficient
   - Color-coded points based on selected metric

3. **State Comparison** - Bar chart with metric buttons
   - Compare states side-by-side
   - Two-letter state abbreviations for clarity
   - Dynamic metric switching

4. **State Comparison Radar Chart** - Multi-dimensional comparison
   - Compare multiple states simultaneously
   - Horizontal legend for better readability
   - Connected to main filter selections

5. **Hierarchical Treemap** - State → Counties visualization
   - Color-coded by crime rate
   - Size represents population
   - Click to toggle county view

6. **Parallel Coordinates** - Multi-variable analysis
   - Interactive axis brushing
   - Color-coded by violent crime rate
   - Filter data by dragging on axes

7. **Crime Rate Distribution** - Box plot visualization
   - Shows distribution of crime rates
   - Outlier detection
   - Statistical quartiles

8. **Correlation Heatmap** - Variable relationships
   - Correlation matrix visualization
   - Horizontal axis labels for readability
   - Tooltips with full variable names

9. **Crime Type Breakdown** - Bar chart
   - Breakdown of different crime types
   - Total crimes summary
   - Color-coded legend

10. **Interactive US Map** - State and county selection
    - Click states to select/deselect
    - Double-click states to view counties
    - Hover over counties to see names
    - Visual highlighting of selected areas

### Filtering & Controls

- **List View**: Traditional dropdown filters for states, years, metrics, and GDP range
- **Map View**: Interactive map with filters displayed below
- **Dynamic Metrics**: Select which crime metrics to visualize across all charts
- **Real-time Updates**: All charts update automatically when filters change
- **Key Metrics Summary**: Dynamic summary cards showing:
  - Total Records
  - Average Violent Crime Rate
  - Unique Counties
  - Average GDP Per Capita

## Technologies

### Backend
- **FastAPI** - Modern, fast web framework for building APIs
- **Pandas** - Data manipulation and analysis
- **NumPy** - Numerical computing
- **SciPy** - Scientific computing and statistics
- **Scikit-learn** - Machine learning utilities

### Frontend
- **Vue.js 3** - Progressive JavaScript framework (via CDN)
- **D3.js v7** - Data-driven document visualization library
- **Bootstrap 5** - CSS framework for responsive design
- **Bootstrap Icons** - Icon library
- **TopoJSON** - Geographic data format for maps

## API Endpoints

### Data Endpoints (`/api/data/`)
- `GET /api/data/` - Get all data
- `GET /api/data/summary` - Get data summary (total records, unique states/counties, year range)
- `GET /api/data/unique/states` - Get list of unique states
- `GET /api/data/unique/counties` - Get list of unique counties (optionally filtered by state)
- `GET /api/data/unique/years` - Get list of unique years
- `GET /api/data/columns` - Get all available columns
- `GET /api/data/metrics` - Get categorized metrics (crime and economic)

### Filter Endpoints (`/api/filter/`)
- `GET /api/filter/` - Filter data by multiple criteria:
  - `states` - Filter by state names
  - `counties` - Filter by county names
  - `years` - Filter by years
  - `gdp_min`, `gdp_max` - GDP per capita range
  - `pop_min`, `pop_max` - Population range
  - `violent_crime_min`, `violent_crime_max` - Violent crime rate range
  - `property_crime_min`, `property_crime_max` - Property crime rate range
  - And more crime-specific filters

### Aggregate Endpoints (`/api/aggregate/`)
- `GET /api/aggregate/state` - Aggregate data by state
- `GET /api/aggregate/year` - Aggregate data by year
- `GET /api/aggregate/county` - Aggregate data by county within a state
- `GET /api/aggregate/timeseries` - Get time series data for specific location and metric

### Statistics Endpoints (`/api/stats/`)
- `GET /api/stats/correlation` - Get correlation matrix for variables
- `GET /api/stats/summary/{variable}` - Get statistical summary for a variable
- `GET /api/stats/trend/{variable}` - Get trend analysis for a variable
- `GET /api/stats/outliers/{variable}` - Identify outliers in a variable

## Dashboard Features

- **Dark Theme**: Modern dark UI with gradient accents
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Filtering**: Instant chart updates as you change filters
- **Interactive Charts**: Hover tooltips, click interactions, and dynamic updates
- **Metric Selection**: Switch between different metrics with button controls
- **Map Integration**: Visual state/county selection with interactive map
- **Dynamic Metrics**: Key statistics update based on current filter selections

## Development

### Running in Development Mode

**Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
- Use any static file server on port 8001
- Or use VS Code Live Server extension

### Project Configuration

- Backend configuration: `backend/app/config.py`
- CORS settings: Configured to allow all origins for development
- Data file path: `backend/data/merged_crime_gdp_population.csv`

