import os
import math
import requests

# Simple tsunami estimation utilities for an impact into water.
# These are highly approximate and intended for demonstration only.

# Physical constants
RHO_WATER = 1025.0  # kg/m^3 (sea water)
G = 9.80665  # m/s^2
JOULES_PER_MEGATON = 4.184e15


def get_google_elevation(lat, lon, api_key=None):
	"""Query Google Elevation API for a single lat/lon. Returns elevation in meters or None on error.

	Note: Google Elevation does not always provide true bathymetry; negative elevations may not be
	available depending on coverage. The caller should handle None gracefully.
	"""
	api_key = api_key or os.getenv('GOOGLE_ELEVATION_API_KEY')
	if not api_key:
		return None

	url = 'https://maps.googleapis.com/maps/api/elevation/json'
	params = {'locations': f'{lat},{lon}', 'key': api_key}
	try:
		resp = requests.get(url, params=params, timeout=10)
		resp.raise_for_status()
		data = resp.json()
		if data.get('status') == 'OK' and data.get('results'):
			return float(data['results'][0].get('elevation'))
	except requests.RequestException:
		return None
	return None


def is_water_at_location(lat, lon, api_key=None, elevation_threshold_m=0.0):
	"""Return a tuple (is_water:boolean, elevation_m:float or None).

	is_water is True when reported elevation <= elevation_threshold_m. If elevation is None
	(API unavailable or no key), returns (None, None) to indicate unknown.
	"""
	elev = get_google_elevation(lat, lon, api_key=api_key)

	# If elevation could not be fetched, try OSM reverse-geocoding to detect water bodies
	if elev is None:
		osm_water = _osm_is_water(lat, lon)
		if osm_water is None:
			return (None, None)
		return (osm_water, None)

	# If elevation is at or below threshold, treat as water (ocean)
	if elev <= elevation_threshold_m:
		return (True, elev)

	# Elevation > threshold (positive elevations). Could still be an inland lake/reservoir.
	# Use OSM reverse-geocoding as a fallback to detect named water bodies (lakes, rivers, etc.).
	osm_water = _osm_is_water(lat, lon)
	if osm_water:
		return (True, elev)

	# If both elevation and OSM say land, try searching nearby points to see if the coordinate is just on the shoreline
	nearby = _find_nearby_water(lat, lon, api_key=api_key)
	if nearby and nearby[0] is True:
		found_elev = nearby[1]
		return (True, found_elev)

	return (False, elev)


def _osm_is_water(lat, lon, timeout=6):
	"""Use OpenStreetMap Nominatim reverse geocoding to detect whether the coordinate lies on a water body.

	Returns True/False when confident, or None if the service couldn't determine (error/timeout).
	"""
	try:
		url = 'https://nominatim.openstreetmap.org/reverse'
		params = {
			'format': 'jsonv2',
			'lat': float(lat),
			'lon': float(lon),
			'zoom': 10,
			'addressdetails': 0,
		}
		headers = {'User-Agent': 'NASA-App-Hackathon-LOGICA/1.0 (+https://example.invalid)'}
		resp = requests.get(url, params=params, headers=headers, timeout=timeout)
		resp.raise_for_status()
		j = resp.json()
		cls = j.get('class')
		typ = j.get('type')
		# Nominatim uses 'water' class for bodies of water; types include 'lake','river','reservoir', etc.
		if cls == 'water':
			return True
		if typ in ('lake', 'river', 'reservoir', 'pond', 'bay', 'water'):
			return True
		# In some cases reverse geocoding returns 'landuse' or 'natural' with type 'water'
		if j.get('category') == 'water' or j.get('display_name', '').lower().find('lake') >= 0:
			return True
		return False
	except requests.RequestException:
		return None


def _find_nearby_water(lat, lon, api_key=None, radii_m=(1000, 3000, 5000), bearings=(0,45,90,135,180,225,270,315)):
	"""Search nearby points for water using Google Elevation and OSM reverse-geocoding.

	Returns a tuple (is_water:boolean, elevation_m:float or None, found_lat, found_lon) where
	is_water True indicates a nearby water point was found. If nothing found returns (False, None, None, None)
	or (None, None, None, None) on error.
	"""
	# quick helpers
	def dest_point(lat0, lon0, dx_m, dy_m):
		# approximate: 1 deg lat ~ 111000 m; 1 deg lon ~ 111000 * cos(lat)
		lat_deg = lat0 + (dy_m / 111000.0)
		lon_deg = lon0 + (dx_m / (111000.0 * max(0.0001, math.cos(math.radians(lat0)))))
		return lat_deg, lon_deg

	try:
		# First quick Overpass check at the exact point and small radius
		if _overpass_has_water(lat, lon, radius=200):
			return (True, None, lat, lon)
		for r in radii_m:
			for b in bearings:
				rad = math.radians(b)
				dx = r * math.sin(rad)
				dy = r * math.cos(rad)
				lat2, lon2 = dest_point(lat, lon, dx, dy)

				# First try Google elevation here
				elev = get_google_elevation(lat2, lon2, api_key=api_key)
				if elev is not None and elev <= 0.0:
					return (True, elev, lat2, lon2)

				# Next try OSM reverse
				osm = _osm_is_water(lat2, lon2)
				if osm is True:
					# if we couldn't get elevation but OSM says water, return True with None elevation
					return (True, elev, lat2, lon2)

				# As a stronger fallback, ask Overpass for water features near this location
				try:
					if _overpass_has_water(lat2, lon2, radius=200):
						return (True, elev, lat2, lon2)
				except Exception:
					pass

		# nothing found
		return (False, None, None, None)
	except Exception:
		return (None, None, None, None)


def _overpass_has_water(lat, lon, radius=200, timeout=10):
		"""Query Overpass API for water features near lat/lon within radius (meters).

		Returns True if any water polygon/way/node is found nearby, False otherwise. Raises on request issues.
		"""
		# Build Overpass QL searching for natural=water, water=lake/river/reservoir, or leisure=swimming_area
		q = f"""
		[out:json][timeout:{timeout}];
		(
			way(around:{radius},{lat},{lon})[natural=water];
			way(around:{radius},{lat},{lon})[water];
			relation(around:{radius},{lat},{lon})[natural=water];
			relation(around:{radius},{lat},{lon})[water];
		);
		out count;
		"""
		url = 'https://overpass-api.de/api/interpreter'
		headers = {'User-Agent': 'NASA-App-Hackathon-LOGICA/1.0'}
		resp = requests.post(url, data=q.encode('utf-8'), headers=headers, timeout=timeout)
		resp.raise_for_status()
		j = resp.json()
		# The response with out count contains an 'elements' array with one object containing 'tags' possibly.
		# A simple heuristic: if total elements > 0, Overpass found something.
		if isinstance(j, dict) and 'elements' in j and len(j['elements']) > 0:
				return True
		return False


def estimate_tsunami_from_impact(energy_megatons, water_depth_m):
	"""Estimate tsunami characteristics from impact energy (Mt TNT) and local water depth (m).

	Returns a dict with approximate initial_wave_height_m (near source),
	shore_wave_height_m (rough estimate after shoaling), wave_energy_megatons (approx),
	and a simple damage_level string.

	These formulas are intentionally simple approximations for demo purposes and
	are NOT a substitute for scientific tsunami models.
	"""
	# Basic conversions
	energy_joules = float(energy_megatons) * JOULES_PER_MEGATON

	# Fraction of kinetic energy that couples into the water to generate waves.
	# This is highly uncertain; choose a small efficiency.
	coupling_efficiency = 0.01
	coupled_energy = energy_joules * coupling_efficiency

	# Empirical scaling: initial wave amplitude near source scales with cube-root of energy
	# and inversely with depth (deeper water spreads energy more).
	# constants chosen to produce reasonable demo numbers
	C = 0.12
	depth_factor = 1.0 / math.sqrt(max(1.0, water_depth_m))
	initial_wave_m = C * (float(energy_megatons) ** (1.0 / 3.0)) * depth_factor

	# Shoaling: waves grow as they approach shallower water. Simple model: H_shore = H0 * (D_source / D_nearshore)^0.25
	# We'll assume nearshore depth of 50 m for generic coastline.
	nearshore_depth = 50.0
	shoaling_factor = (max(1.0, water_depth_m) / nearshore_depth) ** 0.25
	shore_wave_m = initial_wave_m * max(0.5, shoaling_factor)

	# Estimate wave energy retained in the tsunami (very rough): use potential energy ~ 0.5 * rho * g * H^2 * A
	# Choose a nominal affected area A based on energy and depth: A ~ coupled_energy / (rho*g*H)
	H = max(0.001, initial_wave_m)
	try:
		A = coupled_energy / (RHO_WATER * G * H)
	except Exception:
		A = 0.0
	wave_energy_joules = 0.5 * RHO_WATER * G * (H ** 2) * max(0.0, A)
	wave_energy_megatons = wave_energy_joules / JOULES_PER_MEGATON if wave_energy_joules > 0 else 0.0

	# Simple damage classification
	if shore_wave_m >= 10:
		damage = 'catastrophic'
	elif shore_wave_m >= 3:
		damage = 'severe'
	elif shore_wave_m >= 1:
		damage = 'moderate'
	elif shore_wave_m >= 0.2:
		damage = 'minor'
	else:
		damage = 'negligible'

	# Estimated inundation distance (very rough): meters of inundation ~ shore_wave_m * 100
	inundation_m = shore_wave_m * 100.0

	return {
		'initial_wave_height_m': initial_wave_m,
		'shore_wave_height_m': shore_wave_m,
		'wave_energy_megatons': wave_energy_megatons,
		'inundation_m': inundation_m,
		'damage_level': damage,
		'coupled_energy_joules': coupled_energy,
		'assumptions': {
			'coupling_efficiency': coupling_efficiency,
			'nearshore_depth_m': nearshore_depth,
		}
	}


if __name__ == '__main__':
	# Quick demo when executed directly
	print(estimate_tsunami_from_impact(energy_megatons=1000, water_depth_m=4000))

