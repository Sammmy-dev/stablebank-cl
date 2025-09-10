const {
  createPublicClient,
  createWalletClient,
  http,
  getContract,
  parseEther,
  formatEther,
  encodeFunctionData,
  decodeFunctionResult,
  parseAbiItem,
} = require("viem");
const { mainnet, polygon, arbitrum } = require("viem/chains");
const logger = require("./logger");

// DeBridge contract addresses (mainnet)
const DEBRIDGE_CONTRACTS = {
  ethereum: {
    address: "0x43dE2d77bf8027e25dD1794aD5b6b29a47456b10", // DeBridge mainnet
    chainId: 1,
  },
  polygon: {
    address: "0x43dE2d77bf8027e25dD1794aD5b6b29a47456b10", // DeBridge Polygon
    chainId: 137,
  },
  arbitrum: {
    address: "0x43dE2d77bf8027e25dD1794aD5b6b29a47456b10", // DeBridge Arbitrum
    chainId: 42161,
  },
};

// DeBridge ABI for cross-chain transfers
const DEBRIDGE_ABI = [
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_debridgeId",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_chainIdTo",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_receiver",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "_permit",
        type: "bytes",
      },
      {
        internalType: "bool",
        name: "_useAssetFee",
        type: "bool",
      },
      {
        internalType: "uint32",
        name: "_referralCode",
        type: "uint32",
      },
      {
        internalType: "bytes",
        name: "_autoParams",
        type: "bytes",
      },
    ],
    name: "send",
    outputs: [
      {
        internalType: "bytes32",
        name: "_transferId",
        type: "bytes32",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_transferId",
        type: "bytes32",
      },
    ],
    name: "getDebridgeId",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_debridgeId",
        type: "bytes32",
      },
    ],
    name: "getDebridge",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "minAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "fee",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "collectedFees",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "supply",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "chainId",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "tokenAddress",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "minReserves",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxReserves",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "isNative",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "isEnabled",
            type: "bool",
          },
        ],
        internalType: "struct IDeBridge.DebridgeInfo",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

// ERC20 ABI for token approvals
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_owner", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
];

// RPC URLs for each chain
const RPC_URLS = {
  ethereum:
    process.env.ETHEREUM_RPC_URL ||
    "https://eth-mainnet.g.alchemy.com/v2/your-api-key",
  polygon:
    process.env.POLYGON_RPC_URL ||
    "https://polygon-mainnet.g.alchemy.com/v2/your-api-key",
  arbitrum:
    process.env.ARBITRUM_RPC_URL ||
    "https://arb-mainnet.g.alchemy.com/v2/your-api-key",
};

// Create clients for each chain
const clients = {
  ethereum: createPublicClient({
    chain: mainnet,
    transport: http(RPC_URLS.ethereum),
  }),
  polygon: createPublicClient({
    chain: polygon,
    transport: http(RPC_URLS.polygon),
  }),
  arbitrum: createPublicClient({
    chain: arbitrum,
    transport: http(RPC_URLS.arbitrum),
  }),
};

/**
 * Get DeBridge ID for a token on a specific chain
 * @param {string} tokenAddress - Token contract address
 * @param {number} chainId - Chain ID
 * @returns {string} - DeBridge ID
 */
function getDebridgeId(tokenAddress, chainId) {
  // DeBridge ID is keccak256(chainId + tokenAddress)
  const { keccak256, encodePacked } = require("viem");
  const packed = encodePacked(
    ["uint256", "address"],
    [BigInt(chainId), tokenAddress]
  );
  return keccak256(packed);
}

/**
 * Get DeBridge info for a token
 * @param {string} chain - Chain name
 * @param {string} tokenAddress - Token contract address
 * @returns {Object} - DeBridge information
 */
async function getDebridgeInfo(chain, tokenAddress) {
  try {
    const client = clients[chain];
    const contract = getContract({
      address: DEBRIDGE_CONTRACTS[chain].address,
      abi: DEBRIDGE_ABI,
      publicClient: client,
    });

    const debridgeId = getDebridgeId(
      tokenAddress,
      DEBRIDGE_CONTRACTS[chain].chainId
    );
    const info = await contract.read.getDebridge([debridgeId]);

    return {
      debridgeId,
      minAmount: info.minAmount,
      maxAmount: info.maxAmount,
      fee: info.fee,
      collectedFees: info.collectedFees,
      supply: info.supply,
      chainId: info.chainId,
      tokenAddress: info.tokenAddress,
      minReserves: info.minReserves,
      maxReserves: info.maxReserves,
      isNative: info.isNative,
      isEnabled: info.isEnabled,
    };
  } catch (error) {
    logger.error(
      `Error getting DeBridge info for ${tokenAddress} on ${chain}:`,
      error
    );
    throw new Error(`Failed to get DeBridge info: ${error.message}`);
  }
}

/**
 * Calculate DeBridge transfer fee
 * @param {string} fromChain - Source chain
 * @param {string} toChain - Destination chain
 * @param {string} tokenAddress - Token address
 * @param {number} amount - Transfer amount
 * @returns {Object} - Fee information
 */
async function calculateTransferFee(fromChain, toChain, tokenAddress, amount) {
  try {
    const debridgeInfo = await getDebridgeInfo(fromChain, tokenAddress);

    if (!debridgeInfo.isEnabled) {
      throw new Error(
        `DeBridge transfer not enabled for ${tokenAddress} on ${fromChain}`
      );
    }

    const amountBigInt = BigInt(Math.floor(amount * Math.pow(10, 6))); // Assuming 6 decimals for stablecoins

    if (amountBigInt < debridgeInfo.minAmount) {
      throw new Error(
        `Amount too small. Minimum: ${formatEther(debridgeInfo.minAmount)}`
      );
    }

    if (amountBigInt > debridgeInfo.maxAmount) {
      throw new Error(
        `Amount too large. Maximum: ${formatEther(debridgeInfo.maxAmount)}`
      );
    }

    // Calculate fee (simplified - in practice, DeBridge has complex fee calculation)
    const fee = (amountBigInt * debridgeInfo.fee) / BigInt(10000); // Fee in basis points

    return {
      amount: amountBigInt,
      fee,
      totalAmount: amountBigInt + fee,
      feeUSD: Number(formatEther(fee)), // Assuming 1:1 USD ratio for stablecoins
      estimatedTime: "5-15 minutes", // Typical DeBridge transfer time
    };
  } catch (error) {
    logger.error("Error calculating transfer fee:", error);
    throw error;
  }
}

/**
 * Approve token spending for DeBridge
 * @param {string} chain - Chain name
 * @param {string} tokenAddress - Token contract address
 * @param {string} spenderAddress - DeBridge contract address
 * @param {number} amount - Amount to approve
 * @param {string} privateKey - User's decrypted private key (required)
 * @returns {Object} - Approval transaction result
 */
async function approveToken(
  chain,
  tokenAddress,
  spenderAddress,
  amount,
  privateKey
) {
  if (!privateKey) {
    throw new Error("User private key is required for approveToken");
  }
  const { privateKeyToAccount, createWalletClient, http } = require("viem");
  const localAccount = privateKeyToAccount(privateKey);
  const localWalletClient = createWalletClient({
    account: localAccount,
    chain: require("viem/chains")[chain],
    transport: http(RPC_URLS[chain]),
  });
  try {
    const client = clients[chain];
    const tokenContract = getContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      walletClient: localWalletClient,
    });
    const amountBigInt = BigInt(Math.floor(amount * Math.pow(10, 6)));
    logger.info(`Approving ${amount} tokens for DeBridge on ${chain}`);
    const hash = await tokenContract.write.approve([
      spenderAddress,
      amountBigInt,
    ]);
    const receipt = await client.waitForTransactionReceipt({ hash });
    logger.info(`Token approval confirmed on ${chain}. Hash: ${hash}`);
    return {
      hash,
      blockNumber: receipt.blockNumber,
      status: receipt.status,
    };
  } catch (error) {
    logger.error("Error approving token:", error);
    throw new Error(`Failed to approve token: ${error.message}`);
  }
}

/**
 * Execute cross-chain transfer using DeBridge
 * @param {Object} transferData - Transfer parameters
 * @param {string} privateKey - User's decrypted private key (required)
 * @returns {Object} - Transfer result
 */
async function executeCrossChainTransfer(transferData, privateKey) {
  if (!privateKey) {
    throw new Error(
      "User private key is required for executeCrossChainTransfer"
    );
  }
  const {
    fromChain,
    toChain,
    tokenAddress,
    amount,
    recipientAddress,
    senderAddress,
    description = "",
  } = transferData;
  const { privateKeyToAccount, createWalletClient, http } = require("viem");
  const localAccount = privateKeyToAccount(privateKey);
  const localWalletClient = createWalletClient({
    account: localAccount,
    chain: require("viem/chains")[fromChain],
    transport: http(RPC_URLS[fromChain]),
  });
  try {
    // Calculate fee
    const feeInfo = await calculateTransferFee(
      fromChain,
      toChain,
      tokenAddress,
      amount
    );
    // Approve tokens for DeBridge
    const debridgeAddress = DEBRIDGE_CONTRACTS[fromChain].address;
    await approveToken(
      fromChain,
      tokenAddress,
      debridgeAddress,
      feeInfo.totalAmount,
      privateKey
    );
    // Prepare DeBridge transfer
    const client = clients[fromChain];
    const debridgeContract = getContract({
      address: debridgeAddress,
      abi: DEBRIDGE_ABI,
      walletClient: localWalletClient,
    });
    const debridgeId = getDebridgeId(
      tokenAddress,
      DEBRIDGE_CONTRACTS[fromChain].chainId
    );
    const toChainId = DEBRIDGE_CONTRACTS[toChain].chainId;
    logger.info(
      `Initiating DeBridge transfer: ${amount} tokens from ${fromChain} to ${toChain}`
    );
    // Execute DeBridge send transaction
    const hash = await debridgeContract.write.send(
      [
        debridgeId,
        feeInfo.amount,
        toChainId,
        recipientAddress,
        "0x", // permit (empty for now)
        false, // useAssetFee
        0, // referralCode
        "0x", // autoParams
      ],
      {
        value: 0, // No ETH value for token transfers
      }
    );
    const receipt = await client.waitForTransactionReceipt({ hash });
    logger.info(`DeBridge transfer initiated. Hash: ${hash}`);

    return {
      transferId: hash,
      debridgeId,
      fromChain,
      toChain,
      tokenAddress,
      amount: feeInfo.amount,
      fee: feeInfo.fee,
      recipientAddress,
      transactionHash: hash,
      blockNumber: receipt.blockNumber,
      status: "processing",
      estimatedTime: feeInfo.estimatedTime,
    };
  } catch (error) {
    logger.error("Error executing cross-chain transfer:", error);
    throw new Error(`Failed to execute cross-chain transfer: ${error.message}`);
  }
}

/**
 * Get transfer status from DeBridge
 * @param {string} transferId - DeBridge transfer ID
 * @param {string} chain - Chain to check
 * @returns {Object} - Transfer status
 */
async function getTransferStatus(transferId, chain) {
  try {
    const client = clients[chain];
    const contract = getContract({
      address: DEBRIDGE_CONTRACTS[chain].address,
      abi: DEBRIDGE_ABI,
      publicClient: client,
    });

    // Note: This is a simplified status check
    // In practice, DeBridge has more complex status tracking
    const receipt = await client.getTransactionReceipt({ hash: transferId });

    return {
      transferId,
      status: receipt.status === "success" ? "completed" : "failed",
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(`Error getting transfer status for ${transferId}:`, error);
    return {
      transferId,
      status: "unknown",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Validate cross-chain transfer parameters
 * @param {Object} params - Transfer parameters
 * @returns {Object} - Validation result
 */
function validateTransferParams(params) {
  const { fromChain, toChain, tokenAddress, amount, recipientAddress } = params;
  const errors = [];

  if (!fromChain || !DEBRIDGE_CONTRACTS[fromChain]) {
    errors.push("Invalid source chain");
  }

  if (!toChain || !DEBRIDGE_CONTRACTS[toChain]) {
    errors.push("Invalid destination chain");
  }

  if (fromChain === toChain) {
    errors.push("Source and destination chains must be different");
  }

  if (!tokenAddress || tokenAddress.length !== 42) {
    errors.push("Invalid token address");
  }

  if (!amount || amount <= 0) {
    errors.push("Amount must be greater than 0");
  }

  if (!recipientAddress || recipientAddress.length !== 42) {
    errors.push("Invalid recipient address");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  getDebridgeInfo,
  calculateTransferFee,
  approveToken,
  executeCrossChainTransfer,
  getTransferStatus,
  validateTransferParams,
  getDebridgeId,
  DEBRIDGE_CONTRACTS,
};
