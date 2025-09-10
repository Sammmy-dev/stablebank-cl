// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title PointsSystem
 * @dev A smart contract for managing user points and rewards
 */
contract PointsSystem is Ownable, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;

    // Events
    event PointsAwarded(address indexed user, uint256 points, string action, uint256 timestamp);
    event PointsRedeemed(address indexed user, uint256 points, string reward, uint256 timestamp);
    event TierUpgraded(address indexed user, string fromTier, string toTier, uint256 timestamp);
    event ReferralPointsAwarded(address indexed referrer, address indexed referred, uint256 points, uint256 timestamp);

    // Structs
    struct UserPoints {
        uint256 totalPoints;
        uint256 redeemedPoints;
        string tier;
        uint256 lastActivity;
        bool isActive;
    }

    struct PointsAction {
        string action;
        uint256 points;
        uint256 timestamp;
        bool isRedeemed;
    }

    struct TierConfig {
        string name;
        uint256 minPoints;
        uint256 multiplier;
        bool isActive;
    }

    // State variables
    Counters.Counter private _actionIdCounter;
    
    mapping(address => UserPoints) public userPoints;
    mapping(address => mapping(uint256 => PointsAction)) public userActions;
    mapping(address => uint256) public userActionCount;
    mapping(string => TierConfig) public tierConfigs;
    mapping(string => uint256) public actionPoints;
    
    // Referral system
    mapping(address => address) public referrals;
    mapping(address => address[]) public referredUsers;
    mapping(address => uint256) public referralPoints;

    // Constants
    uint256 public constant POINTS_DECIMALS = 18;
    uint256 public constant MINIMUM_REDEMPTION = 100 * 10**POINTS_DECIMALS;

    // Modifiers
    modifier onlyActiveUser(address user) {
        require(userPoints[user].isActive, "User not active");
        _;
    }

    modifier validAction(string memory action) {
        require(actionPoints[action] > 0, "Invalid action");
        _;
    }

    constructor() {
        _initializeTiers();
        _initializeActions();
    }

    /**
     * @dev Initialize tier configurations
     */
    function _initializeTiers() internal {
        tierConfigs["bronze"] = TierConfig("bronze", 0, 100, true);
        tierConfigs["silver"] = TierConfig("silver", 5000 * 10**POINTS_DECIMALS, 120, true);
        tierConfigs["gold"] = TierConfig("gold", 10000 * 10**POINTS_DECIMALS, 150, true);
        tierConfigs["platinum"] = TierConfig("platinum", 25000 * 10**POINTS_DECIMALS, 200, true);
        tierConfigs["diamond"] = TierConfig("diamond", 50000 * 10**POINTS_DECIMALS, 300, true);
    }

    /**
     * @dev Initialize action point values
     */
    function _initializeActions() internal {
        // Referral actions
        actionPoints["referral_signup"] = 1000 * 10**POINTS_DECIMALS;
        actionPoints["referral_first_transaction"] = 500 * 10**POINTS_DECIMALS;
        actionPoints["referral_staking"] = 200 * 10**POINTS_DECIMALS;
        actionPoints["referral_investment"] = 300 * 10**POINTS_DECIMALS;

        // Staking actions
        actionPoints["staking_flexible"] = 50 * 10**POINTS_DECIMALS;
        actionPoints["staking_locked_30"] = 75 * 10**POINTS_DECIMALS;
        actionPoints["staking_locked_90"] = 100 * 10**POINTS_DECIMALS;
        actionPoints["staking_locked_180"] = 150 * 10**POINTS_DECIMALS;
        actionPoints["staking_locked_365"] = 200 * 10**POINTS_DECIMALS;

        // Transaction actions
        actionPoints["transaction_send"] = 5 * 10**POINTS_DECIMALS;
        actionPoints["transaction_receive"] = 2 * 10**POINTS_DECIMALS;
        actionPoints["transaction_international"] = 10 * 10**POINTS_DECIMALS;
        actionPoints["transaction_large"] = 50 * 10**POINTS_DECIMALS;

        // Engagement actions
        actionPoints["engagement_daily_login"] = 5 * 10**POINTS_DECIMALS;
        actionPoints["engagement_profile_completion"] = 100 * 10**POINTS_DECIMALS;
        actionPoints["engagement_kyc_verification"] = 200 * 10**POINTS_DECIMALS;
        actionPoints["engagement_two_factor_setup"] = 50 * 10**POINTS_DECIMALS;
        actionPoints["engagement_card_activation"] = 75 * 10**POINTS_DECIMALS;
        actionPoints["engagement_first_investment"] = 300 * 10**POINTS_DECIMALS;

        // Special events
        actionPoints["special_birthday"] = 500 * 10**POINTS_DECIMALS;
        actionPoints["special_anniversary"] = 1000 * 10**POINTS_DECIMALS;
        actionPoints["special_holiday"] = 250 * 10**POINTS_DECIMALS;
        actionPoints["special_promotional"] = 1000 * 10**POINTS_DECIMALS;
    }

    /**
     * @dev Register a new user
     */
    function registerUser(address user, address referrer) external onlyOwner {
        require(!userPoints[user].isActive, "User already registered");
        
        userPoints[user] = UserPoints({
            totalPoints: 0,
            redeemedPoints: 0,
            tier: "bronze",
            lastActivity: block.timestamp,
            isActive: true
        });

        // Handle referral
        if (referrer != address(0) && userPoints[referrer].isActive && referrer != user) {
            referrals[user] = referrer;
            referredUsers[referrer].push(user);
            
            // Award referral points
            _awardPoints(referrer, actionPoints["referral_signup"], "referral_signup");
            emit ReferralPointsAwarded(referrer, user, actionPoints["referral_signup"], block.timestamp);
        }
    }

    /**
     * @dev Award points to a user for a specific action
     */
    function awardPoints(address user, string memory action) 
        external 
        onlyOwner 
        onlyActiveUser(user)
        validAction(action)
    {
        uint256 points = actionPoints[action];
        _awardPoints(user, points, action);
    }

    /**
     * @dev Award custom points to a user
     */
    function awardCustomPoints(address user, uint256 points, string memory action) 
        external 
        onlyOwner 
        onlyActiveUser(user)
    {
        require(points > 0, "Points must be greater than 0");
        _awardPoints(user, points, action);
    }

    /**
     * @dev Award staking points based on amount and duration
     */
    function awardStakingPoints(address user, uint256 amountUSD, string memory stakingType) 
        external 
        onlyOwner 
        onlyActiveUser(user)
    {
        require(amountUSD > 0, "Amount must be greater than 0");
        
        string memory action = string(abi.encodePacked("staking_", stakingType));
        uint256 basePoints = actionPoints[action];
        
        if (basePoints > 0) {
            // Calculate points based on amount (points per $100)
            uint256 points = (amountUSD * basePoints) / 100;
            
            // Add milestone bonuses
            if (amountUSD >= 10000) {
                points += 5000 * 10**POINTS_DECIMALS; // $10k milestone
            } else if (amountUSD >= 5000) {
                points += 2500 * 10**POINTS_DECIMALS; // $5k milestone
            } else if (amountUSD >= 1000) {
                points += 1000 * 10**POINTS_DECIMALS; // $1k milestone
            }
            
            _awardPoints(user, points, action);
        }
    }

    /**
     * @dev Award transaction points
     */
    function awardTransactionPoints(address user, uint256 amountUSD, bool isInternational, bool isLarge) 
        external 
        onlyOwner 
        onlyActiveUser(user)
    {
        require(amountUSD > 0, "Amount must be greater than 0");
        
        uint256 points = 0;
        
        // Base transaction points (per $10)
        uint256 basePoints = (amountUSD * actionPoints["transaction_send"]) / 10;
        points += basePoints;
        
        // Bonuses
        if (isInternational) {
            points += actionPoints["transaction_international"];
        }
        if (isLarge) {
            points += actionPoints["transaction_large"];
        }
        
        _awardPoints(user, points, "transaction_completed");
    }

    /**
     * @dev Internal function to award points
     */
    function _awardPoints(address user, uint256 points, string memory action) internal {
        require(points > 0, "Points must be greater than 0");
        
        UserPoints storage userData = userPoints[user];
        string memory oldTier = userData.tier;
        
        // Award points
        userData.totalPoints += points;
        userData.lastActivity = block.timestamp;
        
        // Record action
        uint256 actionId = _actionIdCounter.current();
        _actionIdCounter.increment();
        
        userActions[user][actionId] = PointsAction({
            action: action,
            points: points,
            timestamp: block.timestamp,
            isRedeemed: false
        });
        
        userActionCount[user]++;
        
        // Check for tier upgrade
        string memory newTier = _calculateTier(userData.totalPoints);
        if (keccak256(bytes(newTier)) != keccak256(bytes(oldTier))) {
            userData.tier = newTier;
            emit TierUpgraded(user, oldTier, newTier, block.timestamp);
        }
        
        emit PointsAwarded(user, points, action, block.timestamp);
    }

    /**
     * @dev Calculate user tier based on total points
     */
    function _calculateTier(uint256 totalPoints) internal view returns (string memory) {
        if (totalPoints >= tierConfigs["diamond"].minPoints) return "diamond";
        if (totalPoints >= tierConfigs["platinum"].minPoints) return "platinum";
        if (totalPoints >= tierConfigs["gold"].minPoints) return "gold";
        if (totalPoints >= tierConfigs["silver"].minPoints) return "silver";
        return "bronze";
    }

    /**
     * @dev Get user points information
     */
    function getUserPoints(address user) external view returns (UserPoints memory) {
        return userPoints[user];
    }

    /**
     * @dev Get user actions
     */
    function getUserActions(address user, uint256 startIndex, uint256 count) 
        external 
        view 
        returns (PointsAction[] memory)
    {
        uint256 totalActions = userActionCount[user];
        if (startIndex >= totalActions) {
            return new PointsAction[](0);
        }
        
        uint256 endIndex = startIndex + count;
        if (endIndex > totalActions) {
            endIndex = totalActions;
        }
        
        PointsAction[] memory actions = new PointsAction[](endIndex - startIndex);
        for (uint256 i = startIndex; i < endIndex; i++) {
            actions[i - startIndex] = userActions[user][i];
        }
        
        return actions;
    }

    /**
     * @dev Get tier configuration
     */
    function getTierConfig(string memory tierName) external view returns (TierConfig memory) {
        return tierConfigs[tierName];
    }

    /**
     * @dev Get action points value
     */
    function getActionPoints(string memory action) external view returns (uint256) {
        return actionPoints[action];
    }

    /**
     * @dev Get referral information
     */
    function getReferralInfo(address user) external view returns (address referrer, address[] memory referred) {
        return (referrals[user], referredUsers[user]);
    }

    /**
     * @dev Get user's tier multiplier
     */
    function getTierMultiplier(address user) external view returns (uint256) {
        string memory tier = userPoints[user].tier;
        return tierConfigs[tier].multiplier;
    }

    /**
     * @dev Calculate points needed for next tier
     */
    function getPointsToNextTier(address user) external view returns (uint256) {
        string memory currentTier = userPoints[user].tier;
        uint256 currentPoints = userPoints[user].totalPoints;
        
        if (keccak256(bytes(currentTier)) == keccak256(bytes("diamond"))) {
            return 0; // Already at highest tier
        }
        
        string[] memory tiers = new string[](5);
        tiers[0] = "bronze";
        tiers[1] = "silver";
        tiers[2] = "gold";
        tiers[3] = "platinum";
        tiers[4] = "diamond";
        
        for (uint256 i = 0; i < tiers.length - 1; i++) {
            if (keccak256(bytes(tiers[i])) == keccak256(bytes(currentTier))) {
                uint256 nextTierPoints = tierConfigs[tiers[i + 1]].minPoints;
                if (currentPoints >= nextTierPoints) {
                    return 0;
                }
                return nextTierPoints - currentPoints;
            }
        }
        
        return 0;
    }

    /**
     * @dev Update action points (admin only)
     */
    function updateActionPoints(string memory action, uint256 points) external onlyOwner {
        actionPoints[action] = points;
    }

    /**
     * @dev Update tier configuration (admin only)
     */
    function updateTierConfig(string memory tierName, uint256 minPoints, uint256 multiplier, bool isActive) 
        external 
        onlyOwner 
    {
        tierConfigs[tierName] = TierConfig(tierName, minPoints, multiplier, isActive);
    }

    /**
     * @dev Pause contract (emergency only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Get contract statistics
     */
    function getContractStats() external view returns (uint256 totalActions, uint256 activeUsers) {
        // This would require additional state tracking for accurate stats
        // For now, returning basic info
        return (_actionIdCounter.current(), 0);
    }
}
