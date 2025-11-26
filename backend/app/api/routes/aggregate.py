from fastapi import APIRouter, Query
from typing import List, Optional
from app.services.aggregator import aggregator

router = APIRouter()

@router.get("/state")
async def aggregate_by_state(
    years: Optional[List[int]] = Query(None),
    metrics: Optional[List[str]] = Query(None)
):
    """Aggregate data by state"""
    result = aggregator.aggregate_by_state(years=years, metrics=metrics)
    return result.to_dict('records')

@router.get("/year")
async def aggregate_by_year(
    states: Optional[List[str]] = Query(None)
):
    """Aggregate data by year"""
    result = aggregator.aggregate_by_year(states=states)
    return result.to_dict('records')

@router.get("/county")
async def aggregate_by_county(
    state: str = Query(..., description="State name"),
    years: Optional[List[int]] = Query(None)
):
    """Aggregate data by county within a state"""
    result = aggregator.aggregate_by_county(state=state, years=years)
    return result.to_dict('records')

@router.get("/timeseries")
async def get_time_series(
    state: Optional[str] = Query(None),
    county: Optional[str] = Query(None),
    metric: str = Query("Violent_Crime_Rate", description="Metric to plot")
):
    """Get time series data"""
    result = aggregator.get_time_series(state=state, county=county, metric=metric)
    return result.to_dict('records')

