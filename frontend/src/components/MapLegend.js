import React from 'react';
import '../css/MapLegend.css';

function MapLegend() {
  return (
    <div className="legend">
      <h4>Impact Zones</h4>
      <div><i style={{ background: 'black' }}></i> meteor impact</div>
      <div><i style={{ background: 'red' }}></i> Immediate evacuation required</div>
    </div>
  );
}

export default MapLegend;