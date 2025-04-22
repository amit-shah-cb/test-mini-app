import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FC } from 'react';

interface BloomControlsProps {
  bloomPass: UnrealBloomPass;
}

const BloomControls: FC<BloomControlsProps> = ({ bloomPass }) => {
  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.7)',
      padding: '10px',
      borderRadius: '5px',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      width: '200px'
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Bloom Controls</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Strength</label>
        <input
          type="range"
          min="0"
          max="3"
          step="0.1"
          defaultValue={bloomPass.strength}
          onChange={(e) => {
            bloomPass.strength = parseFloat(e.target.value);
          }}
          style={{ width: '200px' }}
        />
        <span style={{ marginLeft: '10px' }}>{bloomPass.strength.toFixed(1)}</span>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Radius</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          defaultValue={bloomPass.radius}
          onChange={(e) => {
            bloomPass.radius = parseFloat(e.target.value);
          }}
          style={{ width: '200px' }}
        />
        <span style={{ marginLeft: '10px' }}>{bloomPass.radius.toFixed(2)}</span>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '5px' }}>Threshold</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          defaultValue={bloomPass.threshold}
          onChange={(e) => {
            bloomPass.threshold = parseFloat(e.target.value);
          }}
          style={{ width: '200px' }}
        />
        <span style={{ marginLeft: '10px' }}>{bloomPass.threshold.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default BloomControls; 