import {it, describe} from "node:test";
import assert from "node:assert";
import hre from "hardhat";
import {keccak256,stringToBytes,getAddress} from "viem";


const {viem,networkHelpers} = await hre.network.create();
const publicClient = await viem.getPublicClient();
const wallets = await viem.getWalletClients();
const userDeployer = await viem.getWalletClient(wallets[0].account.address);
const userMinter = await viem.getWalletClient(wallets[1].account.address);
const userAchievementTaker = await viem.getWalletClient(wallets[2].account.address);
const achievementKey = keccak256(stringToBytes("ACHIEVEMENT_1"));
const metadataURI = "https://example.com/achievement/1";
describe("AchievementNFT", () => {
    async function deployFixture(){
        const contract = await viem.deployContract("AchievementNFT", [], {
            client: {
              public: publicClient,
              wallet: userDeployer,
            },
          });
        
        return {contract};
    }

    async function DeployAndMintFixture(){
        const {contract} = await networkHelpers.loadFixture(deployFixture);
        const sbtDeployer = await viem.getContractAt("AchievementNFT",contract.address,{
            client:{
                public:publicClient,
                wallet:userDeployer
            },
        });
        await sbtDeployer.write.grantRole([await sbtDeployer.read.MINTER_ROLE(), userMinter.account.address]);
        const sbtMinter = await viem.getContractAt("AchievementNFT",contract.address,{
            client:{
                public:publicClient,
                wallet:userMinter
            },
        });
        return {contract, sbtDeployer, sbtMinter};
    }


    it("should deploy the contract by the user", async () => {
        const {contract} = await networkHelpers.loadFixture(deployFixture);
        const sbt = await viem.getContractAt("AchievementNFT",contract.address,{
            client:{
                public:publicClient,
                wallet:userDeployer
            },
        });
        assert.ok(sbt.address !== null);
        assert.ok(await sbt.read.name() === "AchievementNFT");
        assert.ok(await sbt.read.symbol() === "ACH");
        assert.ok(await sbt.read.hasRole([await sbt.read.DEFAULT_ADMIN_ROLE(), userDeployer.account.address]));
        assert.ok(await sbt.read.hasRole([await sbt.read.MINTER_ROLE(), userDeployer.account.address]));
    });

    it("should grant role of minter to minter user by deployer and revoke role of minter", async () => {
        const {contract} = await networkHelpers.loadFixture(deployFixture);
        const sbt = await viem.getContractAt("AchievementNFT",contract.address,{
            client:{
                public:publicClient,
                wallet:userDeployer
            },
        });
        await sbt.write.grantRole([await sbt.read.MINTER_ROLE(), userMinter.account.address]);
        assert.ok(await sbt.read.hasRole([await sbt.read.MINTER_ROLE(), userMinter.account.address]));
        await sbt.write.revokeRole([await sbt.read.MINTER_ROLE(), userMinter.account.address]);
        assert.ok(!await sbt.read.hasRole([await sbt.read.MINTER_ROLE(), userMinter.account.address]));
    });

    it("should mint an achievement by the minter user and revert after re-minting", async () => {
        

        console.log(achievementKey);

        const {sbtMinter} = await networkHelpers.loadFixture(DeployAndMintFixture);
        const sim = await sbtMinter.simulate.mintAchievement([userAchievementTaker.account.address, achievementKey, metadataURI]);
        const tokenId = sim.result;
        const hash = await userMinter.writeContract(sim.request);
        await publicClient.waitForTransactionReceipt({ hash });

        console.log(tokenId);
        console.log(await sbtMinter.read.ownerOf([tokenId]));
        console.log(await sbtMinter.read.hasAchievement([userAchievementTaker.account.address, achievementKey]));
        console.log(await sbtMinter.read.getAchievementKey([tokenId]) );
        
        assert.ok(getAddress(await sbtMinter.read.ownerOf([tokenId])) === getAddress(userAchievementTaker.account.address));
        assert.ok(await sbtMinter.read.hasAchievement([userAchievementTaker.account.address, achievementKey]));
        assert.ok(await sbtMinter.read.getAchievementKey([tokenId]) === achievementKey);
        assert.ok(await sbtMinter.read.tokenURI([tokenId]) === metadataURI);
        
        await assert.rejects(
            () => sbtMinter.write.mintAchievement([userAchievementTaker.account.address, achievementKey, metadataURI]),
          );
    });

    it("should pause and unpause the contract", async () => {
        const {sbtDeployer,sbtMinter} = await networkHelpers.loadFixture(DeployAndMintFixture);
        await sbtDeployer.write.pause();
        assert.ok(await sbtDeployer.read.paused());
        await assert.rejects(
            () => sbtMinter.write.mintAchievement([userAchievementTaker.account.address, achievementKey, metadataURI]),
          );
         await sbtDeployer.write.unpause();
        assert.ok(!await sbtDeployer.read.paused());
        await sbtMinter.write.mintAchievement([userAchievementTaker.account.address, achievementKey, metadataURI]);
        assert.ok(await sbtMinter.read.hasAchievement([userAchievementTaker.account.address, achievementKey]));
    });

    
});