import os
from datetime import datetime, timedelta
from flask import Flask, jsonify, request
import requests
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()


app = Flask(__name__)

# set 'NASA_API_KEY' in the environment, or temporarily replace
# 'API_KEY_HERE' with the actual key for testing.
NASA_API_KEY = os.getenv('NASA_API_KEY')
NASA_NEO_API_URL = "https://aspi.nasa.gov/neo/rest/v1/feed"

@app.route('/')
def index():
    """A simple index route to show the service is running."""
    return jsonify({"message": "Welcome to the NASA NEO API proxy! Try the /neo endpoint."})

@app.route('/neo')
def get_neo_data():
    """
    Fetches Near Earth Object data from NASA's API for the past 7 days.
    """
# A simple check to ensure the API key is set
    if not NASA_API_KEY:
        return jsonify({"error": "NASA_API_KEY is not set. Please add it to your .env file."}), 500
    # Calculate start and end dates for the API query (e.g., the last 7 days)
    end_date = datetime.today()
    start_date = end_date - timedelta(days=7)

    params = {
        'start_date': start_date.strftime('%Y-%m-%d'),
        'end_date': end_date.strftime('%Y-%m-%d'),
        'api_key': NASA_API_KEY
    }

    try:
        response = requests.get(NASA_NEO_API_URL, params=params)
        # Raise an exception for bad status codes (4xx or 5xx)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        # Handle connection errors, timeouts, etc.
        return jsonify({"error": f"Failed to retrieve data from NASA API: {e}"}), 500

if __name__ == '__main__':
    # Runs the app in debug mode for development.
    app.run(debug=True)
