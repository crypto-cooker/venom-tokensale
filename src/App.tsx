import { useEffect, useState } from 'react';
import './styles/main.css';

import { initVenomConnect } from './venom-connect/configure';
import VenomConnect from 'venom-connect';
import Main from './pages/Main';
import NftStaking from './pages/NftStaking';
import Leaderboard from './pages/Leaderboard';
import { BrowserRouter, Route, Routes } from 'react-router-dom';


function App() {

  const [venomConnect, setVenomConnect] = useState<VenomConnect | undefined>();
  const init = async () => {
    const _venomConnect = await initVenomConnect();
    setVenomConnect(_venomConnect);
  };
  useEffect(() => {
    init();
  }, []);


  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/nft_staking" element={<NftStaking />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;