import { FC } from 'react';
import { Helmet } from 'react-helmet';

const Header: FC = () => {
  return (
    <Helmet encodeSpecialCharacters={false}>
      <meta name="fc:frame" content={`{"version":"next","imageUrl":"https://test-mini-app-sigma.vercel.app/logo.png","button":{"title":"🚩 Start","action":{"type":"launch_frame","name":"test!","url":"https://test-mini-app-sigma.vercel.app/","splashImageUrl":"https://test-mini-app-sigma.vercel.app/logo.png","splashBackgroundColor":"#f5f0ec"}}}`} />
    </Helmet>
  );
};

export default Header; 