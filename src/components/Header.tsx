import { FC, useEffect } from 'react';

const frameMetadata = {
  version: "next",
  imageUrl: "https://test-mini-app-sigma.vercel.app/logo.png",
  button: {
    title: "Start",
    action: {
      type: "launch_frame",
      name: "test!",
      url: "https://test-mini-app-sigma.vercel.app",
      splashImageUrl: "https://test-mini-app-sigma.vercel.app/logo.png",
      splashBackgroundColor: "#f5f0ec"
    }
  }
};

const Header: FC = () => {
  useEffect(() => {
    // Remove existing meta tag if it exists
    const existingMeta = document.querySelector('meta[name="fc:frame"]');
    if (existingMeta) {
      existingMeta.remove();
    }

    // Create new meta tag
    const meta = document.createElement('meta');
    meta.name = 'fc:frame';
    
    // Set content directly as a string to prevent encoding
    meta.setAttribute('content', `'{"version":"next","imageUrl":"https://test-mini-app-sigma.vercel.app/logo.png","button":{"title":"Start","action":{"type":"launch_frame","name":"test!","url":"https://test-mini-app-sigma.vercel.app","splashImageUrl":"https://test-mini-app-sigma.vercel.app/logo.png","splashBackgroundColor":"#f5f0ec"}}}'`);

    // Add to head
    document.head.appendChild(meta);

    // Cleanup
    return () => {
      const meta = document.querySelector('meta[name="fc:frame"]');
      if (meta) {
        meta.remove();
      }
    };
  }, []);

  return null;
};

export default Header; 