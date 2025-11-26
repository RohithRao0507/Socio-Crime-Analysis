from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import data, filter, aggregate, statistics, export
from app.config import settings

app = FastAPI(
    title=settings.API_TITLE,
    description="API for interactive crime, GDP, and population data visualization",
    version=settings.API_VERSION
)

# CORS middleware - allow frontend to access API
# For development, allow all origins
# Note: When allow_origins=["*"], allow_credentials must be False
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,  # Must be False when using "*"
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(data.router, prefix="/api/data", tags=["data"])
app.include_router(filter.router, prefix="/api/filter", tags=["filter"])
app.include_router(aggregate.router, prefix="/api/aggregate", tags=["aggregate"])
app.include_router(statistics.router, prefix="/api/stats", tags=["statistics"])
app.include_router(export.router, prefix="/api/export", tags=["export"])

@app.get("/")
async def root():
    return {
        "message": settings.API_TITLE,
        "version": settings.API_VERSION,
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

