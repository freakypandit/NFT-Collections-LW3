import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";

const Home = () => {

  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
  // presaleStarted keeps track of whether the presale has started or not
  const [presaleStarted, setPresaleStarted] = useState(false);
  // presaleEnded keeps track of whether the presale ended
  const [presaleEnded, setPresaleEnded] = useState(false);
  // loading is set to true when we are waiting for a transaction to get mined
  const [loading, setLoading] = useState(false);
  // checks if the currently connected MetaMask wallet is the owner of the contract
  const [isOwner, setIsOwner] = useState(false);
  // tokenIdsMinted keeps track of the number of tokenIds that have been minted
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();

  /**
   * presaleMint: Mint an NFT during the presale
   */

  const presaleMint = async () => {
    try { 

      //signer
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);

      //we are calling presaleMint 
      // and sending a msg.value with the transaction
      const tx = await nftContract.presaleMint({
        value: utils.parseEther("0.01"),
      });

      setLoading(true);

      await tx.wait();

      setLoading(false);
      window.alert("Congratulations! you have sucessfully minted and NFT");
    } catch(err) {
      console.error(err)
    }
  };

  /**
   * publicMint: Mint an NFT after the presale
   */
  const publicMint = async () => {

    try {

      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);

      const tx = await nftContract.mint( {
        value: utils.parseEther("0.01"),
      });

      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev!");

    } catch(err) {
      console.error(err);
    }
  };

  const getOwner = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call the owner function from the contract
      const _owner = await nftContract.owner();
      // We will get the signer now to extract the address of the currently connected MetaMask account
      const signer = await getProviderOrSigner(true);
      // Get the address associated to the signer which is connected to  MetaMask
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  /*
    connectWallet: Connects the MetaMask wallet
  */
  
  const connectWallet = async () => {
    try{
      
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch(err) {
      console.error(err);
    }
  };

  
  /**
   * startPresale: starts the presale for the NFT Collection
   */
  const startPresale = async () => {
    try {

      const singer = await getProviderOrSigner(true);

      const nftContract = new Contract (NFT_CONTRACT_ADDRESS, abi, singer);

      const tx = await nftContract.startPresale();

      setLoading(true);
      await tx.wait();

      setLoading(false);

      await checkIfPresaleStarted();
    } catch(err) {
      console.error(err);
    }
  };
  
  
  /**
   * checkIfPresaleStarted: checks if the presale has started by quering the `presaleStarted`
   * variable in the contract
   */
 const checkIfPresaleStarted = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call the presaleStarted from the contract
      const _presaleStarted = await nftContract.presaleStarted();
      if (!_presaleStarted) {
        await getOwner();
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (err) {
      console.error(err);
      return false;
    }
  };
  
  /**
   * checkIfPresaleEnded: checks if the presale has ended by quering the `presaleEnded`
   * variable in the contract
   */

  const checkIfPresaleEnded = async () => {

    try {

      const provider = await getProviderOrSigner();

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      const _presaleEnded = await nftContract.presaleEnded();

      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
      if (hasEnded) {
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }
      return hasEnded;

    } catch(err) {
      console.log(err);
      return false;
    }
  };







  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Goerli network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Change the network to Goerli");
      throw new Error("Change network to Goerli");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  /**
   * getTokenIdsMinted: gets the number of tokenIds that have been minted
   */
  const getTokenIdsMinted = async () => {

    try {

      const provider = await getProviderOrSigner();

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      const _tokenIds = await nftContract.tokenIds();

      //_tokenIds is a `Big Number`. We need to convert the Big Number to a string
      setTokenIdsMinted(_tokenIds.toString());

    } catch(err) {
      console.error(err);
    }
  };

  // run a sideeffect 
  // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called

  useEffect(() => {

    // if wallet is not connect than connect it - 
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();

      //check the status of presale
      const _presaleStarted = checkIfPresaleStarted();

      if(_presaleStarted) {
        checkIfPresaleEnded();
      }

      // this is a code that runs by items and checks in every 5 seconds if the presale has ended
      const presaleEndedInterval = setInterval(async function () {
        const _presaleStarted = await checkIfPresaleStarted();
        if (_presaleStarted) {
          const _presaleEnded = await checkIfPresaleEnded();
          if (_presaleEnded) {
            clearInterval(presaleEndedInterval);
          }
        }
      }, 5 * 1000);

      // The setInterval() method continues calling the function until clearInterval() is called, or the window is closed.
      setInterval(async function () {
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  }, [walletConnected]);

  //conditional rendering based on the current state
  const renderButton = () => {

    // Condition 1: The wallet is not connected
    if(!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.description}>
          Connect your Wallet
        </button>
      );
    }

    // Condition 2: THe screen is loading
    if (loading) {
      return (
        <button className={styles.button}> Loading ... </button>
      )
    }

    // COndition 3: the address is of owner and presale hasn't started 
    if (isOwner && !presaleStarted) {
      return (
        <button className={styles.button} onClick={startPresale} >
          Start Presale!
        </button>
      );
    }

    // condition 4: If user, and presale hasn't started
    if(!presaleStarted) {
      return(
        <div className={styles.description}> Presale hasnt started</div>
      );
    }

    // COndition 5: Prsale period is going on 
    if(presaleStarted && !presaleEnded) {
      return (
        <div>
          <div className={styles.description} >
            Presale has Started !!! if you are in the whitelist, start minting 
          </div>

          <button className={styles.button} onClick={presaleMint}>
            Presale Mint 🚀
          </button>
        </div>
      );
    }

    // Condition 6: Presale ended 
    if (presaleStarted && presaleEnded) {
      return (
        <button className={styles.button} onClick={publicMint}>
          Public Mint 🚀
        </button>
      );
    }

  };

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/20 have been minted
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./cryptodevs/0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );

}

export default Home;