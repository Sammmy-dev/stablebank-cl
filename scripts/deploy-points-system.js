const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying PointsSystem contract...");

  // Get the contract factory
  const PointsSystem = await ethers.getContractFactory("PointsSystem");

  // Deploy the contract
  const pointsSystem = await PointsSystem.deploy();
  await pointsSystem.waitForDeployment();

  const contractAddress = await pointsSystem.getAddress();
  console.log("PointsSystem deployed to:", contractAddress);

  // Get network information
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "localhost" : network.name;

  // Create deployment info object
  const deploymentInfo = {
    contractName: "PointsSystem",
    contractAddress: contractAddress,
    network: networkName,
    chainId: network.chainId,
    deployer: (await ethers.getSigners())[0].address,
    deployedAt: new Date().toISOString(),
    constructorArgs: [],
    abi: PointsSystem.interface.formatJson(),
  };

  // Save deployment info to file
  const deploymentFile = path.join(
    __dirname,
    "..",
    "deployment-info-points.json"
  );
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("Deployment info saved to:", deploymentFile);

  // Verify contract on Etherscan (if not localhost)
  if (networkName !== "localhost" && networkName !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await pointsSystem.deployTransaction.wait(6); // Wait for 6 block confirmations

    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("Contract verified on Etherscan!");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }

  // Initialize contract with some basic configuration
  console.log("Initializing contract configuration...");

  try {
    // Update some action points if needed
    const actions = [
      "referral_signup",
      "staking_flexible",
      "transaction_send",
      "engagement_daily_login",
    ];

    for (const action of actions) {
      const currentPoints = await pointsSystem.getActionPoints(action);
      console.log(`${action}: ${currentPoints} points`);
    }

    // Get tier configurations
    const tiers = ["bronze", "silver", "gold", "platinum", "diamond"];
    for (const tier of tiers) {
      const config = await pointsSystem.getTierConfig(tier);
      console.log(
        `${tier} tier: ${config.minPoints} min points, ${config.multiplier} multiplier`
      );
    }

    console.log("Contract initialization completed!");
  } catch (error) {
    console.log("Contract initialization failed:", error.message);
  }

  console.log("\n=== Deployment Summary ===");
  console.log("Contract: PointsSystem");
  console.log("Address:", contractAddress);
  console.log("Network:", networkName);
  console.log("Chain ID:", network.chainId);
  console.log("Deployer:", deploymentInfo.deployer);
  console.log("Deployed at:", deploymentInfo.deployedAt);
  console.log("========================\n");

  return {
    contractAddress,
    deploymentInfo,
  };
}

// Handle errors
main()
  .then((result) => {
    console.log("Deployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
