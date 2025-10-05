import React from 'react';
import '../css/MapLegend.css';

function MapLegend() {
  return (
    <div className="legend">
      <h4 style={{color:'black'}}>Impact Zones</h4>
      <div style={{color: 'black'}}><i style={{ background: 'black' }}></i> meteor impact</div>
      <div style={{color:'black'}}><i style={{ background: 'red' }}></i> Immediate evacuation required</div>
    </div>
  );
}

export default MapLegend;