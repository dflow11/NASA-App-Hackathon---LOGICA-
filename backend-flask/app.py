from flask import Flask, jsonify
from models.deflection import Deflection

app = Flask(__name__)
deflection_model = Deflection()

@app.route('/')
def index():
    """A simple index route to show the service is running."""
    return jsonify({"message": "Welcome to the NASA NEO API proxy! Try the /neo endpoint."})

@app.route('/neo')
def get_neo_data():
    """
    Fetches Near Earth Object data from NASA's API.
    """
    neos = deflection_model.get_neos()
    if neos is not None:
        return jsonify(neos)
    else:
        return jsonify({"error": "Failed to retrieve data from NASA API."}), 500

if __name__ == '__main__':
    # Runs the app in debug mode for development.
    app.run(debug=True)
