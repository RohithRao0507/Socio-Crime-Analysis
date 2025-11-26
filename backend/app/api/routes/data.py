from fastapi import APIRouter, Query
from typing import Optional
from app.services.data_loader import data_loader
from app.services.data_filter import data_filter

router = APIRouter()

@router.get("/")
async def get_all_data():
    """Get all data (with pagination for large datasets)"""
    df = data_loader.load_data()
    return df.to_dict('records')

@router.get("/summary")
async def get_data_summary():
    """Get dataset summary"""
    return data_loader.get_data_summary()

@router.get("/unique/states")
async def get_unique_states():
    """Get all unique states"""
    return data_loader.get_unique_values('State_Name')

@router.get("/unique/counties")
async def get_unique_counties(state: Optional[str] = Query(None)):
    """Get all unique counties, optionally filtered by state"""
    if state:
        return data_filter.get_counties_by_state(state)
    return data_loader.get_unique_values('County_Clean')

@router.get("/unique/years")
async def get_unique_years():
    """Get all unique years"""
    return sorted(data_loader.get_unique_values('Year'))

@router.get("/columns")
async def get_available_columns():
    """Get all available columns in the dataset"""
    df = data_loader.load_data()
    return {
        "columns": df.columns.tolist(),
        "numeric_columns": df.select_dtypes(include=['number']).columns.tolist(),
        "categorical_columns": df.select_dtypes(include=['object']).columns.tolist()
    }

@router.get("/metrics")
async def get_available_metrics():
    """Get all available crime and economic metrics"""
    df = data_loader.load_data()
    numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
    
    # Categorize metrics
    crime_metrics = [col for col in numeric_cols if any(term in col.lower() for term in ['crime', 'murder', 'rape', 'robbery', 'assault', 'burglary', 'larceny', 'theft'])]
    economic_metrics = [col for col in numeric_cols if any(term in col.lower() for term in ['gdp', 'population'])]
    other_metrics = [col for col in numeric_cols if col not in crime_metrics + economic_metrics and col != 'Year']
    
    return {
        "crime_metrics": sorted(crime_metrics),
        "economic_metrics": sorted(economic_metrics),
        "other_metrics": sorted(other_metrics),
        "all_metrics": sorted(numeric_cols)
    }

