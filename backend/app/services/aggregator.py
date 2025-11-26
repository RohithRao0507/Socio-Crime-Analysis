import pandas as pd
from typing import List, Optional
from app.services.data_loader import data_loader

class Aggregator:
    def __init__(self):
        self.df = data_loader.load_data()
    
    def aggregate_by_state(
        self,
        years: Optional[List[int]] = None,
        metrics: Optional[List[str]] = None
    ) -> pd.DataFrame:
        """Aggregate data by state"""
        data = self.df.copy()
        
        if years:
            data = data[data['Year'].isin(years)]
        
        default_metrics = {
            'Violent_Crime_Rate': 'mean',
            'Property_Crime_Rate': 'mean',
            'GDP_Per_Capita': 'mean',
            'Population': 'sum',
            'Violent crime': 'sum',
            'Property crime': 'sum'
        }
        
        agg_dict = default_metrics
        if metrics:
            agg_dict = {k: v for k, v in default_metrics.items() if k in metrics}
        
        aggregated = data.groupby('State_Name').agg(agg_dict).reset_index()
        return aggregated
    
    def aggregate_by_year(
        self,
        states: Optional[List[str]] = None
    ) -> pd.DataFrame:
        """Aggregate data by year"""
        data = self.df.copy()
        
        if states:
            data = data[data['State_Name'].isin(states)]
        
        aggregated = data.groupby('Year').agg({
            'Violent_Crime_Rate': 'mean',
            'Property_Crime_Rate': 'mean',
            'GDP_Per_Capita': 'mean',
            'Population': 'sum',
            'Violent crime': 'sum',
            'Property crime': 'sum'
        }).reset_index()
        
        return aggregated
    
    def aggregate_by_county(
        self,
        state: str,
        years: Optional[List[int]] = None
    ) -> pd.DataFrame:
        """Aggregate data by county within a state"""
        data = self.df[self.df['State_Name'] == state].copy()
        
        if years:
            data = data[data['Year'].isin(years)]
        
        aggregated = data.groupby('County_Clean').agg({
            'Violent_Crime_Rate': 'mean',
            'Property_Crime_Rate': 'mean',
            'GDP_Per_Capita': 'mean',
            'Population': 'mean',
            'Violent crime': 'sum',
            'Property crime': 'sum'
        }).reset_index()
        
        return aggregated
    
    def get_time_series(
        self,
        state: Optional[str] = None,
        county: Optional[str] = None,
        metric: str = 'Violent_Crime_Rate'
    ) -> pd.DataFrame:
        """Get time series data for a specific location and metric"""
        data = self.df.copy()
        
        if state:
            data = data[data['State_Name'] == state]
        if county:
            data = data[data['County_Clean'] == county]
        
        if metric not in data.columns:
            metric = 'Violent_Crime_Rate'
        
        time_series = data.groupby('Year')[metric].mean().reset_index()
        time_series.columns = ['Year', 'Value']
        
        return time_series

aggregator = Aggregator()

