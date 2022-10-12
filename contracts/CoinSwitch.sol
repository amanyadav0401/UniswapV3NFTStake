//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC721/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./libraries/TickMath.sol";
import "./libraries/LiquidityAmounts.sol";
import "./interfaces/INonfungiblePositionManager.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract StakeLPNFT is ERC20, Ownable, ReentrancyGuard {

    struct lpDeposit{
        address owner;
        uint unlockTime;
    }

    address admin;
    uint160 sqrtPriceX96 = 159228162514264337593543950336;
    mapping(uint=>lpDeposit) public LPDetails;
    uint minimumTimeForStake;
    INonfungiblePositionManager nftPositionManager;
    

    constructor(address _admin, INonfungiblePositionManager _nftPositionManager) ERC20("Reward","RWD"){
           admin = _admin;
           nftPositionManager = _nftPositionManager;
    }

    function setMinimumTimeForStake(uint _timePeriod) public onlyOwner{
            minimumTimeForStake = _timePeriod;
    }

    function getTick(uint160 _sqrtPriceX96) public view returns (int24 tick) {
    tick = TickMath.getTickAtSqrtRatio(_sqrtPriceX96);
}


    function tokenAmounts(uint tokenId) public view returns(uint amountA, uint amountB) {
    (,,,,,int24 tickLower, int24 tickUpper,uint128 liquidity,,,uint128 feeA,uint128 feeB) = nftPositionManager.positions(tokenId);
    int24 tick = getTick(sqrtPriceX96);
   (amountA, amountB) = LiquidityAmounts.getAmountsForLiquidity(
      TickMath.getSqrtRatioAtTick(tick),
      TickMath.getSqrtRatioAtTick(tickLower),
      TickMath.getSqrtRatioAtTick(tickUpper),
      liquidity
    );
    console.log("yeh amount0",amountA);

    
}
function stake(uint _tokenId) public {
        (uint amountA, uint amountB) = tokenAmounts(_tokenId);
        nftPositionManager.safeTransferFrom(msg.sender,address(this),_tokenId);
        LPDetails[_tokenId].owner = msg.sender;
        LPDetails[_tokenId].unlockTime = block.timestamp+minimumTimeForStake;
        uint mintable = amountA*2;
        _mint(msg.sender,mintable);
    }


function unStake(uint _tokenId) public  {
    require(msg.sender==LPDetails[_tokenId].owner,"You are not the owner of the NFT");
    require(block.timestamp>LPDetails[_tokenId].unlockTime,"Not the right time to leave!");
    nftPositionManager.safeTransferFrom(address(this), msg.sender, _tokenId);
}

function onERC721Received(address, address, uint256, bytes memory) public virtual returns (bytes4) {
        return this.onERC721Received.selector;
    }

/*Read :
For mainnet pricefetching the sqrtPriceX96 for any uniswap v3 nft, we need to fetch the current price i.e priceA and priceB from chainlink

(e.g. 1)  function getPrices(address tokenA, address tokenB) public view returns (uint priceA, uint priceB) {
    uint _priceA = priceFeed.price(tokenA);
    uint _priceB = priceFeed.price(tokenB);

    priceA = 1*10**IERC20(tokenA).decimals();
    priceB = _priceB*IERC20(tokenB).decimals()/_priceA;

    return (priceA,priceB);

}

function _sqrt(uint _x) internal pure returns(uint y){
    uint z = (_x+1)/2;
    y = _x;
    while (z<y){
        y=z;
        z = (_x/z+z)/2;
    }
}

function getSqrtPriceX96(uint priceA, uint priceB) public view returns(uint){
    uint ratioX192 = (priceA << 192)/priceB;
    return _sqrt(ratioX192);
}


STEPS TO GET THE AMOUNT0 and issue the reward ERC20 tokens :
1. get the nft data from positionManager positions().
2. use token addresses to calculate the price for both assets. (as illustrated in e.g 1)
3. convert the price to sqrt ratio and then calculate tick.
4. use tick, tickLower, tickUpper and liquidity to fetch Amounts.
5. use Amount0 to calculate the ERC20 tokens to be minted and update the pending rewards for the user.
6. user can click on the claim() function to get the reward tokens transferred to their addresses.
7. user can use the unStake() function to remove the NFT from the staking contract after the lock period is over.
*/


}