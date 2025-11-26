from pydantic_settings import BaseSettings
from typing import List
from pathlib import Path

class Settings(BaseSettings):
    # API Settings
    API_TITLE: str = "Socio-Crime Analysis Dashboard API"
    API_VERSION: str = "1.0.0"
    
    # CORS - Allow all origins for development
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:8000",
        "http://localhost:8001",
        "http://localhost:3000",
        "http://127.0.0.1:5500",  # VS Code Live Server
        "http://127.0.0.1:8001",  # Alternative localhost
        "http://[::]:8001",  # IPv6 localhost
        "http://[::1]:8001",  # IPv6 localhost alternative
        "*"  # Allow all origins for development
    ]
    
    # Data Settings
    DATA_FILE_PATH: str = str(Path(__file__).parent.parent / "data" / "merged_crime_gdp_population.csv")
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()

