from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from typing import List, Optional
import pandas as pd
import io
from app.services.data_filter import data_filter

router = APIRouter()

@router.get("/csv")
async def export_csv(
    states: Optional[List[str]] = Query(None),
    years: Optional[List[int]] = Query(None),
    format: str = Query("csv", regex="^(csv|json)$")
):
    """Export filtered data as CSV or JSON"""
    filtered = data_filter.filter_data(states=states, years=years)
    
    if format == "csv":
        output = io.StringIO()
        filtered.to_csv(output, index=False)
        output.seek(0)
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=crime_gdp_data.csv"}
        )
    else:
        return filtered.to_dict('records')

