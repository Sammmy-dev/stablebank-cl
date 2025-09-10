const {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  formatEther,
} = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { polygonAmoy } = require("viem/chains");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const POLYGON_AMOY_RPC =
  process.env.POLYGON_MUMBAI_RPC_URL ||
  "https://polygon-amoy.infura.io/v3/c7b637053e994766a7ca8e6a8868d621";
const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "0xd7704be6160b1a7b1042bb9bdad56af53c85d677fca67e1a34d9dccd533ea318";

// Create clients
const publicClient = createPublicClient({
  chain: polygonAmoy,
  transport: http(POLYGON_AMOY_RPC),
});

const account = privateKeyToAccount(PRIVATE_KEY);
const walletClient = createWalletClient({
  account,
  chain: polygonAmoy,
  transport: http(POLYGON_AMOY_RPC),
});

/**
 * Read compiled contract artifacts
 */
function getContractArtifacts() {
  try {
    const artifactsPath = path.join(
      __dirname,
      "artifacts",
      "contracts",
      "DummyUSDC.sol",
      "DummyUSDC.json"
    );

    if (!fs.existsSync(artifactsPath)) {
      throw new Error(
        "Contract artifacts not found. Please compile the contract first."
      );
    }

    const artifacts = JSON.parse(fs.readFileSync(artifactsPath, "utf8"));
    return {
      abi: artifacts.abi,
      bytecode: artifacts.bytecode,
    };
  } catch (error) {
    console.error("❌ Error reading contract artifacts:", error.message);
    throw error;
  }
}

/**
 * Compile the Solidity contract using Hardhat
 */
async function compileContract() {
  console.log("🔨 Compiling contract...");
  try {
    // Run hardhat compile
    execSync("npx hardhat compile", { stdio: "inherit" });
    console.log("✅ Contract compiled successfully");
    return true;
  } catch (error) {
    console.error("❌ Compilation failed:", error.message);
    return false;
  }
}

// async function noNounce() {

//   return nonce;
// }

/**
 * Deploy the DummyUSDC contract
 */
// async function deployContract() {
//   console.log("\n🚀 Deploying DummyUSDC contract to Polygon Amoy...");

//   try {
//     // Get contract artifacts
//     const { abi, bytecode } = getContractArtifacts();

//     // Get the deployer address
//     const deployerAddress = account.address;
//     console.log(`📋 Deployer address: ${deployerAddress}`);

//     // Get current gas price
//     const gasPrice = await publicClient.getGasPrice();
//     console.log(`⛽ Gas price: ${formatEther(gasPrice)} ETH`);

//     // Get deployer balance
//     const balance = await publicClient.getBalance({ address: deployerAddress });
//     console.log(`💰 Deployer balance: ${formatEther(balance)} ETH`);

//     // Deploy contract
//     const hash = await walletClient.deployContract({
//       abi: abi,
//       bytecode: bytecode,
//       args: [deployerAddress], // initialOwner parameter
//       gas: 2000000n, // Gas limit
//     });

//     console.log(`📝 Transaction hash: ${hash}`);

//     // Wait for transaction to be mined
//     console.log("⏳ Waiting for transaction to be mined...");
//     const receipt = await publicClient.waitForTransactionReceipt({ hash });

//     console.log(`✅ Contract deployed successfully!`);
//     console.log(`📍 Contract address: ${receipt.contractAddress}`);

//     return {
//       contractAddress: receipt.contractAddress,
//       transactionHash: hash,
//       deployer: deployerAddress,
//       gasUsed: receipt.gasUsed,
//       blockNumber: receipt.blockNumber,
//     };
//   } catch (error) {
//     console.error("❌ Deployment failed:", error);
//     throw error;
//   }
// }

async function deployContract() {
  console.log("\n🚀 Deploying DummyUSDC contract to Polygon Amoy...");

  try {
    const { abi, bytecode } = getContractArtifacts();

    const deployerAddress = account.address;
    console.log(`📋 Deployer address: ${deployerAddress}`);

    // Get current gas price and bump it for faster mining
    let gasPrice = await publicClient.getGasPrice();
    console.log(`⛽ Suggested gas price: ${formatEther(gasPrice)} ETH`);
    gasPrice = (gasPrice * 120n) / 100n; // Increase by 20%
    console.log(`⚡ Using bumped gas price: ${formatEther(gasPrice)} ETH`);

    // Get deployer balance
    const balance = await publicClient.getBalance({ address: deployerAddress });
    console.log(`💰 Deployer balance: ${formatEther(balance)} ETH`);

    const nonce = await publicClient.getTransactionCount({
      address: account.address,
      blockTag: "pending",
    });

    // Deploy contract
    const hash = await walletClient.deployContract({
      abi,
      bytecode,
      args: [deployerAddress], // initialOwner
      gas: 2_000_000n, // Gas limit
      gasPrice: gasPrice,
      nonce,
    });

    console.log(`📝 Transaction hash: ${hash}`);

    // Wait for transaction to be mined with a longer timeout
    console.log("⏳ Waiting for transaction to be mined...");
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      timeout: 180_000, // 3 minutes
      pollingInterval: 5_000, // poll every 5s
    });

    console.log(`✅ Contract deployed successfully!`);
    console.log(`📍 Contract address: ${receipt.contractAddress}`);

    return {
      contractAddress: receipt.contractAddress,
      transactionHash: hash,
      deployer: deployerAddress,
      gasUsed: receipt.gasUsed,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error("❌ Deployment failed:", error);

    if (error.shortMessage?.includes("Timed out")) {
      console.error(
        "💡 Tip: Try increasing gas price or using a faster RPC endpoint."
      );
    }

    throw error;
  }
}
/**
 * Verify the deployed contract
 */
async function verifyContract(contractAddress) {
  console.log("\n🔍 Verifying deployed contract...");

  try {
    const { abi } = getContractArtifacts();

    // Get contract details
    const name = await publicClient.readContract({
      address: contractAddress,
      abi: abi,
      functionName: "name",
    });

    const symbol = await publicClient.readContract({
      address: contractAddress,
      abi: abi,
      functionName: "symbol",
    });

    const decimals = await publicClient.readContract({
      address: contractAddress,
      abi: abi,
      functionName: "decimals",
    });

    const totalSupply = await publicClient.readContract({
      address: contractAddress,
      abi: abi,
      functionName: "totalSupply",
    });

    const owner = await publicClient.readContract({
      address: contractAddress,
      abi: abi,
      functionName: "owner",
    });

    console.log("✅ Contract verification successful:");
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Decimals: ${decimals}`);
    console.log(`   Total Supply: ${totalSupply}`);
    console.log(`   Owner: ${owner}`);

    return {
      name,
      symbol,
      decimals: Number(decimals),
      totalSupply: totalSupply.toString(),
      owner,
    };
  } catch (error) {
    console.error("❌ Contract verification failed:", error);
    throw error;
  }
}

/**
 * Save deployment information to file
 */
function saveDeploymentInfo(deploymentResult, contractInfo) {
  const deploymentInfo = {
    contractAddress: deploymentResult.contractAddress,
    deployer: deploymentResult.deployer,
    network: "polygonAmoy",
    timestamp: new Date().toISOString(),
    transactionHash: deploymentResult.transactionHash,
    gasUsed: deploymentResult.gasUsed.toString(),
    blockNumber: deploymentResult.blockNumber.toString(),
    ...contractInfo,
  };

  const filename = "deployment-info-polygon-amoy.json";
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment info saved to ${filename}`);

  return deploymentInfo;
}

/**
 * Main deployment function
 */
async function main() {
  console.log("🎯 DummyUSDC Contract Deployment to Polygon Amoy");
  console.log("=".repeat(50));

  try {
    // Step 1: Compile contract
    const compiled = await compileContract();
    if (!compiled) {
      console.error("❌ Compilation failed. Exiting...");
      process.exit(1);
    }

    // Step 2: Deploy contract
    const deploymentResult = await deployContract();

    // Step 3: Verify contract
    const contractInfo = await verifyContract(deploymentResult.contractAddress);

    // Step 4: Save deployment info
    const deploymentInfo = saveDeploymentInfo(deploymentResult, contractInfo);

    console.log("\n🎉 Deployment completed successfully!");
    console.log("=".repeat(50));
    console.log(`📋 Contract Address: ${deploymentInfo.contractAddress}`);
    console.log(`🔗 Transaction Hash: ${deploymentInfo.transactionHash}`);
    console.log(`🌐 Network: ${deploymentInfo.network}`);
    console.log(`⏰ Timestamp: ${deploymentInfo.timestamp}`);

    // Update environment variable suggestion
    console.log("\n💡 Update your .env file with:");
    console.log(
      `DUMMY_USDC_CONTRACT_ADDRESS=${deploymentInfo.contractAddress}`
    );
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Run the deployment
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Unhandled error:", error);
    process.exit(1);
  });
}

module.exports = {
  deployContract,
  verifyContract,
  compileContract,
};
