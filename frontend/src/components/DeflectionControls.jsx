import React, { useState, useEffect } from 'react';
import '../css/DeflectionControls.css';

function daysUntil(dateString) {
  if (!dateString) return null;
  const now = new Date();
  const d = new Date(dateString);
  if (isNaN(d)) return null;
  const diffMs = d.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}


function DeflectionControls({ asteroidData }) {
  const [leadDays, setLeadDays] = useState(365);
  const [approachDate, setApproachDate] = useState(null);
  const [beta, setBeta] = useState(1.0);
  const [impactorV, setImpactorV] = useState(11000);
  const rocketPresets = {
    falcon9: { label: 'Falcon 9', payload: 22800, cost: 50000000 },
    falconHeavy: { label: 'Falcon Heavy', payload: 63800, cost: 150000000 },
    sls: { label: 'SLS', payload: 31000, cost: 200000000 },
  };
  const [selectedRocket, setSelectedRocket] = useState('falcon9');
  const [costPerLaunch, setCostPerLaunch] = useState(rocketPresets.falcon9.cost);
  const [payloadPerLaunchKg, setPayloadPerLaunchKg] = useState(rocketPresets.falcon9.payload);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('compute_mass');
  const [singleImpactorMassKg, setSingleImpactorMassKg] = useState(610); // DART ~610 kg
  useEffect(() => {
    // If asteroidData includes a close approach date, update lead time default
    if (asteroidData && asteroidData.close_approach_date) {
      const days = daysUntil(asteroidData.close_approach_date);
      if (days !== null) {
        setLeadDays(days);
        setApproachDate(asteroidData.close_approach_date);
      }
    }
  }, [asteroidData]);

  const runEstimate = async () => {
    if (!asteroidData) return;
    setLoading(true);
    setError(null);
    setResult(null);

    // If mode is single-impactor, compute locally (no backend call needed)
    if (mode === 'single_impactor') {
      try {
        const diameter_m = (asteroidData.size || 0) * 1000;
        const density = 2700;
        const m_asteroid = (4/3) * Math.PI * Math.pow(diameter_m/2, 3) * density;
        const delta_v = (singleImpactorMassKg * impactorV * 1.0) / m_asteroid; // beta=1 for DART-like
        const lateral_shift = delta_v * (leadDays * 24 * 3600);
        setResult({
          mode: 'single_impactor',
          asteroid_mass_kg: m_asteroid,
          single_impactor_mass_kg: singleImpactorMassKg,
          achieved_delta_v_m_s: delta_v,
          lateral_shift_m: lateral_shift,
        });
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
      return;
    }

    const payload = {
      diameter_m: (asteroidData.size || 0) * 1000,
      relative_velocity_m_s: (asteroidData.velocity || 0) * 1000,
      lead_time_days: leadDays,
      impactor_velocity_m_s: impactorV,
      beta: beta,
      cost_per_launch_usd: costPerLaunch,
      payload_per_launch_kg: payloadPerLaunchKg,
    };

    try {
      const res = await fetch('http://localhost:5000/deflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Server error');
      setResult(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="deflect-card">
      <h3 style={{marginTop:0}}>Kinetic Impactor Estimator</h3>
      <div style={{marginBottom:'.4rem', color:'#334'}}>Default presets: Falcon 9 & DART-like timelines</div>
      <div style={{marginBottom:8}}>
        <div className="deflect-row">
          <div className="deflect-label">Lead time (days)</div>
          <input className="deflect-input" type="number" value={leadDays} onChange={(e) => setLeadDays(parseFloat(e.target.value))} />
          <div className="deflect-small">Days</div>
        </div>
        {approachDate && (
          <div className="deflect-small">Close approach: {new Date(approachDate).toLocaleString()} ({leadDays} days)</div>
        )}
        <div style={{marginTop:6}}>Presets:
          <button style={{marginLeft:8}} onClick={() => setLeadDays(365)}>1 year</button>
          <button style={{marginLeft:8}} onClick={() => setLeadDays(365*3)}>3 years</button>
          <button style={{marginLeft:8}} onClick={() => setLeadDays(365*10)}>10 years</button>
          <button style={{marginLeft:8}} onClick={() => setLeadDays(365*0.5)}>DART-like (~6 months)</button>
        </div>
      </div>
      <div style={{marginTop:8, marginBottom:6}}>
        <div className="deflect-row">
          <div className="deflect-label">Mode</div>
          <select className="deflect-input" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="compute_mass">Compute required mass (default)</option>
            <option value="single_impactor">Single-impactor (DART-style)</option>
            <option value="force_single_launch">Force single-launch</option>
          </select>
        </div>
      </div>
      <div className="deflect-row">
        <div className="deflect-label">Beta</div>
        <input className="deflect-input" type="number" step="0.1" value={beta} onChange={(e) => setBeta(parseFloat(e.target.value))} />
        <div className="deflect-small">momentum factor</div>
      </div>
      <div className="deflect-row">
        <div className="deflect-label">Impactor speed (m/s)</div>
        <input className="deflect-input" type="number" value={impactorV} onChange={(e) => setImpactorV(parseFloat(e.target.value))} />
      </div>
      <div className="deflect-row">
        <div className="deflect-label">Rocket</div>
        <select
          className="deflect-input"
          value={selectedRocket}
          onChange={(e) => {
            const key = e.target.value;
            setSelectedRocket(key);
            const p = rocketPresets[key] || rocketPresets.falcon9;
            setPayloadPerLaunchKg(p.payload);
            setCostPerLaunch(p.cost);
          }}
        >
          <option value="falcon9">Falcon 9 — 22,800 kg</option>
          <option value="falconHeavy">Falcon Heavy — 63,800 kg</option>
          <option value="sls">SLS (example) — 31,000 kg</option>
        </select>
        <div style={{width:12}} />
      </div>
      {mode === 'single_impactor' && (
        <div style={{marginTop:8}}>
          <div className="deflect-row">
            <div className="deflect-label">Impactor mass (kg)</div>
            <input className="deflect-input" type="number" value={singleImpactorMassKg} onChange={(e) => setSingleImpactorMassKg(parseFloat(e.target.value))} />
            <div className="deflect-small">DART ~610 kg</div>
          </div>
          <div className="deflect-small">Single-impactor mode computes delta-v and lateral shift from one impactor (no multiple launches).</div>
        </div>
      )}
      <div className="deflect-row">
        <div className="deflect-label">Cost per launch (USD)</div>
        <input className="deflect-input" type="number" value={costPerLaunch} onChange={(e) => setCostPerLaunch(parseFloat(e.target.value))} />
      </div>
      <button className="deflect-btn" onClick={runEstimate} disabled={!asteroidData || loading}>
        {loading ? 'Estimating...' : 'Run Estimate'}
      </button>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      {result && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Estimate</h4>
          {
            // formatting helper
          }
          <div>Asteroid mass (kg): {formatNumber(result.asteroid_mass_kg, 0)}</div>
          <div>Required Δv (m/s): {formatNumber(result.required_delta_v_m_s, 6)}</div>
          <div>Total required impactor mass (kg): {formatNumber(result.impactor_mass_kg, 1)}</div>
          <div>Impactors / launches required: {result.launches_required}</div>
          {Number.isFinite(result.launches_required) && result.launches_required > 0 && (
            <div className="deflect-small">Mass per impactor (kg): {formatNumber(result.impactor_mass_kg / result.launches_required, 1)} (payload per launch: {payloadPerLaunchKg.toLocaleString()} kg)</div>
          )}
          {result.launches_required <= 1 ? (
            <div className="deflect-small" style={{color:'#2d6a4f'}}>Fits in a single {rocketPresets[selectedRocket].label} launch.</div>
          ) : (
            <div className="deflect-small" style={{color:'#944'}}>Requires multiple launches or a larger vehicle.</div>
          )}
          <div>Estimated cost (USD): ${formatNumber(result.estimated_cost_usd, 0)}</div>
        </div>
      )}
    </div>
  );
}

// Number formatting helper
function formatNumber(value, maxFractionDigits = 0) {
  if (value === null || value === undefined || isNaN(Number(value))) return '—';
  const num = Number(value);
  return num.toLocaleString('en-US', { maximumFractionDigits: maxFractionDigits });
}

export default DeflectionControls;
