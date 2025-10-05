from flask import Flask, jsonify
from models.impact import NEO
from models.deflection import estimate_deflection
from models.tsunami import is_water_at_location, estimate_tsunami_from_impact
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


@app.route('/tsunami', methods=['POST'])
def tsunami():
    """Estimate whether an impact at lat/lon would produce a tsunami.

    Expects JSON body: { "lat": float, "lon": float, "energy_megatons": float }
    Returns JSON with water detection, elevation (if available), and tsunami estimates when applicable.
    """
    data = request.get_json() or {}
    try:
        lat = float(data.get('lat'))
        lon = float(data.get('lon'))
        energy_megatons = float(data.get('energy_megatons', 0.0))
    except Exception as e:
        return jsonify({"error": "Invalid input: must provide lat, lon, energy_megatons"}), 400

    # Use env key if available
    google_key = os.getenv('GOOGLE_ELEVATION_API_KEY')
    is_water, elevation = is_water_at_location(lat, lon, api_key=google_key)

    result = {
        'lat': lat,
        'lon': lon,
        'elevation_m': elevation,
        'is_water': is_water,
    }

    # If we know it's water, compute tsunami estimates; if unknown, indicate unknown
    if is_water is True:
        # use absolute value of depth for water depth; if elevation negative it's depth below sea level
        water_depth = max(1.0, -elevation) if elevation is not None else 1000.0
        tsunami_est = estimate_tsunami_from_impact(energy_megatons=energy_megatons, water_depth_m=water_depth)
        result['tsunami'] = tsunami_est
    elif is_water is False:
        result['tsunami'] = None
    else:
        result['tsunami'] = None
        result['note'] = 'Water/land unknown (no elevation data available)'

    return jsonify(result)

if __name__ == '__main__':
    # Runs the app in debug mode for development.
    app.run(debug=True)
