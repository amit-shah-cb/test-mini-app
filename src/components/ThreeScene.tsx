import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import BloomControls from './BloomControls';
import RGBShiftControls from './RGBShiftControls';
import ChromaKeyControls from './ChromaKeyControls';
import WebcamTexture from './WebcamTexture';

// RGB Shift shader
const RGBShiftShader = {
  uniforms: {
    "tDiffuse": { value: null },
    "amount": { value: 0.005 },
    "angle": { value: 0.0 }
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
    uniform float amount;
    uniform float angle;
    varying vec2 vUv;
    void main() {
      vec2 offset = amount * vec2(cos(angle), sin(angle));
      vec4 cr = texture2D(tDiffuse, vUv + offset);
      vec4 cg = texture2D(tDiffuse, vUv);
      vec4 cb = texture2D(tDiffuse, vUv - offset);
      gl_FragColor = vec4(cr.r, cg.g, cb.b, cg.a);
    }
  `
};

// Chroma key shader
const ChromaKeyShader = {
  uniforms: {
    "tDiffuse": { value: null },
    "color": { value: new THREE.Color(0x00ff00) },
    "similarity": { value: 0.3 },
    "smoothness": { value: 0.1 }
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
      
      float d = length(abs(texColor.rgb - color));
      float edge0 = similarity * (1.0 - smoothness);
      float edge1 = similarity * (1.0 + smoothness);
      
      float mask = smoothstep(edge0, edge1, d);
      
      gl_FragColor = vec4(texColor.rgb, mask);
    }
  `
};

const ThreeScene = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const textRef = useRef<THREE.Mesh | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const [bloomPass, setBloomPass] = useState<UnrealBloomPass | null>(null);
  const [rgbShiftPass, setRgbShiftPass] = useState<ShaderPass | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);
  const videoPlaneRef = useRef<THREE.Mesh | null>(null);
  const [chromaKeyMaterial, setChromaKeyMaterial] = useState<THREE.ShaderMaterial | null>(null);
  const candlesticksRef = useRef<THREE.Group[]>([]);
  const animationStartTime = useRef<number | null>(null);
  const isAnimating = useRef(false);
  const webcamPlaneRef = useRef<THREE.Mesh | null>(null);
  const webcamTextureRef = useRef<THREE.VideoTexture | null>(null);

  // Animation function defined outside useEffect
  const animate = () => {
    if (!sceneRef.current || !cameraRef.current || !composerRef.current || !controlsRef.current) return;
    
    // Animate candlesticks
    if (isAnimating.current && animationStartTime.current !== null) {
      const elapsed = (Date.now() - animationStartTime.current) / 1000; // Convert to seconds
      const candlestickDuration = 0.3; // Duration for each candlestick animation
      const delayBetweenCandlesticks = 0.1; // Delay between each candlestick

      candlesticksRef.current.forEach((group, index) => {
        const startTime = index * (candlestickDuration + delayBetweenCandlesticks);
        const progress = Math.max(0, Math.min(1, (elapsed - startTime) / candlestickDuration));
        
        if (progress > 0) {
          // Scale up the candlestick
          const scale = Math.min(1, progress);
          group.scale.set(scale, scale, scale);
          group.visible = true;

          // Fade in opacity
          group.children.forEach(child => {
            if (child instanceof THREE.Mesh) {
              const material = child.material as THREE.MeshBasicMaterial;
              material.opacity = progress * (child === group.children[0] ? 0.8 : 0.6); // Body or wick opacity
            }
          });
        }
      });

      // Stop animation when all candlesticks are shown
      if (elapsed > candlesticksRef.current.length * (candlestickDuration + delayBetweenCandlesticks)) {
        isAnimating.current = false;
      }
    }

    if (textRef.current) {
      textRef.current.rotation.y += 0.005;
    }

    // Update video texture if video is playing
    if (videoTextureRef.current && videoRef.current && !videoRef.current.paused) {
      videoTextureRef.current.needsUpdate = true;
    }
    
    controlsRef.current.update();
    composerRef.current.render();
    animationFrameId.current = requestAnimationFrame(animate);
  };

  // Handle window resize
  const handleResize = () => {
    if (!cameraRef.current || !rendererRef.current || !mountRef.current || !composerRef.current) return;
    
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    const aspect = width / height;
    
    const frustumSize = 1.25; // Reduced from 5 to zoom in
    cameraRef.current.left = -frustumSize * aspect;
    cameraRef.current.right = frustumSize * aspect;
    cameraRef.current.top = frustumSize;
    cameraRef.current.bottom = -frustumSize;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
    composerRef.current.setSize(width, height);
  };

  const handleWebcamTextureReady = useCallback((texture: THREE.VideoTexture) => {
    if (!sceneRef.current) return;

    webcamTextureRef.current = texture;

    // Create plane for webcam
    const planeGeometry = new THREE.PlaneGeometry(2, 1.25); // 16:9 aspect ratio
    const planeMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide
    });
    
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.position.set(-2, -1, 0); // Position the plane
    plane.rotation.y = Math.PI / 2; // Slight tilt
    
    webcamPlaneRef.current = plane;
    sceneRef.current.add(plane);
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0118D8');
    sceneRef.current = scene;

    // Camera setup - Orthographic for isometric
    const aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
    const frustumSize = 1.25;
    const camera = new THREE.OrthographicCamera(
      -frustumSize * aspect,
      frustumSize * aspect,
      frustumSize,
      -frustumSize,
      0.1,
      1000
    );
    
    // Position camera for isometric view
    camera.position.set(2, 2, 2);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Create candlestick chart background plane
    const chartGeometry = new THREE.PlaneGeometry(3, 2);
    const chartMaterial = new THREE.MeshBasicMaterial({
      color: 0x1a1a1a,
      transparent: true,
      opacity: 0.5
    });
    const chartPlane = new THREE.Mesh(chartGeometry, chartMaterial);
    chartPlane.position.set(0, 0, -2);
    scene.add(chartPlane);

    // Create chart grid
    const gridGroup = new THREE.Group();
    gridGroup.position.set(0, 0, -1.9);

    // Vertical grid lines
    for (let i = -5; i <= 5; i++) {
      const x = (i / 5) * 1.25;
      const lineGeometry = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        x, -1, 0,
        x, 1, 0
      ]);
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x333333,
        transparent: true,
        opacity: 0.3
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      gridGroup.add(line);
    }

    // Horizontal grid lines
    for (let i = -4; i <= 4; i++) {
      const y = (i / 4) * 0.8;
      const lineGeometry = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        -1.5, y, 0,
        1.5, y, 0
      ]);
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x333333,
        transparent: true,
        opacity: 0.3
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      gridGroup.add(line);
    }

    // Create axes
    const axesGroup = new THREE.Group();
    axesGroup.position.set(0, 0, -1.85);

    // X-axis
    const xAxisGeometry = new THREE.BufferGeometry();
    const xAxisVertices = new Float32Array([
      -1.5, -1, 0,
      1.5, -1, 0
    ]);
    xAxisGeometry.setAttribute('position', new THREE.BufferAttribute(xAxisVertices, 3));
    const xAxisMaterial = new THREE.LineBasicMaterial({ 
      color: 0x666666,
      transparent: true,
      opacity: 0.8,
      linewidth: 2
    });
    const xAxis = new THREE.Line(xAxisGeometry, xAxisMaterial);
    axesGroup.add(xAxis);

    // Y-axis
    const yAxisGeometry = new THREE.BufferGeometry();
    const yAxisVertices = new Float32Array([
      -1.5, -1, 0,
      -1.5, 1, 0
    ]);
    yAxisGeometry.setAttribute('position', new THREE.BufferAttribute(yAxisVertices, 3));
    const yAxisMaterial = new THREE.LineBasicMaterial({ 
      color: 0x666666,
      transparent: true,
      opacity: 0.8,
      linewidth: 2
    });
    const yAxis = new THREE.Line(yAxisGeometry, yAxisMaterial);
    axesGroup.add(yAxis);

    scene.add(gridGroup);
    scene.add(axesGroup);

    // Create candlesticks
    const maxPrice = Math.max(...sampleData.map(d => d.high));
    const minPrice = Math.min(...sampleData.map(d => d.low));
    const priceRange = maxPrice - minPrice;
    const timeRange = sampleData[sampleData.length - 1].timestamp - sampleData[0].timestamp;

    // Create candlestick group
    const candlestickGroup = new THREE.Group();
    candlestickGroup.position.set(0, 0, -1.8);

    // Clear previous references
    candlesticksRef.current = [];

    sampleData.forEach((candle) => {
      // Scale values to fit in chart area
      const x = ((candle.timestamp - sampleData[0].timestamp) / timeRange - 0.5) * 2.5;
      const yOpen = ((candle.open - minPrice) / priceRange - 0.5) * 1.5;
      const yClose = ((candle.close - minPrice) / priceRange - 0.5) * 1.5;
      const yHigh = ((candle.high - minPrice) / priceRange - 0.5) * 1.5;
      const yLow = ((candle.low - minPrice) / priceRange - 0.5) * 1.5;

      // Create individual candlestick group
      const candleGroup = new THREE.Group();
      candleGroup.position.set(x, 0, 0);
      candleGroup.visible = false; // Hide initially

      // Create body
      const bodyHeight = Math.abs(yClose - yOpen);
      const bodyGeometry = new THREE.PlaneGeometry(0.1, Math.max(bodyHeight, 0.02));
      const bodyMaterial = new THREE.MeshBasicMaterial({
        color: yClose > yOpen ? 0x00ff88 : 0xff4444,
        transparent: true,
        opacity: 0
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(0, (yOpen + yClose) / 2, 0);

      // Create wick
      const wickGeometry = new THREE.PlaneGeometry(0.02, yHigh - yLow);
      const wickMaterial = new THREE.MeshBasicMaterial({
        color: 0xcccccc,
        transparent: true,
        opacity: 0
      });
      const wick = new THREE.Mesh(wickGeometry, wickMaterial);
      wick.position.set(0, (yHigh + yLow) / 2, 0);

      candleGroup.add(body);
      candleGroup.add(wick);
      candlestickGroup.add(candleGroup);
      candlesticksRef.current.push(candleGroup);
    });

    scene.add(candlestickGroup);

    // Start animation
    isAnimating.current = true;
    animationStartTime.current = Date.now();

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // OrbitControls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.minDistance = 1;
    controls.maxDistance = 5;
    controls.maxPolarAngle = Math.PI / 2;
    
    // Additional camera control settings
    controls.enableRotate = true;
    controls.rotateSpeed = 0.5;
    controls.enableZoom = true;
    controls.zoomSpeed = 0.5;
    controls.enablePan = true;
    controls.panSpeed = 0.5;
    controls.minPolarAngle = 0;
    controls.maxAzimuthAngle = Math.PI / 2;
    controls.minAzimuthAngle = -Math.PI / 2;

    // Touch gesture controls
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };
    
    // Adjust touch sensitivity
    controls.rotateSpeed = 0.5; // Affects both mouse and touch rotation
    controls.zoomSpeed = 1.0;   // Affects both mouse and touch zooming
    controls.panSpeed = 0.8;    // Affects both mouse and touch panning
    
    controlsRef.current = controls;

    // Post-processing setup
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // RGB Shift pass
    const rgbShift = new ShaderPass(RGBShiftShader);
    composer.addPass(rgbShift);
    setRgbShiftPass(rgbShift);

    // Bloom pass
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,    // strength
      0.4,    // radius
      0.85    // threshold
    );
    composer.addPass(bloom);
    composerRef.current = composer;
    setBloomPass(bloom);

    // Add lighting for isometric view
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5); // Match camera angle
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    // Load font and create text
    const fontLoader = new FontLoader();
    fontLoader.load(
      'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
      (font: Font) => {
        const textGeometry = new TextGeometry('Hello', {
          font: font,
          size: 0.5,
          depth: 0.2,
          curveSegments: 12,
          bevelEnabled: true,
          bevelThickness: 0.03,
          bevelSize: 0.02,
          bevelOffset: 0,
          bevelSegments: 5
        });
        
        const textMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xFFF8F8,
          specular: 0xffffff,
          emissive: 0x3F3E3E  // Slight emission for bloom
        });
        
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textGeometry.center();
        scene.add(textMesh);
        textRef.current = textMesh;

        // Video setup
        const video = document.createElement('video');
        // Using a sample video from a CDN
        video.src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.crossOrigin = 'anonymous';

        // Add event listeners for better error handling
        video.addEventListener('error', () => {
          console.error('Video error:', video.error);
        });

        video.addEventListener('loadeddata', () => {
          console.log('Video loaded successfully');
        });

        videoRef.current = video;

        // Create video texture after video is loaded
        video.addEventListener('canplay', () => {
          const videoTexture = new THREE.VideoTexture(video);
          videoTexture.minFilter = THREE.LinearFilter;
          videoTexture.magFilter = THREE.LinearFilter;
          videoTextureRef.current = videoTexture;

          // Create plane geometry for video
          const planeGeometry = new THREE.PlaneGeometry(2, 2 * (9/16)); // 16:9 aspect ratio
          const material = new THREE.ShaderMaterial({
            uniforms: {
              tDiffuse: { value: videoTexture },
              color: { value: new THREE.Color(0x00ff00) },
              similarity: { value: 0.3 },
              smoothness: { value: 0.1 }
            },
            vertexShader: ChromaKeyShader.vertexShader,
            fragmentShader: ChromaKeyShader.fragmentShader,
            transparent: true
          });

          setChromaKeyMaterial(material);

          const videoPlane = new THREE.Mesh(planeGeometry, material);
          videoPlane.position.set(0, 0, -1); // Position behind the text
          scene.add(videoPlane);
          videoPlaneRef.current = videoPlane;

          // Start playing the video
          video.play().catch(error => {
            console.error('Error playing video:', error);
          });
        });

        // Load the video
        video.load();

        // Start animation
        animate();
      },
      undefined,
      (error) => {
        console.error('Error loading font:', error);
        animate();
      }
    );

    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (textRef.current?.geometry) {
        textRef.current.geometry.dispose();
      }
      if (textRef.current?.material) {
        (textRef.current.material as THREE.Material).dispose();
      }
      if (composerRef.current) {
        composerRef.current.dispose();
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
      }
      if (videoPlaneRef.current) {
        videoPlaneRef.current.geometry.dispose();
        (videoPlaneRef.current.material as THREE.Material).dispose();
      }
      if (videoTextureRef.current) {
        videoTextureRef.current.dispose();
      }
      candlesticksRef.current = [];
    };
  }, []);

  // Sample candlestick data
  const sampleData = [
    { low: 1.0, high: 5.0, open: 2.0, close: 4.0, timestamp: Date.now() - 9 * 3600000 },
    { low: 2.0, high: 6.0, open: 5.0, close: 3.0, timestamp: Date.now() - 8 * 3600000 },
    { low: 1.5, high: 4.5, open: 2.5, close: 4.2, timestamp: Date.now() - 7 * 3600000 },
    { low: 2.2, high: 5.2, open: 4.0, close: 2.8, timestamp: Date.now() - 6 * 3600000 },
    { low: 1.8, high: 4.8, open: 2.8, close: 3.8, timestamp: Date.now() - 5 * 3600000 },
    { low: 2.5, high: 5.5, open: 3.5, close: 5.0, timestamp: Date.now() - 4 * 3600000 },
    { low: 3.0, high: 6.0, open: 4.0, close: 5.5, timestamp: Date.now() - 3 * 3600000 },
    { low: 2.8, high: 5.8, open: 5.5, close: 3.2, timestamp: Date.now() - 2 * 3600000 },
    { low: 1.5, high: 4.5, open: 3.2, close: 4.0, timestamp: Date.now() - 1 * 3600000 },
    { low: 2.0, high: 5.0, open: 4.0, close: 4.8, timestamp: Date.now() }
  ];

  // Add cleanup for webcam plane
  useEffect(() => {
    return () => {
      if (webcamPlaneRef.current) {
        webcamPlaneRef.current.geometry.dispose();
        if (webcamPlaneRef.current.material instanceof THREE.Material) {
          webcamPlaneRef.current.material.dispose();
        }
      }
      if (webcamTextureRef.current) {
        webcamTextureRef.current.dispose();
      }
    };
  }, []);

  return (
    <>
      <WebcamTexture onTextureReady={handleWebcamTextureReady} />
      <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
        {bloomPass && <BloomControls bloomPass={bloomPass} />}
        {rgbShiftPass && <RGBShiftControls shaderPass={rgbShiftPass} />}
        {chromaKeyMaterial && videoPlaneRef.current && (
          <ChromaKeyControls 
            material={chromaKeyMaterial} 
            videoPlane={videoPlaneRef.current}
          />
        )}
      </div>
    </>
  );
};

export default ThreeScene; 