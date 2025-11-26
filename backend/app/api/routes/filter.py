from fastapi import APIRouter, Query, Body
from typing import List, Optional, Dict
from app.services.data_filter import data_filter

router = APIRouter()

@router.get("/")
async def filter_data(
    states: Optional[List[str]] = Query(None),
    counties: Optional[List[str]] = Query(None),
    years: Optional[List[int]] = Query(None),
    gdp_min: Optional[float] = Query(None),
    gdp_max: Optional[float] = Query(None),
    pop_min: Optional[int] = Query(None),
    pop_max: Optional[int] = Query(None),
    violent_crime_min: Optional[float] = Query(None),
    violent_crime_max: Optional[float] = Query(None),
    property_crime_min: Optional[float] = Query(None),
    property_crime_max: Optional[float] = Query(None)
):
    """Filter data based on multiple criteria"""
    filtered = data_filter.filter_data(
        states=states,
        counties=counties,
        years=years,
        gdp_min=gdp_min,
        gdp_max=gdp_max,
        pop_min=pop_min,
        pop_max=pop_max,
        violent_crime_min=violent_crime_min,
        violent_crime_max=violent_crime_max,
        property_crime_min=property_crime_min,
        property_crime_max=property_crime_max
    )
    
    return {
        "count": len(filtered),
        "data": filtered.to_dict('records')
    }

@router.post("/advanced")
async def filter_data_advanced(
    states: Optional[List[str]] = Body(None),
    counties: Optional[List[str]] = Body(None),
    years: Optional[List[int]] = Body(None),
    metric_filters: Optional[Dict[str, Dict[str, float]]] = Body(None)
):
    """Advanced filtering with dynamic metric filters"""
    filtered = data_filter.filter_data(
        states=states,
        counties=counties,
        years=years,
        metric_filters=metric_filters
    )
    
    return {
        "count": len(filtered),
        "data": filtered.to_dict('records')
    }

