import React, { useEffect, useState } from "react";
import { VenomConnect } from "venom-connect";
import { Address, ProviderRpcClient } from "everscale-inpage-provider";

// we will user bignumber library to operate with deposit values (remember about decimals multiply)
import BigNumber from "bignumber.js";

// Importing of our contract ABI from smart-contract build action. Of cource we need ABI for contracts calls.
import stakingAbi from "../abi/Staking.abi.json";
import tokenRootAbi from "../abi/TokenRoot.abi.json";
import tokenWalletAbi from "../abi/TokenWallet.abi.json";
import { getNftImage } from "../utils/nft";

type Props = {
  venomConnect: VenomConnect | undefined;
  address: string | undefined;
  provider: ProviderRpcClient | undefined;
};

function NftStakingForm({ venomConnect, address, provider }: Props) {
  const [tokenAmount, setTokenAmount] = useState<number | undefined>();
  const [stakingContract, setStakingContract] = useState<any>();
  const [tokenRootContract, setTokenRootContract] = useState<any>();
  const [tokenWalletContract, setTokenWalletContract] = useState<any>();
  const [tvl, setTvl] = useState(0);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [stakedAmount, setStakedAmount] = useState(0);
  const [claimedAmount, setClaimedAmount] = useState(0);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [stakingAddress, setStakingAddress] = useState("0:5a065cb9aa7518b6ebb3dfcd2464aa853b5d24913556059b4551803428c792c0");
  const [isStaking, setIsStaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [unstakable, setUnstakable] = useState(true);
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
          const images = await getNftImage(provider, new Address("0:127f28a512b73050a306a0836bb683bde3598e268594874b6aaa9a88c3b479d5"));
          console.log(images);
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
      setClaimedAmount(parseFloat(value0.claimedAmount)/(10**9));
      //setRewardAmount()
      const { totalStakedAmount } = await stakingContract.methods
      .totalStakedAmount({})
      .call({});
      setTvl(parseFloat(totalStakedAmount)/(10**9));
      const tokenBal = await tokenWalletContract.methods.balance({answerId: 0} as never).call();
      setTokenBalance(parseFloat((tokenBal.value0/(10**9)).toFixed(2)));

      const result = (await stakingContract.methods.getRewardAmount({staker: address}).call()).value0;
      console.log(result);
      setRewardAmount(result/(10**9));
      
      const res = await stakingContract.methods.unstakable({staker: address}).call();
      setUnstakable(res.value0);
      console.log(res);
    } catch (error) {
      console.log(error, "GREAT")
    }
  }

  useEffect(()=> {
    if(stakingContract && tokenWalletContract && address) {
      getStakingInfo();
    }
  }, [stakingContract, address, tokenWalletContract])

  const claimTokens = async () => {
    if(!stakingContract || !address) return;
    
  }

  const stakeTokens = async () => {
    if (!venomConnect || !address || !tokenAmount || !provider || !tokenWalletContract) return;
    
  };
  const unstakeTokens = async () => {
    if (!venomConnect || !address || !tokenAmount || !provider || !tokenWalletContract) return;
    
  };
  return (
    <>
      <h1>Stake NFT to boost your APY</h1>
      <div className="staked_reward">
        <div className="item-info">
          <div style={{textAlign:"center"}}>
            <b>STAKED</b><br />
            <b>{stakedAmount}</b>
          </div>
          <div style={{textAlign:"center"}}>
            <b>REWARD</b><br />
            <b>{rewardAmount}</b>
          </div>
        </div>
      </div>
      <div className="number">
        <input
          type="number"
          min={0}
          value={tokenAmount !== undefined ? tokenAmount : ""}
          style={{textAlign: "right"}}
          placeholder="Enter amount to stake or unstake"
          onChange={(e) => {
            onChangeAmount(e.target.value);
          }}
        />
      </div>
      <div className="card__amount">
        <a className={(!tokenAmount || isStaking ) ? "btn disabled" : "btn"} onClick={stakeTokens}>
          Stake
        </a>
        <a className={(!tokenAmount || tokenAmount>=stakedAmount) || isUnstaking || !unstakable ? "btn btn btn_unstake disabled" : "btn btn_unstake"} onClick={unstakeTokens}>
          Unstake
        </a>
      </div>
      <div className="card__amount">
        <a className={isClaiming || stakedAmount==0 ? "btn btn_claim disabled" : "btn btn_claim"} onClick={claimTokens}>
          Claim Reward
        </a>
      </div>
    </>
  );
}

export default NftStakingForm;
