import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

interface RGBShiftControlsProps {
  shaderPass: ShaderPass;
}

const RGBShiftControls = ({ shaderPass }: RGBShiftControlsProps) => {
  return (
    <div style={{
      position: 'absolute',
      bottom: '10px',
      left: '10px',
      background: 'rgba(0,0,0,0.7)',
      padding: '10px',
      borderRadius: '5px',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      width: '200px'
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>RGB Shift Controls</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Amount</label>
        <input
          type="range"
          min="0"
          max="0.02"
          step="0.001"
          defaultValue={shaderPass.uniforms.amount.value}
          onChange={(e) => {
            shaderPass.uniforms.amount.value = parseFloat(e.target.value);
          }}
          style={{ width: '200px' }}
        />
        <span style={{ marginLeft: '10px' }}>{shaderPass.uniforms.amount.value.toFixed(3)}</span>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Angle</label>
        <input
          type="range"
          min="0"
          max={Math.PI * 2}
          step="0.1"
          defaultValue={shaderPass.uniforms.angle.value}
          onChange={(e) => {
            shaderPass.uniforms.angle.value = parseFloat(e.target.value);
          }}
          style={{ width: '200px' }}
        />
        <span style={{ marginLeft: '10px' }}>{(shaderPass.uniforms.angle.value / Math.PI).toFixed(2)}π</span>
      </div>
    </div>
  );
};

export default RGBShiftControls; 