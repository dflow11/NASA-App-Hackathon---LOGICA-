
import os
import requests
from datetime import datetime, timedelta

class Deflection:
    def __init__(self):
        self.api_key = os.environ.get("NASA_API_KEY", "DEMO_KEY")
        self.api_url = "https://api.nasa.gov/neo/rest/v1/feed"

    def get_neos(self, start_date=None, end_date=None):
        if not start_date:
            start_date = datetime.now().strftime("%Y-%m-%d")
        if not end_date:
            end_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")

        params = {
            "start_date": start_date,
            "end_date": end_date,
            "api_key": self.api_key,
        }

        try:
            response = requests.get(self.api_url, params=params)
            response.raise_for_status()  # Raise an exception for bad status codes
            data = response.json()
            
            neos = []
            for date in data["near_earth_objects"]:
                for neo in data["near_earth_objects"][date]:
                    neos.append({
                        "name": neo["name"],
                        "id": neo["id"],
                        "estimated_diameter_km": neo["estimated_diameter"]["kilometers"],
                        "relative_velocity_kps": neo["close_approach_data"][0]["relative_velocity"]["kilometers_per_second"],
                        "miss_distance_km": neo["close_approach_data"][0]["miss_distance"]["kilometers"],
                        "absolute_magnitude": neo["absolute_magnitude_h"]
                    })
            return neos

        except requests.exceptions.RequestException as e:
            print(f"Error fetching NEO data: {e}")
            return None

if __name__ == '__main__':
    deflection = Deflection()
    neos = deflection.get_neos()
    if neos:
        for neo in neos:
            print(neo)
