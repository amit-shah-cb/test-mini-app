import { FC, useEffect, useRef } from 'react';
import * as THREE from 'three';

interface WebcamTextureProps {
  onTextureReady: (texture: THREE.VideoTexture) => void;
}

const WebcamTexture: FC<WebcamTextureProps> = ({ onTextureReady }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Create video element
    const video = document.createElement('video');
    video.style.display = 'none';
    videoRef.current = video;

    // Get webcam stream
    navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: 1280, 
        height: 720,
        facingMode: 'user' 
      } 
    })
    .then((stream) => {
      video.srcObject = stream;
      video.play();

      // Create video texture
      const texture = new THREE.VideoTexture(video);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.format = THREE.RGBAFormat;

      onTextureReady(texture);
    })
    .catch((error) => {
      console.error('Error accessing webcam:', error);
    });

    // Cleanup
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [onTextureReady]);

  return null;
};

export default WebcamTexture; 