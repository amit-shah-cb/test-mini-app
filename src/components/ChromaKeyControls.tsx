import { useCallback } from 'react';
import * as THREE from 'three';

interface ChromaKeyControlsProps {
  material: THREE.ShaderMaterial;
  videoPlane: THREE.Mesh;
}

const ChromaKeyControls = ({ material, videoPlane }: ChromaKeyControlsProps) => {
  const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const color = new THREE.Color(e.target.value);
    material.uniforms.color.value = color;
  }, [material]);

  const handleSimilarityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    material.uniforms.similarity.value = parseFloat(e.target.value);
  }, [material]);

  const handleSmoothnessChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    material.uniforms.smoothness.value = parseFloat(e.target.value);
  }, [material]);

  const handleVisibilityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    videoPlane.visible = e.target.checked;
  }, [videoPlane]);

  // Convert THREE.Color to hex string
  const currentColor = '#' + material.uniforms.color.value.getHexString();
  const currentSimilarity = material.uniforms.similarity.value;
  const currentSmoothness = material.uniforms.smoothness.value;

  return (
    <div style={{
      position: 'absolute',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.7)',
      padding: '10px',
      borderRadius: '5px',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      width: '200px'
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Chroma Key Controls</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <input
            type="checkbox"
            defaultChecked={true}
            onChange={handleVisibilityChange}
            style={{ marginRight: '8px' }}
          />
          Show Video
        </label>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Key Color
        </label>
        <input
          type="color"
          value={currentColor}
          onChange={handleColorChange}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Similarity: {currentSimilarity.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={currentSimilarity}
          onChange={handleSimilarityChange}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Smoothness: {currentSmoothness.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={currentSmoothness}
          onChange={handleSmoothnessChange}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
};

export default ChromaKeyControls; 