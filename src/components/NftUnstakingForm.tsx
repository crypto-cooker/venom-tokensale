import React, { useEffect, useState } from "react";
import { VenomConnect } from "venom-connect";
import { Address, ProviderRpcClient } from "everscale-inpage-provider";

// we will user bignumber library to operate with deposit values (remember about decimals multiply)
import BigNumber from "bignumber.js";

// Importing of our contract ABI from smart-contract build action. Of cource we need ABI for contracts calls.
import stakingAbi from "../abi/Staking.abi.json";
import tokenRootAbi from "../abi/TokenRoot.abi.json";
import NFTAbi from "../abi/NFT.abi.json";
import { COLLECTION1, NFT_COLLECTION1, STAKING_ADDR, TOKEN_ROOT } from "../utils/constant";

type Props = {
  venomConnect: VenomConnect | undefined;
  address: string | undefined;
  provider: ProviderRpcClient | undefined;
};

function NftUnstakingForm({ venomConnect, address, provider }: Props) {
  const [stakingContract, setStakingContract] = useState<any>();
  const [tokenRootContract, setTokenRootContract] = useState<any>();
  const [tokenWalletContract, setTokenWalletContract] = useState<any>();
  const [nftAddresses, setNftAddresses] = useState<Address[]>([]);
  
  useEffect(()=> {
    if(provider) {
      const contractAddress = new Address(STAKING_ADDR); // Our Staking contract address
      const contractInstance = new provider.Contract(stakingAbi, contractAddress);
      setStakingContract(contractInstance);

      const tokenRootAddress = new Address(TOKEN_ROOT); // Our token root address
      const tokenRootInstance = new provider.Contract(tokenRootAbi, tokenRootAddress);
      setTokenRootContract(tokenRootInstance);
    }
  }, [provider])
  
  const getStakingInfo = async () => {
    try {
      const { value0 } = await stakingContract.methods
      .getStakedInfo({staker: address})
      .call({});
      return value0;
    } catch (error) {
      console.log(error, "GREAT")
      return undefined;
    }
  }

  useEffect(()=> {
    if(stakingContract && address) {
      (async() => {
        const data = await getStakingInfo();
        if(data) {
          setNftAddresses(data.nfts);
        }
      })();
    }
  }, [stakingContract, address, tokenWalletContract])

  const unStakeNFT = async (nftAddr:Address) => {
    if (!venomConnect || !address || !stakingContract) return;
    try {
      const res = await stakingContract.methods
        .unstakeNFT({nftAddr})
        .send({
          from: new Address(address),
          amount: new BigNumber(1).multipliedBy(10 ** 9).toString(),
          bounce: true,
        });
        if (res?.id?.lt && res?.endStatus === "active") {
          alert("Successfully unstaked NFT!");
          document.location.reload();
        }
    } catch (error) {
      console.log(error);
    }
     
  };
  return (
    <div className="nft_unstaking_card">
      <div className="card__wrap">
        <h1>Unstake NFTs</h1>
        <div className="grid">
          {nftAddresses.length==0 && <h3>No NFTs</h3>}
          {nftAddresses.map((item, index) => 
            <div className="nft_item" key={index}>
              <video width="150"  autoPlay={true}>
                <source src={COLLECTION1} type="video/mp4" />
              </video>
              <div className="btn btn_unstake" style={{cursor: "pointer"}} onClick={() => unStakeNFT(item)}>Unstake</div>
            </div>)}
        </div>
      </div>
    </div>
  );
}

export default NftUnstakingForm;
