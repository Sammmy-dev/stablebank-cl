const { createPublicClient, http, getContract } = require("viem");
const { mainnet, polygon, arbitrum } = require("viem/chains");
const axios = require("axios");
const logger = require("./logger");

// RPC URLs for each chain
const ETHEREUM_RPC =
  process.env.ETHEREUM_RPC_URL ||
  "https://eth-mainnet.g.alchemy.com/v2/your-api-key";
const POLYGON_RPC =
  process.env.POLYGON_RPC_URL ||
  "https://polygon-mainnet.g.alchemy.com/v2/your-api-key";
const ARBITRUM_RPC =
  process.env.ARBITRUM_RPC_URL ||
  "https://arb-mainnet.g.alchemy.com/v2/your-api-key";

// Stablecoin contract addresses
const STABLECOIN_ADDRESSES = {
  ethereum: {
    USDC: "0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C", // Mainnet USDC placeholder - replace with real address
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // Mainnet USDT
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // Mainnet DAI
  },
  polygon: {
    USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // Polygon USDC
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // Polygon USDT
    DAI: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", // Polygon DAI
  },
  arbitrum: {
    USDC: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // Arbitrum USDC
    USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // Arbitrum USDT
    DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", // Arbitrum DAI
  },
};

// ERC20 ABI for balanceOf function
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
];

// Create public clients for each chain
const clients = {
  ethereum: createPublicClient({
    chain: mainnet,
    transport: http(ETHEREUM_RPC),
  }),
  polygon: createPublicClient({
    chain: polygon,
    transport: http(POLYGON_RPC),
  }),
  arbitrum: createPublicClient({
    chain: arbitrum,
    transport: http(ARBITRUM_RPC),
  }),
};

/**
 * Fetch token price from CoinGecko API
 * @param {string} tokenId - CoinGecko token ID (e.g., 'usd-coin', 'tether', 'dai')
 * @returns {number} - Token price in USD
 */
async function fetchTokenPrice(tokenId) {
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`,
      {
        timeout: 10000,
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (response.data && response.data[tokenId] && response.data[tokenId].usd) {
      return response.data[tokenId].usd;
    }

    throw new Error(`Price not found for token: ${tokenId}`);
  } catch (error) {
    logger.error(`Error fetching price for ${tokenId}:`, error.message);
    // Return 1.0 as fallback for stablecoins if API fails
    return 1.0;
  }
}

/**
 * Get token balance for a specific chain and token
 * @param {string} chain - Chain name (ethereum, polygon, arbitrum)
 * @param {string} tokenSymbol - Token symbol (USDC, USDT, DAI)
 * @param {string} address - Wallet address
 * @returns {Object} - Token balance information
 */
async function getTokenBalance(chain, tokenSymbol, address) {
  try {
    const client = clients[chain];
    const tokenAddress = STABLECOIN_ADDRESSES[chain][tokenSymbol];

    if (!tokenAddress) {
      throw new Error(`Token ${tokenSymbol} not supported on ${chain}`);
    }

    const contract = getContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      publicClient: client,
    });

    const [balance, decimals, symbol] = await Promise.all([
      contract.read.balanceOf([address]),
      contract.read.decimals(),
      contract.read.symbol(),
    ]);

    const formattedBalance = Number(balance) / Math.pow(10, decimals);

    return {
      chain,
      token: tokenSymbol,
      address: tokenAddress,
      rawBalance: balance.toString(),
      formattedBalance,
      decimals,
      symbol,
    };
  } catch (error) {
    logger.error(
      `Error getting ${tokenSymbol} balance on ${chain}:`,
      error.message
    );
    return {
      chain,
      token: tokenSymbol,
      address: STABLECOIN_ADDRESSES[chain][tokenSymbol],
      rawBalance: "0",
      formattedBalance: 0,
      decimals: 6,
      symbol: tokenSymbol,
      error: error.message,
    };
  }
}

/**
 * Get unified balance across all supported chains and stablecoins
 * @param {string} address - Wallet address
 * @returns {Object} - Unified balance information
 */
async function getUnifiedBalance(address) {
  try {
    logger.info(`Fetching unified balance for address: ${address}`);

    // Define tokens to fetch for each chain
    const tokensByChain = {
      ethereum: ["USDC", "USDT", "DAI"],
      polygon: ["USDC", "USDT", "DAI"],
      arbitrum: ["USDC", "USDT", "DAI"],
    };

    // Fetch all balances in parallel
    const balancePromises = [];
    for (const [chain, tokens] of Object.entries(tokensByChain)) {
      for (const token of tokens) {
        balancePromises.push(getTokenBalance(chain, token, address));
      }
    }

    const balances = await Promise.all(balancePromises);

    // Fetch prices for all tokens
    const tokenPriceMap = {
      USDC: "usd-coin",
      USDT: "tether",
      DAI: "dai",
    };

    const pricePromises = Object.entries(tokenPriceMap).map(
      async ([symbol, coinId]) => {
        const price = await fetchTokenPrice(coinId);
        return { symbol, price };
      }
    );

    const prices = await Promise.all(pricePromises);
    const priceMap = Object.fromEntries(prices.map((p) => [p.symbol, p.price]));

    // Calculate USD values and totals
    let totalUSD = 0;
    const chainTotals = {};
    const detailedBalances = [];

    for (const balance of balances) {
      if (balance.error) {
        detailedBalances.push(balance);
        continue;
      }

      const price = priceMap[balance.token] || 1.0;
      const usdValue = balance.formattedBalance * price;

      const balanceWithUSD = {
        ...balance,
        priceUSD: price,
        usdValue,
      };

      detailedBalances.push(balanceWithUSD);

      // Add to chain totals
      if (!chainTotals[balance.chain]) {
        chainTotals[balance.chain] = 0;
      }
      chainTotals[balance.chain] += usdValue;

      // Add to grand total
      totalUSD += usdValue;
    }

    const result = {
      address,
      totalUSD,
      chainTotals,
      balances: detailedBalances,
      timestamp: new Date().toISOString(),
      supportedChains: Object.keys(tokensByChain),
      supportedTokens: Object.keys(tokenPriceMap),
    };

    logger.info(
      `Unified balance calculated for ${address}: $${totalUSD.toFixed(2)} USD`
    );
    return result;
  } catch (error) {
    logger.error("Error getting unified balance:", error);
    throw new Error(`Failed to get unified balance: ${error.message}`);
  }
}

/**
 * Get balance for a specific chain only
 * @param {string} chain - Chain name (ethereum, polygon, arbitrum)
 * @param {string} address - Wallet address
 * @returns {Object} - Chain balance information
 */
async function getChainBalance(chain, address) {
  try {
    const tokens = ["USDC", "USDT", "DAI"];
    const balancePromises = tokens.map((token) =>
      getTokenBalance(chain, token, address)
    );
    const balances = await Promise.all(balancePromises);

    // Fetch prices
    const tokenPriceMap = {
      USDC: "usd-coin",
      USDT: "tether",
      DAI: "dai",
    };

    const pricePromises = Object.entries(tokenPriceMap).map(
      async ([symbol, coinId]) => {
        const price = await fetchTokenPrice(coinId);
        return { symbol, price };
      }
    );

    const prices = await Promise.all(pricePromises);
    const priceMap = Object.fromEntries(prices.map((p) => [p.symbol, p.price]));

    // Calculate totals
    let totalUSD = 0;
    const detailedBalances = [];

    for (const balance of balances) {
      if (balance.error) {
        detailedBalances.push(balance);
        continue;
      }

      const price = priceMap[balance.token] || 1.0;
      const usdValue = balance.formattedBalance * price;

      const balanceWithUSD = {
        ...balance,
        priceUSD: price,
        usdValue,
      };

      detailedBalances.push(balanceWithUSD);
      totalUSD += usdValue;
    }

    return {
      chain,
      address,
      totalUSD,
      balances: detailedBalances,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(`Error getting ${chain} balance:`, error);
    throw new Error(`Failed to get ${chain} balance: ${error.message}`);
  }
}

module.exports = {
  getUnifiedBalance,
  getChainBalance,
  getTokenBalance,
  fetchTokenPrice,
};
