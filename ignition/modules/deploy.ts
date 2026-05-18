import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("AchievementNFTModule", (m) => {
  const achievementNFT = m.contract("AchievementNFT");

  const to = m.getParameter("to");
  const achievementKey = m.getParameter("achievementKey");
  const metadataURI = m.getParameter("metadataURI");

  m.call(achievementNFT, "mintAchievement", [to, achievementKey, metadataURI]);

  return { achievementNFT };
});