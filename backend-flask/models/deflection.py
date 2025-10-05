import math

# Simple kinetic impactor deflection model
# Assumptions and notes:
# - Asteroid is roughly spherical with given diameter (m) and density (kg/m^3)
# - A kinetic impactor transfers momentum to the asteroid. We estimate required delta-v
#   to shift the impact point off Earth given a lead time (seconds) and Earth radius + atmospheric
# - This is a highly simplified model for demonstration and not mission-grade.


def asteroid_mass_from_diameter(diameter_m, density_kg_m3=2700):
    """Estimate mass of a spherical asteroid from diameter (meters)."""
    radius = diameter_m / 2.0
    volume = (4.0/3.0) * math.pi * radius**3
    return density_kg_m3 * volume


def required_delta_v_to_shift(distance_to_shift_m, lead_time_s):
    """Compute average delta-v needed to shift a body by a lateral distance over a lead time.

    This uses a simple kinematic relation: delta_v = distance / lead_time (approximate, assumes
    lateral impulse and linear motion). For small perturbations and long lead times this is fine.
    """
    if lead_time_s <= 0:
        return float('inf')
    return distance_to_shift_m / lead_time_s


def kinetic_impactor_mass(asteroid_mass, delta_v_needed, impactor_velocity_m_s, momentum_transfer_coeff=1.0):
    """Estimate impactor mass required using momentum conservation with a momentum transfer coefficient beta.

    momentum_transfer_coeff (beta) accounts for ejecta enhancing momentum transfer. A value of 1 means
    fully inelastic collision (worst case); higher values represent more efficient transfer.

    Using: m_impactor * v_impactor * beta = m_asteroid * delta_v_needed
    => m_impactor = (m_asteroid * delta_v_needed) / (v_impactor * beta)
    """
    if impactor_velocity_m_s <= 0 or momentum_transfer_coeff <= 0:
        return float('inf')
    return (asteroid_mass * delta_v_needed) / (impactor_velocity_m_s * momentum_transfer_coeff)


def estimate_deflection(diameter_m, relative_velocity_m_s, lead_time_days,
                        distance_shift_m=6400000,  # approx Earth radius to ensure miss
                        density_kg_m3=2700,
                        impactor_velocity_m_s=10000,
                        beta=1.0,
                        cost_per_launch_usd=50_000_000,
                        payload_per_launch_kg=22800):
    """Run a full estimate for a kinetic impactor deflection.

    Inputs:
    - diameter_m: asteroid diameter in meters
    - relative_velocity_m_s: asteroid approach speed in m/s (for energy context)
    - lead_time_days: time before impact when intervention occurs (days)
    - distance_shift_m: lateral shift desired (m). Default set to Earth radius ~6.4e6 m
    - impactor_velocity_m_s: speed of incoming impactor relative to asteroid (m/s)
    - beta: momentum enhancement factor (>1 if ejecta helps)
    - cost_per_launch_usd: cost per rocket launch

    Returns dict with asteroid mass, required delta-v, impactor mass, number of launches, cost.
    """
    # Convert lead time
    lead_time_s = max(lead_time_days * 24 * 3600.0, 1.0)

    m_asteroid = asteroid_mass_from_diameter(diameter_m, density_kg_m3)

    # delta-v needed (m/s)
    delta_v = required_delta_v_to_shift(distance_shift_m, lead_time_s)

    # required impactor mass (kg)
    m_impactor = kinetic_impactor_mass(m_asteroid, delta_v, impactor_velocity_m_s, beta)

    # Safety: at least a small fraction if calculation undervalues
    m_impactor = max(m_impactor, 0.0)

    # Determine number of launches using provided payload capacity (kg)
    launches = math.ceil(m_impactor / payload_per_launch_kg) if payload_per_launch_kg > 0 else float('inf')

    total_cost = launches * cost_per_launch_usd

    return {
        'asteroid_mass_kg': m_asteroid,
        'required_delta_v_m_s': delta_v,
        'impactor_mass_kg': m_impactor,
        'launches_required': launches,
        'estimated_cost_usd': total_cost,
        'assumptions': {
            'density_kg_m3': density_kg_m3,
            'distance_shift_m': distance_shift_m,
            'impactor_velocity_m_s': impactor_velocity_m_s,
            'beta': beta,
            'payload_per_launch_kg': payload_per_launch_kg,
            'cost_per_launch_usd': cost_per_launch_usd,
        }
    }
