import * as THREE from 'three';

export const ChromaKeyShader = {
  uniforms: {
    "tDiffuse": { value: null },
    "color": { value: new THREE.Color(0x00ff00) },  // Green screen color
    "similarity": { value: 0.3 },  // Color similarity threshold
    "smoothness": { value: 0.1 }   // Edge smoothness
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec3 color;
    uniform float similarity;
    uniform float smoothness;
    varying vec2 vUv;

    void main() {
      vec4 texColor = texture2D(tDiffuse, vUv);
      
      // Convert to HSV for better color comparison
      vec3 targetHSV = rgb2hsv(color);
      vec3 pixelHSV = rgb2hsv(texColor.rgb);
      
      // Calculate color difference
      float colorDist = distance(pixelHSV, targetHSV);
      
      // Create smooth alpha transition
      float alpha = smoothstep(similarity, similarity + smoothness, colorDist);
      
      gl_FragColor = vec4(texColor.rgb, alpha);
    }

    // RGB to HSV conversion
    vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
      
      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }
  `
}; 