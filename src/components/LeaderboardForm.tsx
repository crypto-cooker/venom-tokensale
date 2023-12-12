import React, { useEffect, useState } from "react";
import { VenomConnect } from "venom-connect";
import { Address, ProviderRpcClient } from "everscale-inpage-provider";

// we will user bignumber library to operate with deposit values (remember about decimals multiply)
import BigNumber from "bignumber.js";

// Importing of our contract ABI from smart-contract build action. Of cource we need ABI for contracts calls.
import stakingAbi from "../abi/Staking.abi.json";
import tokenRootAbi from "../abi/TokenRoot.abi.json";
import { COLLECTION1, STAKING_ADDR, TOKEN_ROOT } from "../utils/constant";
import LeaderboardItem from "./LeaderBoardItem";
type Props = {
  venomConnect: VenomConnect | undefined;
  address: string | undefined;
  provider: ProviderRpcClient | undefined;
};

function LeaderboardForm({ venomConnect, address, provider }: Props) {
  const [stakingContract, setStakingContract] = useState<any>();
  const [tokenRootContract, setTokenRootContract] = useState<any>();
  const [tokenWalletContract, setTokenWalletContract] = useState<any>();
  const [ranksInfo, setRankInfo] = useState<any>([]);
  
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
  
  const getRankInfo = async () => {
    try {
      const { stakes } = await stakingContract.methods
      .stakes({})
      .call({});
      //const ranks = [];
      
      console.log(stakes);
      //return stakes;
      return stakes.sort((a:any, b:any)=> {return b[1].amount-a[1].amount});
    } catch (error) {
      console.log(error, "GREAT")
      return [];
    }
  }

  const getRewardAmount = async (staker:any) => {
    try {
      const result = await stakingContract.methods
      .getRewardAmount({staker})
      .call({});
      return result;
    } catch (error) {
      console.log(error, "GREAT")
      return [];
    }
  }

  useEffect(()=> {
    if(stakingContract && address) {
      (async() => {
        const data = await getRankInfo();
        if(data) {
          setRankInfo(data);
        }
      })();
    }
  }, [stakingContract, address])
  
  return (
    <div className="nft_unstaking_card">
      <div className="card__wrap">
        <h1>LeaderBoard</h1>
        <div className="leaderboard_column">
          <div>Staker </div>
          <div>Staked Amount</div>
        </div>
        {
          ranksInfo.map((item:any, index:number) => (
            <LeaderboardItem key={index} index={index} address={item[0].toString()} amount={item[1].amount} />
          ))
        }
      </div>
    </div>
  );
}

export default LeaderboardForm;
