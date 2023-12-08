import React, { useEffect, useState } from "react";
import { VenomConnect } from "venom-connect";
import { Address, ProviderRpcClient } from "everscale-inpage-provider";

// we will user bignumber library to operate with deposit values (remember about decimals multiply)
import BigNumber from "bignumber.js";

// Importing of our contract ABI from smart-contract build action. Of cource we need ABI for contracts calls.
import stakingAbi from "../abi/Staking.abi.json";
import tokenRootAbi from "../abi/TokenRoot.abi.json";
import tokenWalletAbi from "../abi/TokenWallet.abi.json";
import { getNftImage, getNftsByIndexes } from "../utils/nft";
import { NFT_COLLECTION1, STAKING_ADDR, TOKEN_ROOT } from "../utils/constant";

type Props = {
  venomConnect: VenomConnect | undefined;
  address: string | undefined;
  provider: ProviderRpcClient | undefined;
};

function NftStakingForm({ venomConnect, address, provider }: Props) {
  const [stakingContract, setStakingContract] = useState<any>();
  const [tokenRootContract, setTokenRootContract] = useState<any>();
  const [tokenWalletContract, setTokenWalletContract] = useState<any>();
  const [stakingAddress, setStakingAddress] = useState(STAKING_ADDR);
  const [nftUrls, setNftUrls] = useState<string[]>([]);
  
  useEffect(()=> {
    if(provider) {
      const contractAddress = new Address(stakingAddress); // Our Staking contract address
      const contractInstance = new provider.Contract(stakingAbi, contractAddress);
      setStakingContract(contractInstance);

      const tokenRootAddress = new Address(TOKEN_ROOT); // Our token root address
      const tokenRootInstance = new provider.Contract(tokenRootAbi, tokenRootAddress);
      setTokenRootContract(tokenRootInstance);
    }
  }, [provider])


  const saltCode = async (provider: ProviderRpcClient, ownerAddress: string) => {
    // Index StateInit you should take from github. It ALWAYS constant!
    const INDEX_BASE_64 = 'te6ccgECIAEAA4IAAgE0AwEBAcACAEPQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAgaK2zUfBAQkiu1TIOMDIMD/4wIgwP7jAvILHAYFHgOK7UTQ10nDAfhmifhpIds80wABn4ECANcYIPkBWPhC+RDyqN7TPwH4QyG58rQg+COBA+iogggbd0CgufK0+GPTHwHbPPI8EQ4HA3rtRNDXScMB+GYi0NMD+kAw+GmpOAD4RH9vcYIImJaAb3Jtb3Nwb3T4ZNwhxwDjAiHXDR/yvCHjAwHbPPI8GxsHAzogggujrde64wIgghAWX5bBuuMCIIIQR1ZU3LrjAhYSCARCMPhCbuMA+EbycyGT1NHQ3vpA0fhBiMjPjits1szOyds8Dh8LCQJqiCFus/LoZiBu8n/Q1PpA+kAwbBL4SfhKxwXy4GT4ACH4a/hs+kJvE9cL/5Mg+GvfMNs88gAKFwA8U2FsdCBkb2Vzbid0IGNvbnRhaW4gYW55IHZhbHVlAhjQIIs4rbNYxwWKiuIMDQEK103Q2zwNAELXTNCLL0pA1yb0BDHTCTGLL0oY1yYg10rCAZLXTZIwbeICFu1E0NdJwgGOgOMNDxoCSnDtRND0BXEhgED0Do6A34kg+Gz4a/hqgED0DvK91wv/+GJw+GMQEQECiREAQ4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAD/jD4RvLgTPhCbuMA0x/4RFhvdfhk0ds8I44mJdDTAfpAMDHIz4cgznHPC2FeIMjPkll+WwbOWcjOAcjOzc3NyXCOOvhEIG8TIW8S+ElVAm8RyM+EgMoAz4RAzgH6AvQAcc8LaV4gyPhEbxXPCx/OWcjOAcjOzc3NyfhEbxTi+wAaFRMBCOMA8gAUACjtRNDT/9M/MfhDWMjL/8s/zsntVAAi+ERwb3KAQG90+GT4S/hM+EoDNjD4RvLgTPhCbuMAIZPU0dDe+kDR2zww2zzyABoYFwA6+Ez4S/hK+EP4QsjL/8s/z4POWcjOAcjOzc3J7VQBMoj4SfhKxwXy6GXIz4UIzoBvz0DJgQCg+wAZACZNZXRob2QgZm9yIE5GVCBvbmx5AELtRNDT/9M/0wAx+kDU0dD6QNTR0PpA0fhs+Gv4avhj+GIACvhG8uBMAgr0pCD0oR4dABRzb2wgMC41OC4yAAAADCD4Ye0e2Q==';
    // Gettind a code from Index StateInit
    const tvc = await provider.splitTvc(INDEX_BASE_64);
    if (!tvc.code) throw new Error('tvc code is empty');
    // Salt structure that we already know
    const saltStruct = [
      { name: 'collection', type: 'address' },
      { name: 'owner', type: 'address' },
      { name: 'type', type: 'fixedbytes3' }, // according on standards, each index salted with string 'nft'
    ] as const;
    const { code: saltedCode } = await provider.setCodeSalt({
      code: tvc.code,
      salt: {
        structure: saltStruct,
        abiVersion: '2.1',
        data: {
          collection: new Address(NFT_COLLECTION1),
          owner: new Address(ownerAddress),
          type: btoa('nft'),
        },
      },
    });
    return saltedCode;
  };

  // Method, that return Index'es addresses by single query with fetched code hash
  const getAddressesFromIndex = async (codeHash: string): Promise<Address[] | undefined> => {
    const addresses = await provider?.getAccountsByCodeHash({ codeHash });
    return addresses?.accounts;
  };

  // Main method of this component
  const loadNFTs = async (provider: ProviderRpcClient, ownerAddress: string) => {
    try {
      // Take a salted code
      const saltedCode = await saltCode(provider, ownerAddress);
      // Hash it
      const codeHash = await provider.getBocHash(saltedCode);
      if (!codeHash) {
        return;
      }
      // Fetch all Indexes by hash
      const indexesAddresses = await getAddressesFromIndex(codeHash);
      console.log(indexesAddresses)
      if (!indexesAddresses || !indexesAddresses.length) {
        return;
      }
      // Fetch all image URLs
      const urls = await getNftsByIndexes(provider, indexesAddresses);
      console.log(urls)
      setNftUrls(urls);
    } catch (e) {
      console.error(e);
    }
  };


  useEffect(()=> {
    if(provider && address && tokenRootContract) {
      (async() => {
        try {
          await loadNFTs(provider, address);
          
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
    } catch (error) {
      console.log(error, "GREAT")
    }
  }

  useEffect(()=> {
    if(stakingContract && tokenWalletContract && address) {
      getStakingInfo();
    }
  }, [stakingContract, address, tokenWalletContract])

  const stakeNFT = async (item:any) => {
    if (!venomConnect || !address || !provider || !tokenWalletContract) return;
    console.log(item);
  };
  const unstakeTokens = async () => {
    if (!venomConnect || !address || !provider || !tokenWalletContract) return;
    
  };
  return (
    <>
      <h1>Stake NFT to boost your APY</h1>
        <div className="grid">
          {nftUrls.map((item) => 
            <div className="nft_item">
              <video width="150"  autoPlay={true}>
                <source src={item} type="video/mp4" />
              </video>
              <div className="btn" style={{cursor: "pointer"}} onClick={() => stakeNFT(item)}>Stake</div>
            </div>)}
        </div>
    </>
  );
}

export default NftStakingForm;
