// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract CryptoDevs is ERC721Enumerable, Ownable {
      /**
      * @dev _baseTokenURI for computing {tokenURI}. If set, the resulting URI for each
      * token will be the concatenation of the `baseURI` and the `tokenId`.
      */
   string _baseTokenURI;

   // price is the price for cyrptodev nft
   uint256 public _price = 0.01 ether;

   // _paused means contract is paused in any emergency
   // by default the value is false for any boolean
   bool public _paused;

   // max No. of Crypto devs 
   uint256 public maxTokenIds = 20;

   // total number of tokenIds minted
   // by default it is 0
   uint256 public tokenIds;

   // Whitelist contract instance
   IWhitelist whitelist;

   // boolean to keep track of whether presale started or not
   bool public presaleStarted;

   // timestamp for when presale would end
   uint256 public presaleEnded;

   modifier onlyWhenNotPaused {
      require(!_paused, "Contract currently paused");
      _;
   }

   /**
      * @dev ERC721 constructor takes in a `name` and a `symbol` to the token collection.
      * name in our case is `Crypto Devs` and symbol is `CD`.
      * Constructor for Crypto Devs takes in the baseURI to set _baseTokenURI for the collection.
      * It also initializes an instance of whitelist interface.
   */

   constructor (string memory baseURI, address whitelistContract) ERC721 ("CryptoDevs", "CD") {
      _baseTokenURI = baseURI;
      
      // here we are creating an instance of that interface 
      // allows us to interact with 1 function 
      whitelist = IWhitelist(whitelistContract);
   }

   /**
    * @dev startPresale starts a presale for the whitelisted addresses
   */

   function startPresale() public onlyOwner {
      presaleStarted = true;

      // from the current blocktimestamp add 5 minutes and that's when presale will end 
      presaleEnded = block.timestamp + 5 minutes;
   }

   /**
      * @dev presaleMint allows a user to mint one NFT per transaction during the presale.
   */

   // only runs when cryptodev is not paused and this is a payavle fn,0.001 eth
   function presaleMint() public payable onlyWhenNotPaused {

      //presale perid must be running
      require(presaleStarted && block.timestamp < presaleEnded, "Presale is not running right now");
      // address should be in whitelist
      require(whitelist.whitelistedAddress(msg.sender), "You are not whitelisted");
      // tokenIds should be available
      require(tokenIds < maxTokenIds, "Excesdded max supply");
      require(msg.value >= _price, "Ether sent is not correct");

      // then logic
      // increase tokenId
      tokenIds += 1;

      // mint NFT
      _safeMint(msg.sender, tokenIds);
   }

    /**
    * @dev mint allows a user to mint 1 NFT per transaction after the presale has ended.
    */

   function mint() public payable onlyWhenNotPaused {
      //presale perid must have ended
      require(presaleStarted && block.timestamp >= presaleEnded, "Presale is running right now");
      // tokenIds should be available
      require(tokenIds < maxTokenIds, "Excesdded max supply");
      require(msg.value >= _price, "Ether sent is not correct");

      tokenIds += 1;
      _safeMint(msg.sender, tokenIds);
   }

   /**
    * @dev _baseURI overides the Openzeppelin's ERC721 implementation which by default
    * returned an empty string for the baseURI
    */

   function _baseURI() internal view virtual override returns(string memory) {
      return _baseTokenURI;
   }

   /**
    * @dev setPaused makes the contract paused or unpaused
      */
   function setPaused(bool val) public onlyOwner {
        _paused = val;
   }

   
   /**
    * @dev withdraw sends all the ether in the contract
    * to the owner of the contract
   */

   function withdraw() public onlyOwner {
      address _owner = owner();
      uint256 amount = address(this).balance;

      (bool sent, ) = _owner.call{value: amount}("");
      require(sent, "Failed to send ether");
   }


     // Function to receive Ether. msg.data must be empty
   receive() external payable {}

    // Fallback function is called when msg.data is not empty
   fallback() external payable {}
 
}