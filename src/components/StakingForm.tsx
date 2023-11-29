import React, { useEffect, useState } from "react";
import { VenomConnect } from "venom-connect";
import { Address, ProviderRpcClient } from "everscale-inpage-provider";

// we will user bignumber library to operate with deposit values (remember about decimals multiply)
import BigNumber from "bignumber.js";

// Importing of our contract ABI from smart-contract build action. Of cource we need ABI for contracts calls.
import stakingAbi from "../abi/Staking.abi.json";
import tokenRootAbi from "../abi/TokenRoot.abi.json";
import tokenWalletAbi from "../abi/TokenWallet.abi.json";

import AddTokenImg from "../styles/img/add_token.svg";

type Props = {
  balance: string | undefined;
  getBalance: (wallet: string) => void;
  venomConnect: VenomConnect | undefined;
  address: string | undefined;
  provider: ProviderRpcClient | undefined;
};

function StakingForm({ venomConnect, address, provider }: Props) {
  const [tokenAmount, setTokenAmount] = useState<number | undefined>();
  const [stakingContract, setStakingContract] = useState<any>();
  const [tokenRootContract, setTokenRootContract] = useState<any>();
  const [tokenWalletContract, setTokenWalletContract] = useState<any>();
  const [stakedAmount, setStakedAmount] = useState(0);
  const [claimedAmount, setClaimedAmount] = useState(0);
  const [stakingAddress, setStakingAddress] = useState("0:92abc446e6bc136aab26aa438268d7795dfd5d037447473254bc2092ebb06c1b");
  const [isStaking, setIsStaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const onChangeAmount = (e: string) => {
    if (e === "") setTokenAmount(undefined);
    setTokenAmount(Number(e));
  };

  useEffect(()=> {
    if(provider) {
      const contractAddress = new Address(stakingAddress); // Our Staking contract address
      const contractInstance = new provider.Contract(stakingAbi, contractAddress);
      setStakingContract(contractInstance);

      const tokenRootAddress = new Address("0:4e73ec103bc5c4998e7d92473fdd17ee7d4941fd681f07f6610085119a90ce1c"); // Our token root address
      const tokenRootInstance = new provider.Contract(tokenRootAbi, tokenRootAddress);
      setTokenRootContract(tokenRootInstance);
    }
  }, [provider])

  useEffect(()=> {
    if(provider && address && tokenRootContract) {
      (async() => {
        try {
          const tokenWalletAddress = (await tokenRootContract.methods.walletOf({answerId: 0, walletOwner: address}).call()).value0;
          const tokenWalletInstance = new provider.Contract(tokenWalletAbi, tokenWalletAddress);
          setTokenWalletContract(tokenWalletInstance);
        } catch (error) {
          console.log(error)
        }
      })();
    }
  }, [provider, address, tokenRootContract])
  
  const getStakingInfo = async () => {
    try {
      const { value0 } = await stakingContract.methods
      .getStakedInfo({staker: address})
      .call({});
      setStakedAmount(parseFloat(value0.amount)/(10**9));
      setClaimedAmount(parseFloat(value0.claimedAmount)/(10**9))
      console.log(value0, "RES");
    } catch (error) {
      console.log(error, "GREAT")
    }
  }

  useEffect(()=> {
    if(stakingContract && address) {
      getStakingInfo();
    }
  }, [stakingContract, address])
  

  // handler that helps us to ask user about adding our token to the user's venom wallet
  const onTokenAdd = () => {
    console.log(provider?.addAsset({
      account: new Address(address as string), // user's wallet address
      params: {
        rootContract: new Address("0:91470b9a77ada682c9f9aee5ae0a4e2ea549ee51f7b0f2cba5182ffec2eb233f"), // TokenRoot address
      },
      type: "tip3_token", // tip3 - is a standart we use
    }))
  }

  const claimTokens = async () => {
    if(!stakingContract || !address) return;
    try {
      setIsClaiming(true);
      const result = await stakingContract.methods
        .claim({})
        .send({
          from: new Address(address),
          amount: new BigNumber(0.5).multipliedBy(10 ** 9).toString(),
          bounce: true,
        });
      if (result?.id?.lt && result?.endStatus === "active") {
        alert("Successfully claimed token!");
        setIsClaiming(false);
        await getStakingInfo();
      }
    } catch (e) {
      setIsClaiming(false);
      console.error(e);
    }
  }

  const stakeTokens = async () => {
    if (!venomConnect || !address || !tokenAmount || !provider || !tokenWalletContract) return;
    const amount = new BigNumber(tokenAmount).multipliedBy(10 ** 9).toString(); // Contract"s rate parameter is 1 venom = 10 tokens
    try {
      setIsStaking(true);
      const result = await tokenWalletContract.methods
        .transfer({
          amount,
          recipient: stakingAddress,
          deployWalletValue: "0",
          remainingGasTo: address,
          notify: true,
          payload: null
        })
        .send({
          from: new Address(address),
          amount: new BigNumber(0.5).multipliedBy(10 ** 9).toString(),
          bounce: true,
        });
      if (result?.id?.lt && result?.endStatus === "active") {
        alert("Successfully staked token!");
        setIsStaking(false);
        await getStakingInfo();
      }
    } catch (e) {
      setIsStaking(false);
      console.error(e);
    }
  };
  return (
    <>
      <h1>Stake & Claim VenomPumpy</h1>
      <div className="item-info">
        <span>Staked Amount</span>
        <b>{stakedAmount}</b> 
      </div>
      <div className="item-info">
        <span>Claimed Amount</span>
        <b>{claimedAmount}</b>
      </div>
      <div className="item-info">
        <span>APY</span>
        <b>50%</b>
      </div>
      <div className="number">
        <input
          type="number"
          min={0}
          value={tokenAmount !== undefined ? tokenAmount : ""}
          style={{textAlign:"right"}}
          placeholder="Enter amount to stake"
          onChange={(e) => {
            onChangeAmount(e.target.value);
          }}
        />
      </div>
      <div className="card__amount">
        <a className={isClaiming ? "btn disabled" : "btn"} onClick={claimTokens}>
          Claim
        </a>
        <a className={(!tokenAmount || isStaking ) ? "btn disabled" : "btn"} onClick={stakeTokens}>
          Stake
        </a>
      </div>
    </>
  );
}

export default StakingForm;
