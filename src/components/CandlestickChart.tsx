import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrthographicCamera } from 'three';

interface CandlestickData {
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: number;
}

interface CandlestickChartProps {
  data: CandlestickData[];
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({ data }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<OrthographicCamera | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    const aspect = width / height;

    // Create orthographic camera
    const frustumSize = 10;
    const camera = new OrthographicCamera(
      -frustumSize * aspect,
      frustumSize * aspect,
      frustumSize,
      -frustumSize,
      0.1,
      1000
    );
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create candlesticks
    const maxPrice = Math.max(...data.map(d => d.high));
    const minPrice = Math.min(...data.map(d => d.low));
    const priceRange = maxPrice - minPrice;
    const timeRange = data[data.length - 1].timestamp - data[0].timestamp;

    data.forEach((candle, i) => {
      // Scale values
      const x = (candle.timestamp - data[0].timestamp) / timeRange * 16 - 8;
      const yOpen = ((candle.open - minPrice) / priceRange * 16) - 8;
      const yClose = ((candle.close - minPrice) / priceRange * 16) - 8;
      const yHigh = ((candle.high - minPrice) / priceRange * 16) - 8;
      const yLow = ((candle.low - minPrice) / priceRange * 16) - 8;

      // Create body
      const bodyHeight = Math.abs(yClose - yOpen);
      const bodyGeometry = new THREE.PlaneGeometry(0.2, bodyHeight);
      const bodyMaterial = new THREE.MeshBasicMaterial({
        color: yClose > yOpen ? 0x00ff00 : 0xff0000,
        side: THREE.DoubleSide
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(x, (yOpen + yClose) / 2, -1);

      // Create wick
      const wickGeometry = new THREE.PlaneGeometry(0.05, yHigh - yLow);
      const wickMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide
      });
      const wick = new THREE.Mesh(wickGeometry, wickMaterial);
      wick.position.set(x, (yHigh + yLow) / 2, -1);

      scene.add(body);
      scene.add(wick);
    });

    // Animation loop
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      requestAnimationFrame(animate);
    };
    animate();

    // Cleanup
    return () => {
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          }
        }
      });
      rendererRef.current?.dispose();
    };
  }, [data]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};

export default CandlestickChart; 