# Socio-Crime Analysis Dashboard

An interactive web-based data visualization dashboard for exploring relationships between crime rates, economic indicators (GDP), and population demographics across U.S. counties (2011-2017).

## 🎯 Project Overview

This project provides an interactive dashboard that enables users to:
- Explore crime statistics across U.S. counties
- Analyze relationships between crime rates and economic indicators
- Visualize trends over time (2011-2017)
- Compare states and counties using multiple visualization types
- Perform statistical analysis and correlation studies

## 🏗️ Architecture

- **Backend**: FastAPI (Python) - RESTful API for data processing and analysis
- **Frontend**: Vue.js + D3.js - Interactive visualizations and user interface
- **Data**: Merged dataset combining crime, GDP, and population data

## 📁 Project Structure

```
Socio-Crime-Analysis/
├── backend/          # FastAPI backend
├── frontend/         # Vue.js frontend
├── data/             # Data files
└── docs/             # Documentation
```

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js (optional, for frontend development)

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
# Use any static server
python3 -m http.server 8001
# Or use VS Code Live Server
```

### Access
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Frontend**: http://localhost:8001

## 📊 Features

- **Interactive Maps**: Choropleth maps showing crime rates by county
- **Time Series Analysis**: Trends over time (2011-2017)
- **Correlation Analysis**: Relationships between variables
- **Advanced Visualizations**: Parallel Coordinates, Treemaps, Sunburst charts
- **Filtering**: Multi-criteria filtering (state, county, year, ranges)
- **Statistical Analysis**: Correlations, trends, outliers

## 🛠️ Technologies

- **Backend**: FastAPI, Pandas, NumPy, SciPy
- **Frontend**: Vue.js, D3.js, Bootstrap
- **Data**: CSV (merged crime, GDP, population data)

## 📝 API Endpoints

- `/api/data/` - Get all data, summaries, unique values
- `/api/filter/` - Multi-criteria filtering
- `/api/aggregate/` - State/year/county aggregations
- `/api/stats/` - Statistical analysis (correlations, trends)
- `/api/export/` - Export filtered data

