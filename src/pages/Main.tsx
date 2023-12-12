import { Address, ProviderRpcClient } from 'everscale-inpage-provider';
import { useEffect, useState } from 'react';
import { VenomConnect } from 'venom-connect';

import { Link } from "react-router-dom"
import BackImg from '../styles/img/decor.svg';
import {BrowserView, MobileView} from 'react-device-detect';
import Hamburger from 'hamburger-react'
import ConnectWallet from '../components/ConnectWallet'
import StakingForm from '../components/StakingForm';
import "../styles/navbar.css"
import logo from "../styles/img/logo.png";
import { initVenomConnect } from "../venom-connect/configure";

function Main() {
  
  const [venomConnect, setVenomConnect] = useState<VenomConnect | undefined>();
  const init = async () => {
    const _venomConnect = await initVenomConnect();
    setVenomConnect(_venomConnect);
  };
  useEffect(() => {
    init();
  }, []);

  const [isOpen, setOpen] = useState(false)
  const [venomProvider, setVenomProvider] = useState<any>();
  const [address, setAddress] = useState<any>();

  // We will store token balance from contract
  const [balance, setBalance] = useState<string | undefined>();
  let tokenWalletAddress: string | undefined; // User's TIP-3 TokenWallet address

  // This method allows us to gen a wallet address from inpage provider
  const getAddress = async (provider: any) => {
    const providerState = await provider?.getProviderState?.();
    return providerState?.permissions.accountInteraction?.address.toString();
  };
  // Any interaction with venom-wallet (address fetching is included) needs to be authentificated
  const checkAuth = async (_venomConnect: any) => {
    const auth = await _venomConnect?.checkAuth();
    if (auth) await getAddress(_venomConnect);
  };

  // This handler will be called after venomConnect.login() action
  // connect method returns provider to interact with wallet, so we just store it in state
  const onConnect = async (provider: any) => {
    setVenomProvider(provider);
    await onProviderReady(provider);
  };

  // This handler will be called after venomConnect.disconnect() action
  // By click logout. We need to reset address and balance.
  const onDisconnect = async () => {
    venomProvider?.disconnect();
    setAddress(undefined);
    setBalance(undefined);
    tokenWalletAddress = undefined;

  };

  // When our provider is ready, we need to get address and balance from.
  const onProviderReady = async (provider: any) => {
    const venomWalletAddress = provider ? await getAddress(provider) : undefined;
    setAddress(venomWalletAddress);
  };

  useEffect(() => {
    // connect event handler
    const off = venomConnect?.on('connect', onConnect);
    if (venomConnect) {
      checkAuth(venomConnect);
    }
    // just an empty callback, cuz we don't need it
    return () => {
      off?.();
    };
  }, [venomConnect]);


  return (
    <div className="box">
        <BrowserView>
          <header>
            <a className='logo-section' href='https://venompumpy.com'>
              <img src={logo} alt="Logo" />
            </a>
            <div className="menu-section">
              {/* <Link className='nav-menu' to="/">HOME</Link> */}
              <Link className='nav-menu' to="/">VPUMPY STAKING</Link>
              <Link className='nav-menu' to='/nft_staking'>NFT STAKING</Link>
              <Link className='nav-menu' to='/leaderboard'>LEADERBOARD</Link>
              {!address &&
              <a className="logout" onClick={onConnect}>
                CONNECT
              </a>}
              {address &&
              <a className="logout" onClick={onDisconnect}>
                {address.slice(0,5)+"..."+address.slice(-4)}
              </a>}
            </div>
          </header>
          <img className="decor" src={BackImg} alt="back" />
        </BrowserView>
        <MobileView>
          <nav className={!isOpen ? "navigation": ""} style={{position: "relative"}}>
            <div style={{display:"flex", justifyContent: "space-between", width: "100%"}}>
              <a className='logo-section' href='https://venompumpy.com'>
                <img src={logo} alt="Logo" />
              </a> 
                
              <Hamburger toggled={isOpen} toggle={setOpen} />
            </div>
            {isOpen &&
            <div
              className={
                  isOpen ? "navigation-menu expanded" : "navigation-menu"
              }
            >
              <ul>
                <li>
                  {/* <Link to="/home">HOME</Link> */}
                </li>
                <li>
                  <Link to="/">VPUMPY STAKING</Link>
                </li>
                <li>
                  <Link to="/nft_staking">NFT STAKING</Link>
                </li>
                <li>
                  <Link to="/leaderboard">LEADERBOARD</Link>
                </li>
                <li>
                {!address &&
                  <a className="logout" onClick={onConnect}>
                    CONNECT
                  </a>}
                  {address &&
                  <a className="logout" onClick={onDisconnect}>
                    {address.slice(0,5)+"..."+address.slice(-4)}
                  </a>}
                  </li>
              </ul>
            </div>}
          </nav>
        </MobileView>
      <div className="card">
        <div className="card__wrap">
          {address ? (
            <StakingForm
              address={address}
              venomConnect={venomConnect}
              provider={venomProvider}
            />
          ) : (
            <ConnectWallet venomConnect={venomConnect} />
          )}
        </div>
      </div>
    </div>
  );
}
  
export default Main;