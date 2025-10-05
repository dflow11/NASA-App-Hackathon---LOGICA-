from flask import Flask, jsonify
from models.impact import NEO
from models.deflection import estimate_deflection
from flask import request
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


@app.route('/deflect', methods=['POST'])
def deflect():
    """Estimate the required kinetic impactor parameters and cost to deflect an asteroid.

    Expected JSON body:
    {
      "diameter_m": float,
      "relative_velocity_m_s": float,
      "lead_time_days": float,
      "impactor_velocity_m_s": float,    # optional
      "beta": float,                      # optional
      "cost_per_launch_usd": float        # optional
    }
    """
    data = request.get_json() or {}
    try:
        diameter_m = float(data.get('diameter_m', 0))
        rel_vel = float(data.get('relative_velocity_m_s', 0))
        lead_days = float(data.get('lead_time_days', 1))
        impactor_v = float(data.get('impactor_velocity_m_s', 10000))
        beta = float(data.get('beta', 1.0))
        cost_per_launch = float(data.get('cost_per_launch_usd', 50_000_000))
        payload_per_launch_kg = float(data.get('payload_per_launch_kg', 22800))

        result = estimate_deflection(
            diameter_m=diameter_m,
            relative_velocity_m_s=rel_vel,
            lead_time_days=lead_days,
            impactor_velocity_m_s=impactor_v,
            beta=beta,
            cost_per_launch_usd=cost_per_launch,
            payload_per_launch_kg=payload_per_launch_kg
        )

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route('/deflect_orbit', methods=['POST'])
def deflect_orbit():
    """Placeholder for orbit-propagation based deflection estimation.

    Returns 501 Not Implemented. Future implementation notes:
    - Accept orbital elements or NEO id and propagation epoch
    - Use a library such as poliastro or SPICE to propagate orbital states
    - Compute required delta-v vector and mission delta-v for intercept
    - Return detailed mission mass and cost estimates
    """
    return jsonify({
        "error": "High-fidelity orbit propagation not implemented yet. This endpoint is a stub.",
        "notes": "To implement: add orbital propagator (poliastro/orekit), accept orbital elements, compute delta-v and impact point shift."
    }), 501

if __name__ == '__main__':
    # Runs the app in debug mode for development.
    app.run(debug=True)
