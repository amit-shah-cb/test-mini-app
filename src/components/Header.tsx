import { FC } from 'react';
import { Helmet } from 'react-helmet';

const Header: FC = () => {
  return (
    <Helmet>
      <meta name="fc:frame" content={JSON.stringify({
        version: "next",
        imageUrl: "https://test-mini-app-6qe9.vercel.app/logo.png",
        button: {
          title: "🚩 Start",
          action: {
            type: "launch_frame",
            name: "test!",
            url: "https://test-mini-app-6qe9.vercel.app/",
            splashImageUrl: "https://test-mini-app-6qe9.vercel.app/logo.png",
            splashBackgroundColor: "#f5f0ec"
          }
        }
      })} />
    </Helmet>
  );
};

export default Header; 