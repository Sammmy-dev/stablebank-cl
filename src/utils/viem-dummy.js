const { privateKeyToAccount } = require("viem/accounts");
const {
  createPublicClient,
  createWalletClient,
  http,
  verifyMessage,
  parseEther,
  formatEther,
  getContract,
  parseAbiItem,
  encodeFunctionData,
  decodeFunctionResult,
} = require("viem");
const { polygonAmoy } = require("viem/chains");
const logger = require("./logger");

// Polygon Mumbai RPC URL - you can use Infura, Alchemy, or your own node
const POLYGON_MUMBAI_RPC =
  process.env.POLYGON_MUMBAI_RPC_URL ||
  "https://polygon-amoy.infura.io/v3/c7b637053e994766a7ca8e6a8868d621";

// Dummy USDC contract address - update this after deployment
const DUMMY_USDC_CONTRACT_ADDRESS =
  process.env.DUMMY_USDC_ADDRESS ||
  "0x0000000000000000000000000000000000000000";

// Dummy USDC ABI - includes additional functions for testing
const DUMMY_USDC_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "account", type: "address" }],
    name: "getBalanceUSDC",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "getTotalSupplyUSDC",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "recipients", type: "address[]" },
      { name: "amounts", type: "uint256[]" },
    ],
    name: "mintBatch",
    outputs: [],
    type: "function",
  },
];

// Create public client for read operations
const publicClient = createPublicClient({
  chain: polygonAmoy,
  transport: http(POLYGON_MUMBAI_RPC),
});

/**
 * Verify a signed message for authentication
 * @param {string} message - The original message that was signed
 * @param {string} signature - The signature to verify
 * @param {string} address - The address that should have signed the message
 * @returns {boolean} - True if signature is valid
 */
async function verifySignedMessage(message, signature, address) {
  try {
    const isValid = await verifyMessage({
      address,
      message,
      signature,
    });

    logger.info(
      `Message verification for ${address}: ${isValid ? "VALID" : "INVALID"}`
    );
    return isValid;
  } catch (error) {
    logger.error("Error verifying signed message:", error);
    return false;
  }
}

/**
 * Get dummy USDC balance for a given address
 * @param {string} address - The wallet address to check
 * @returns {Object} - Balance object with raw and formatted values
 */
async function getDummyUSDCBalance(address) {
  try {
    if (
      DUMMY_USDC_CONTRACT_ADDRESS ===
      "0x0000000000000000000000000000000000000000"
    ) {
      throw new Error(
        "Dummy USDC contract not deployed. Please deploy the contract first."
      );
    }

    const contract = getContract({
      address: DUMMY_USDC_CONTRACT_ADDRESS,
      abi: DUMMY_USDC_ABI,
      publicClient,
    });

    const [balance, decimals, symbol, name, balanceUSDC] = await Promise.all([
      publicClient.readContract({
        address: DUMMY_USDC_CONTRACT_ADDRESS,
        abi: DUMMY_USDC_ABI,
        functionName: "balanceOf",
        args: [address],
      }),
      publicClient.readContract({
        address: DUMMY_USDC_CONTRACT_ADDRESS,
        abi: DUMMY_USDC_ABI,
        functionName: "decimals",
      }),
      publicClient.readContract({
        address: DUMMY_USDC_CONTRACT_ADDRESS,
        abi: DUMMY_USDC_ABI,
        functionName: "symbol",
      }),
      publicClient.readContract({
        address: DUMMY_USDC_CONTRACT_ADDRESS,
        abi: DUMMY_USDC_ABI,
        functionName: "name",
      }),
      publicClient.readContract({
        address: DUMMY_USDC_CONTRACT_ADDRESS,
        abi: DUMMY_USDC_ABI,
        functionName: "getBalanceUSDC",
        args: [address],
      }),
    ]);

    // Dummy USDC has 6 decimals
    const formattedBalance = Number(balance) / Math.pow(10, decimals);

    logger.info(
      `Dummy USDC balance for ${address}: ${formattedBalance} ${symbol}`
    );

    return {
      raw: balance,
      formatted: formattedBalance,
      symbol,
      name,
      decimals,
      balanceUSDC: balanceUSDC.toString(),
      address: DUMMY_USDC_CONTRACT_ADDRESS,
      isDummy: true,
    };
  } catch (error) {
    logger.error("Error getting dummy USDC balance:", error);
    throw new Error(`Failed to get dummy USDC balance: ${error.message}`);
  }
}

/**
 * Transfer dummy USDC from a wallet to recipient
 * @param {string} toAddress - Recipient address
 * @param {number} amount - Amount in USDC (e.g., 10.5 for 10.5 USDC)
 * @param {string} privateKey - User's decrypted private key (required)
 * @returns {Object} - Transaction result
 */
async function transferDummyUSDC(toAddress, amount, privateKey) {
  if (!privateKey) {
    throw new Error("User private key is required for transferDummyUSDC");
  }

  if (
    DUMMY_USDC_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000"
  ) {
    throw new Error(
      "Dummy USDC contract not deployed. Please deploy the contract first."
    );
  }

  const localAccount = privateKeyToAccount(privateKey);
  const localWalletClient = createWalletClient({
    account: localAccount,
    chain: polygonAmoy,
    transport: http(POLYGON_MUMBAI_RPC),
  });

  try {
    const contract = getContract({
      address: DUMMY_USDC_CONTRACT_ADDRESS,
      abi: DUMMY_USDC_ABI,
      walletClient: localWalletClient,
    });

    // Convert amount to wei (Dummy USDC has 6 decimals)
    const amountInWei = BigInt(Math.floor(amount * 1000000));

    logger.info(
      `Initiating dummy USDC transfer: ${amount} USDC to ${toAddress}`
    );
    const hash = await contract.write.transfer([toAddress, amountInWei]);
    logger.info(`Dummy USDC transfer initiated. Transaction hash: ${hash}`);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    logger.info(
      `Dummy USDC transfer confirmed. Block number: ${receipt.blockNumber}`
    );

    return {
      hash,
      blockNumber: receipt.blockNumber,
      status: receipt.status,
      amount,
      toAddress,
      fromAddress: localAccount.address,
      contractAddress: DUMMY_USDC_CONTRACT_ADDRESS,
      isDummy: true,
    };
  } catch (error) {
    logger.error("Error transferring dummy USDC:", error);
    throw new Error(`Failed to transfer dummy USDC: ${error.message}`);
  }
}

/**
 * Mint dummy USDC to an address (owner only)
 * @param {string} toAddress - Recipient address
 * @param {number} amount - Amount in USDC (e.g., 10.5 for 10.5 USDC)
 * @param {string} privateKey - Owner's private key (required)
 * @returns {Object} - Transaction result
 */
async function mintDummyUSDC(toAddress, amount, privateKey) {
  if (!privateKey) {
    throw new Error("Owner private key is required for mintDummyUSDC");
  }

  if (
    DUMMY_USDC_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000"
  ) {
    throw new Error(
      "Dummy USDC contract not deployed. Please deploy the contract first."
    );
  }

  const localAccount = privateKeyToAccount(privateKey);
  const localWalletClient = createWalletClient({
    account: localAccount,
    chain: polygonAmoy,
    transport: http(POLYGON_MUMBAI_RPC),
  });

  try {
    const contract = getContract({
      address: DUMMY_USDC_CONTRACT_ADDRESS,
      abi: DUMMY_USDC_ABI,
      walletClient: localWalletClient,
    });

    // Convert amount to wei (Dummy USDC has 6 decimals)
    const amountInWei = BigInt(Math.floor(amount * 1000000));

    logger.info(`Minting dummy USDC: ${amount} USDC to ${toAddress}`);
    const hash = await contract.write.mint([toAddress, amountInWei]);
    logger.info(`Dummy USDC mint initiated. Transaction hash: ${hash}`);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    logger.info(
      `Dummy USDC mint confirmed. Block number: ${receipt.blockNumber}`
    );

    return {
      hash,
      blockNumber: receipt.blockNumber,
      status: receipt.status,
      amount,
      toAddress,
      fromAddress: localAccount.address,
      contractAddress: DUMMY_USDC_CONTRACT_ADDRESS,
      isDummy: true,
      action: "mint",
    };
  } catch (error) {
    logger.error("Error minting dummy USDC:", error);
    throw new Error(`Failed to mint dummy USDC: ${error.message}`);
  }
}

/**
 * Get dummy contract information
 * @returns {Object} - Contract information
 */
async function getDummyContractInfo() {
  try {
    if (
      DUMMY_USDC_CONTRACT_ADDRESS ===
      "0x0000000000000000000000000000000000000000"
    ) {
      throw new Error(
        "Dummy USDC contract not deployed. Please deploy the contract first."
      );
    }

    const contract = getContract({
      address: DUMMY_USDC_CONTRACT_ADDRESS,
      abi: DUMMY_USDC_ABI,
      publicClient,
    });

    const [name, symbol, decimals, totalSupplyUSDC] = await Promise.all([
      contract.read.name(),
      contract.read.symbol(),
      contract.read.decimals(),
      contract.read.getTotalSupplyUSDC(),
    ]);

    return {
      address: DUMMY_USDC_CONTRACT_ADDRESS,
      name,
      symbol,
      decimals: decimals.toString(),
      totalSupplyUSDC: totalSupplyUSDC.toString(),
      isDummy: true,
    };
  } catch (error) {
    logger.error("Error getting dummy contract info:", error);
    throw new Error(`Failed to get dummy contract info: ${error.message}`);
  }
}

/**
 * Get transaction status
 * @param {string} hash - Transaction hash
 * @returns {Object} - Transaction status
 */
async function getTransactionStatus(hash) {
  try {
    const receipt = await publicClient.getTransactionReceipt({ hash });

    return {
      hash,
      status: receipt.status,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
      effectiveGasPrice: receipt.effectiveGasPrice,
    };
  } catch (error) {
    logger.error("Error getting transaction status:", error);
    throw new Error(`Failed to get transaction status: ${error.message}`);
  }
}

/**
 * Get current gas price
 * @returns {Object} - Gas price information
 */
async function getGasPrice() {
  try {
    const gasPrice = await publicClient.getGasPrice();

    return {
      gasPrice: gasPrice.toString(),
      gasPriceGwei: formatEther(gasPrice, "gwei"),
    };
  } catch (error) {
    logger.error("Error getting gas price:", error);
    throw new Error(`Failed to get gas price: ${error.message}`);
  }
}

/**
 * Get account balance (native token - MATIC)
 * @param {string} address - Wallet address
 * @returns {Object} - Balance information
 */
async function getAccountBalance(address) {
  try {
    const balance = await publicClient.getBalance({ address });

    return {
      raw: balance.toString(),
      formatted: formatEther(balance),
      symbol: "MATIC",
    };
  } catch (error) {
    logger.error("Error getting account balance:", error);
    throw new Error(`Failed to get account balance: ${error.message}`);
  }
}

/**
 * Create a message for signing (useful for authentication)
 * @param {string} address - User's wallet address
 * @param {number} timestamp - Current timestamp
 * @returns {string} - Message to sign
 */
function createSignMessage(address, timestamp) {
  return `StableBank Authentication\n\nAddress: ${address}\nTimestamp: ${timestamp}\n\nSign this message to authenticate with StableBank.`;
}

module.exports = {
  publicClient,
  verifySignedMessage,
  getDummyUSDCBalance,
  transferDummyUSDC,
  mintDummyUSDC,
  getDummyContractInfo,
  getTransactionStatus,
  getGasPrice,
  getAccountBalance,
  createSignMessage,
  DUMMY_USDC_CONTRACT_ADDRESS,
  DUMMY_USDC_ABI,
};
