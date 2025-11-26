import pandas as pd
import numpy as np
from scipy import stats
from typing import Dict, List, Optional
from app.services.data_loader import data_loader

class StatisticsService:
    def __init__(self):
        self.df = data_loader.load_data()
    
    def get_correlation_matrix(
        self,
        variables: Optional[List[str]] = None,
        filters: Optional[Dict] = None
    ) -> Dict:
        """Calculate correlation matrix"""
        data = self.df.copy()
        
        # Apply filters if provided
        if filters:
            if 'states' in filters:
                data = data[data['State_Name'].isin(filters['states'])]
            if 'years' in filters:
                data = data[data['Year'].isin(filters['years'])]
        
        default_vars = [
            'GDP_Per_Capita',
            'Violent_Crime_Rate',
            'Property_Crime_Rate',
            'Population'
        ]
        
        vars_to_use = variables if variables else default_vars
        # Only use variables that exist in the dataframe
        vars_to_use = [v for v in vars_to_use if v in data.columns]
        numeric_data = data[vars_to_use].select_dtypes(include=[np.number])
        
        corr_matrix = numeric_data.corr()
        
        return {
            "matrix": corr_matrix.to_dict(),
            "variables": vars_to_use
        }
    
    def get_statistical_summary(
        self,
        variable: str,
        filters: Optional[Dict] = None
    ) -> Dict:
        """Get statistical summary for a variable"""
        data = self.df.copy()
        
        if filters:
            if 'states' in filters:
                data = data[data['State_Name'].isin(filters['states'])]
            if 'years' in filters:
                data = data[data['Year'].isin(filters['years'])]
        
        if variable not in data.columns:
            return {"error": f"Variable {variable} not found"}
        
        values = pd.to_numeric(data[variable], errors='coerce').dropna()
        
        if len(values) == 0:
            return {"error": "No valid values found"}
        
        return {
            "mean": float(values.mean()),
            "median": float(values.median()),
            "std": float(values.std()),
            "min": float(values.min()),
            "max": float(values.max()),
            "q25": float(values.quantile(0.25)),
            "q75": float(values.quantile(0.75)),
            "count": int(len(values))
        }
    
    def get_trend_analysis(
        self,
        variable: str,
        state: Optional[str] = None
    ) -> Dict:
        """Perform trend analysis on a variable over time"""
        data = self.df.copy()
        
        if state:
            data = data[data['State_Name'] == state]
        
        if variable not in data.columns:
            return {"error": f"Variable {variable} not found"}
        
        time_series = data.groupby('Year')[variable].mean().reset_index()
        values = pd.to_numeric(time_series[variable], errors='coerce').dropna()
        years = time_series.loc[values.index, 'Year'].values
        
        if len(values) < 2:
            return {"error": "Insufficient data for trend analysis"}
        
        # Linear regression for trend
        slope, intercept, r_value, p_value, std_err = stats.linregress(years, values)
        
        return {
            "trend": "increasing" if slope > 0 else "decreasing",
            "slope": float(slope),
            "r_squared": float(r_value ** 2),
            "p_value": float(p_value),
            "years": years.tolist(),
            "values": values.tolist()
        }
    
    def get_outliers(
        self,
        variable: str,
        method: str = "iqr",
        filters: Optional[Dict] = None
    ) -> List[Dict]:
        """Identify outliers in a variable"""
        data = self.df.copy()
        
        if filters:
            if 'states' in filters:
                data = data[data['State_Name'].isin(filters['states'])]
            if 'years' in filters:
                data = data[data['Year'].isin(filters['years'])]
        
        if variable not in data.columns:
            return []
        
        values = pd.to_numeric(data[variable], errors='coerce')
        
        if method == "iqr":
            Q1 = values.quantile(0.25)
            Q3 = values.quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            outliers = data[(values < lower_bound) | (values > upper_bound)]
        
        return outliers[['State_Name', 'County_Clean', 'Year', variable]].to_dict('records')

stats_service = StatisticsService()

