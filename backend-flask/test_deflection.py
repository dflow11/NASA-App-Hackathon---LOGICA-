from models.deflection import estimate_deflection

if __name__ == '__main__':
    # Example: 100-meter diameter, relative speed 20 km/s, lead time 10 years
    res = estimate_deflection(diameter_m=100.0, relative_velocity_m_s=20000.0, lead_time_days=365*10,
                              impactor_velocity_m_s=11000.0, beta=2.0, cost_per_launch_usd=50_000_000)
    import json
    print(json.dumps(res, indent=2))
