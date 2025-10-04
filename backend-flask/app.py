from flask import Flask, jsonify
from models.impact import NEO
from dotenv import load_dotenv
from flask_cors import CORS
import os

# Load environment variables from .env file in the parent directory
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)
neo_model = NEO()

@app.after_request
def add_cors_headers(response):
    response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    return response

@app.route('/')
def index():
    """A simple index route to show the service is running."""
    return jsonify({"message": "Welcome to the NASA NEO API proxy! Try the /neo endpoint."})

@app.route('/neo')
def get_neo_data():
    """
    Fetches Near Earth Object data from NASA's API.
    """
    neos = neo_model.get_neos()
    if neos is not None:
        return jsonify(neos)
    else:
        return jsonify({"error": "Failed to retrieve data from NASA API."}), 500

if __name__ == '__main__':
    # Runs the app in debug mode for development.
    app.run(debug=True)
