import pandas as pd
from pathlib import Path
from app.config import settings
from typing import Optional

class DataLoader:
    _instance = None
    _data: Optional[pd.DataFrame] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def load_data(self) -> pd.DataFrame:
        """Load and cache the CSV data"""
        if self._data is None:
            data_path = Path(settings.DATA_FILE_PATH)
            
            if not data_path.exists():
                raise FileNotFoundError(f"Data file not found at {data_path}")
            
            self._data = pd.read_csv(data_path)
            
            # Clean data types
            numeric_columns = [
                'Year', 'Population', 'Real_GDP', 'GDP_Per_Capita',
                'Violent_Crime_Rate', 'Property_Crime_Rate', 'Total_Crime_Rate',
                'Violent crime', 'Property crime', 'Burglary', 'Larceny-theft',
                'Motor vehicle theft', 'Robbery', 'Aggravated assault',
                'Murder and nonnegligent manslaughter', 'Forcible rape'
            ]
            
            for col in numeric_columns:
                if col in self._data.columns:
                    self._data[col] = pd.to_numeric(self._data[col], errors='coerce')
            
            # Drop rows with critical missing values
            self._data = self._data.dropna(subset=['State_Name', 'County_Clean', 'Year'])
        
        return self._data.copy()
    
    def get_unique_values(self, column: str) -> list:
        """Get unique values for a column"""
        df = self.load_data()
        if column not in df.columns:
            return []
        return sorted(df[column].dropna().unique().tolist())
    
    def get_data_summary(self) -> dict:
        """Get summary statistics of the dataset"""
        df = self.load_data()
        return {
            "total_records": len(df),
            "unique_states": int(df['State_Name'].nunique()),
            "unique_counties": int(df.groupby(['State_Name', 'County_Clean']).ngroups),
            "year_range": {
                "min": int(df['Year'].min()),
                "max": int(df['Year'].max())
            },
            "columns": df.columns.tolist()
        }

# Singleton instance
data_loader = DataLoader()

