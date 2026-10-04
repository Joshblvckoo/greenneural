from pydantic import BaseModel


class CarbonIntensityQuery(BaseModel):
    provider: str
    region: str


class CleanestRegionQuery(BaseModel):
    provider: str
