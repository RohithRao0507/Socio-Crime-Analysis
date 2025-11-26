from fastapi import APIRouter, Query
from typing import List, Optional, Dict
from app.services.statistics import stats_service

router = APIRouter()

@router.get("/correlation")
async def get_correlation(
    variables: Optional[List[str]] = Query(None),
    states: Optional[List[str]] = Query(None),
    years: Optional[List[int]] = Query(None)
):
    """Get correlation matrix"""
    filters = {}
    if states:
        filters['states'] = states
    if years:
        filters['years'] = years
    
    return stats_service.get_correlation_matrix(variables=variables, filters=filters)

@router.get("/summary/{variable}")
async def get_statistical_summary(
    variable: str,
    states: Optional[List[str]] = Query(None),
    years: Optional[List[int]] = Query(None)
):
    """Get statistical summary for a variable"""
    filters = {}
    if states:
        filters['states'] = states
    if years:
        filters['years'] = years
    
    return stats_service.get_statistical_summary(variable, filters=filters)

@router.get("/trend/{variable}")
async def get_trend_analysis(
    variable: str,
    state: Optional[str] = Query(None)
):
    """Get trend analysis for a variable"""
    return stats_service.get_trend_analysis(variable, state=state)

@router.get("/outliers/{variable}")
async def get_outliers(
    variable: str,
    method: str = Query("iqr"),
    states: Optional[List[str]] = Query(None),
    years: Optional[List[int]] = Query(None)
):
    """Get outliers for a variable"""
    filters = {}
    if states:
        filters['states'] = states
    if years:
        filters['years'] = years
    
    return stats_service.get_outliers(variable, method=method, filters=filters)

