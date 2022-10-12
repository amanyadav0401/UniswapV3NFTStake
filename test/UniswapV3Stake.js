const BN = require("ethers").BigNumber;
const { expect } = require("chai");
const { ethers } = require("hardhat");
const {describe} = require("mocha");
require("@nomicfoundation/hardhat-chai-matchers");

const { BigNumber } = require("@ethersproject/bignumber");
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace");

describe("UniswapNFTTest",function() {

    beforeEach(async ()=>{

                [owner, user1 ,user2, user3, lptoken, lptoken1, lptoken2, user4, user5, ...addrs] = await ethers.getSigners();
        
                TOKEN1 = await ethers.getContractFactory("FIRSTTOKEN");
                token1 = await TOKEN1.deploy();
                //console.log("token1",token1.address);
        
        
                TOKEN2 = await ethers.getContractFactory("SECONDTOKEN");
                token2 = await TOKEN2.deploy();
                //console.log("token2",token2.address);
        
        
                TOKEN3 = await ethers.getContractFactory("THIRDTOKEN");
                token3 = await TOKEN3.deploy();
        
                //console.log("token3",token3.address);
           
                FACTORY = await ethers.getContractFactory("UniswapV3Factory");
                factory = await FACTORY.deploy();
        
                WETH = await ethers.getContractFactory("WETH");
                weth = await WETH.deploy();
        
            
                ROUTER = await ethers.getContractFactory("SwapRouter");
                router = await ROUTER.deploy(factory.address,weth.address);
               // console.log("swaprouter===============",await swaprouter.address )
        
                NFTDescriptor = await ethers.getContractFactory("NFTDescriptor");
                nftdescriptor = await NFTDescriptor.deploy();
        
                //console.log("nftdescriptor+++++++++++++++",await nftdescriptor.address);
        
                NFTPositionDescriptor = await ethers.getContractFactory("NonfungibleTokenPositionDescriptor", {libraries: {NFTDescriptor: nftdescriptor.address }});
                nftpositiondescriptor = await NFTPositionDescriptor.deploy(weth.address,"0x7dd481eb4b63b94bb55e6b98aabb06c3b8484f82a4d656d6bca0b0cf9b446be0");
        
                NFTPositionManager  = await ethers.getContractFactory("NonfungiblePositionManager");
                nftPositionManager  = await  NFTPositionManager.deploy(factory.address,weth.address,nftpositiondescriptor.address);
               
                StakeNFT = await ethers.getContractFactory("StakeLPNFT");
                stakelp = await StakeNFT.deploy(owner.address,nftPositionManager.address);
               // console.log("nonfungiblePositionManager+++++++++++++++++++",await nonfungiblePositionManager.address);

               await token1.connect(owner).approve(nftPositionManager.address,BigNumber.from(10000).mul(BigNumber.from(10).pow(18)));
               const allow = await token1.allowance(owner.address,nftPositionManager.address);
               console.log("Allowance",allow);
     
               await token2.connect(owner).approve(nftPositionManager.address,BigNumber.from(1000).mul(BigNumber.from(10).pow(18)));
     
               await nftPositionManager.connect(owner).createAndInitializePoolIfNecessary(token1.address,token2.address,3000,"159228162514264337593543950336");
               
               await token1.connect(owner).transfer(user1.address,BigNumber.from("10").mul(BigNumber.from(10).pow(18)));
               await token2.connect(owner).transfer(user1.address,BigNumber.from("40").mul(BigNumber.from(10).pow(18)));
     
               await token1.connect(user1).approve(nftPositionManager.address,BigNumber.from(1000).mul(BigNumber.from(10).pow(18)));
               await token2.connect(user1).approve(nftPositionManager.address,BigNumber.from(1000).mul(BigNumber.from(10).pow(18)));
               
               //adding liquidity by owner
               await nftPositionManager.connect(owner).mint(
                [token1.address,
                token2.address,
                fee = 3000,
                tickLower = -60000,
                tickUpper =  60000,
                feeGrowthInside0LastX128 =  BigNumber.from("2").mul(BigNumber.from(10).pow(18)),
                feeGrowthInside1LastX128 =  BigNumber.from("8").mul(BigNumber.from(10).pow(18)),
                tokensOwed0 =  0,
                tokensOwed1 =  0,
                owner.address,
                1669999614]
              );

              //adding liquidity by user1
              const eventcought = await expect(nftPositionManager.connect(user1).mint([token1.address,
                token2.address,
                fee = 3000,
                tickLower = -60000,
                tickUpper =  60000,
                feeGrowthInside0LastX128 =  BigNumber.from("1").mul(BigNumber.from(10).pow(18)),
                feeGrowthInside1LastX128 =  BigNumber.from("4").mul(BigNumber.from(10).pow(18)),
                tokensOwed0 =  0,
                tokensOwed1 =  0,
                user1.address,
                1669999614])).to.emit(nftPositionManager, "IncreaseLiquidity");
              
            })
        

     it.only("Staking LPNFT",async()=>{

          const nftBalanceOwner = await nftPositionManager.balanceOf(user1.address);
          console.log("LP NFT Balance Owner: ",nftBalanceOwner);
          const nftBalanceUser1 = await nftPositionManager.balanceOf(user1.address);
          console.log("LP NFT Balance User1: ",nftBalanceUser1);


          let lpnft = await nftPositionManager.connect(owner).positions(1);
          console.log("LP caught: ",lpnft);

          //minimum lock period 

          await stakelp.connect(owner).setMinimumTimeForStake(60); // minimum time for the nfts to be locked is 60 seconds.

          //approving stakeLP contract for the nfts

          await nftPositionManager.connect(owner).approve(stakelp.address,1);
          console.log("TokenAmounts",await stakelp.connect(owner).tokenAmounts(1));
          await nftPositionManager.connect(user1).approve(stakelp.address,2);

          // User1 staking LP-NFTs in the contract.
          await stakelp.connect(user1).stake(2);
          console.log(await stakelp.LPDetails(2));

          // LPs belong to the contract check.
          await expect(await nftPositionManager.balanceOf(stakelp.address)).to.be.equal(1);
          await expect(await stakelp.balanceOf(user1.address)).to.be.equal(BN.from("1827813506995294324"));
          console.log("Balance of contract :",await nftPositionManager.balanceOf(stakelp.address));
          console.log("Balance Rewards: ",await stakelp.balanceOf(user1.address));

          // Owner staking LP-NFTs in the contract.
          await stakelp.connect(owner).stake(1);
          console.log(await stakelp.LPDetails(1));

          // reward balance 
          console.log("balance owner",await stakelp.balanceOf(owner.address));
          console.log("balance user1",await stakelp.balanceOf(user1.address));

          // unstaking the nfts before lock period is over

           await expect(stakelp.connect(user1).unStake(2)).to.be.revertedWith("Not the right time to leave!");
         
          // unstaking after lock period is over.
          await network.provider.send("evm_increaseTime", [150]);
          await network.provider.send("evm_mine");
          await stakelp.connect(user1).unStake(2);
          console.log("New Balance",await nftPositionManager.balanceOf(stakelp.address));
          console.log("balance erc20 user1",await stakelp.balanceOf(user1.address));



     })


})