import pandas as pd
from typing import List, Optional
from app.services.data_loader import data_loader

class DataFilter:
    def __init__(self):
        self.df = data_loader.load_data()
    
    def filter_data(
        self,
        states: Optional[List[str]] = None,
        counties: Optional[List[str]] = None,
        years: Optional[List[int]] = None,
        gdp_min: Optional[float] = None,
        gdp_max: Optional[float] = None,
        pop_min: Optional[int] = None,
        pop_max: Optional[int] = None,
        violent_crime_min: Optional[float] = None,
        violent_crime_max: Optional[float] = None,
        property_crime_min: Optional[float] = None,
        property_crime_max: Optional[float] = None,
        metric_filters: Optional[dict] = None
    ) -> pd.DataFrame:
        """Apply multiple filters to the dataset"""
        filtered = self.df.copy()
        
        if states:
            filtered = filtered[filtered['State_Name'].isin(states)]
        
        if counties:
            filtered = filtered[filtered['County_Clean'].isin(counties)]
        
        if years:
            filtered = filtered[filtered['Year'].isin(years)]
        
        if gdp_min is not None:
            filtered = filtered[filtered['GDP_Per_Capita'] >= gdp_min]
        
        if gdp_max is not None:
            filtered = filtered[filtered['GDP_Per_Capita'] <= gdp_max]
        
        if pop_min is not None:
            filtered = filtered[filtered['Population'] >= pop_min]
        
        if pop_max is not None:
            filtered = filtered[filtered['Population'] <= pop_max]
        
        if violent_crime_min is not None:
            filtered = filtered[filtered['Violent_Crime_Rate'] >= violent_crime_min]
        
        if violent_crime_max is not None:
            filtered = filtered[filtered['Violent_Crime_Rate'] <= violent_crime_max]
        
        if property_crime_min is not None:
            filtered = filtered[filtered['Property_Crime_Rate'] >= property_crime_min]
        
        if property_crime_max is not None:
            filtered = filtered[filtered['Property_Crime_Rate'] <= property_crime_max]
        
        # Apply dynamic metric filters (for any column with min/max)
        if metric_filters:
            for metric, range_dict in metric_filters.items():
                if metric in filtered.columns:
                    if 'min' in range_dict and range_dict['min'] is not None:
                        filtered = filtered[filtered[metric] >= range_dict['min']]
                    if 'max' in range_dict and range_dict['max'] is not None:
                        filtered = filtered[filtered[metric] <= range_dict['max']]
        
        return filtered
    
    def get_counties_by_state(self, state: str) -> List[str]:
        """Get all counties for a given state"""
        return sorted(
            self.df[self.df['State_Name'] == state]['County_Clean'].unique().tolist()
        )

data_filter = DataFilter()

