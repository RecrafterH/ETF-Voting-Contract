// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);

    function balanceOf(address account) external view returns (uint256);

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);

    function increaseAllowance(
        address spender,
        uint256 addedValue
    ) external returns (bool);
}

interface ITokenMarketplace {
    function buy(
        address tokenAddress,
        uint256 amount
    ) external payable returns (bool);

    function sell(address tokenAddress, uint256 amount) external returns (bool);

    function getPrice(address tokenAddress) external view returns (uint);
}

interface IETFToken {
    function balanceOf(address account) external view returns (uint256);
}

error ETFContract__HoldingNotEnoughETFToken();
error ETFContract__ProposalHasEnded();
error ETFContract__ProposalIsStillOngoing();
error ETFContract__NotEnoughEthInContract();
error ETFContract__NotEnoughTokenToBuy();
error ETFContract__NotEnoughTokenToSell();
error ETFContract__MarketplaceDoesntHaveEnoughETH();
error ETFContract__YouAlreadyVoted();

contract ETFContract is VRFConsumerBaseV2, AutomationCompatibleInterface {
    ///////////////////////
    // Type declarations //
    ///////////////////////

    enum Vote {
        YAY,
        NAY
    }

    /////////////////////
    // State Variables //
    /////////////////////

    // ETF Variables

    IETFToken etfToken;
    ITokenMarketplace tokenMarketplace;

    address public etfTokenAddress;
    uint public proposalCount;
    uint public interval = 1 days;
    address public s_recentWinner;
    uint public currentDeadline;
    address public tokenMarketplaceAddresse;

    struct Proposal {
        address tokenAddress;
        uint amount;
        bool buying;
        uint deadline;
        uint yayVotes;
        uint nayVotes;
        bool executed;
    }

    mapping(uint => mapping(address => bool)) public voted;
    mapping(uint => Proposal) public proposals;
    address payable[] private voters;

    // Chainlink VRF Variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit = 100000;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    event WinnerPicked(address indexed winner);
    event RequestedWinner(uint requestId);
    event ProposalSend(address indexed tokenAddress, uint amount, bool buying);
    event voteSend(uint proposalIndex, Vote vote);

    //////////////
    // Modifier //
    //////////////

    modifier onlyTokenHolder() {
        if (etfToken.balanceOf(msg.sender) < 0.01 ether) {
            revert ETFContract__HoldingNotEnoughETFToken();
        }
        _;
    }

    modifier proposalOngoing() {
        if (proposals[proposalCount].deadline <= block.timestamp) {
            revert ETFContract__ProposalHasEnded();
        }

        _;
    }

    modifier proposalEnded() {
        if (proposals[proposalCount].deadline > block.timestamp) {
            revert ETFContract__ProposalIsStillOngoing();
        }
        _;
    }

    ///////////////
    // Functions //
    ///////////////

    constructor(
        address vrfCoordinatorV2,
        address _etfToken,
        address _tokenMarketplace,
        uint64 subscriptionId,
        bytes32 gasLane
    ) payable VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        etfToken = IETFToken(_etfToken);
        tokenMarketplace = ITokenMarketplace(_tokenMarketplace);
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        currentDeadline = block.timestamp + interval;
        tokenMarketplaceAddresse = _tokenMarketplace;
        etfTokenAddress = _etfToken;
    }

    /*
     * @notice Method for adding a proposal
     * @param tokenAddress Address of token contract
     * @param amount Amount of the token
     * @param buying Boolean if the contract should buy(true) or sell(false)
     */
    function addProposal(
        address tokenAddress,
        uint amount,
        bool buying
    ) external onlyTokenHolder {
        if (proposals[proposalCount].tokenAddress != address(0)) {
            revert ETFContract__ProposalIsStillOngoing();
        }
        IERC20 token = IERC20(tokenAddress);
        uint price = tokenMarketplace.getPrice(tokenAddress);
        uint cost = price * amount;
        if (buying == true) {
            uint tokenAmount = token.balanceOf(tokenMarketplaceAddresse);
            if (address(this).balance < cost) {
                revert ETFContract__NotEnoughEthInContract();
            }
            if (tokenAmount < amount) {
                revert ETFContract__NotEnoughTokenToBuy();
            }
        }
        if (buying == false) {
            uint balance = token.balanceOf(address(this));
            if (balance < amount) {
                revert ETFContract__NotEnoughTokenToSell();
            }
            uint marketplaceBalance = tokenMarketplaceAddresse.balance;
            if (marketplaceBalance < cost) {
                revert ETFContract__MarketplaceDoesntHaveEnoughETH();
            }
        }
        Proposal memory newProposal;
        newProposal.tokenAddress = tokenAddress;
        newProposal.amount = amount;
        newProposal.buying = buying;
        newProposal.deadline = currentDeadline;
        proposals[proposalCount] = newProposal;
        emit ProposalSend(tokenAddress, amount, buying);
    }

    /*
     * @notice Method for vote on the proposal
     * @param vote Vote for or against proposal
     */
    function voteOnProposal(
        Vote vote
    ) external onlyTokenHolder proposalOngoing {
        if (voted[proposalCount][msg.sender] == true) {
            revert ETFContract__YouAlreadyVoted();
        }
        if (vote == Vote.YAY) {
            proposals[proposalCount].yayVotes++;
            voted[proposalCount][msg.sender] = true;
        }
        if (vote == Vote.NAY) {
            proposals[proposalCount].nayVotes++;
            voted[proposalCount][msg.sender] = true;
        }

        voters.push(payable(msg.sender));
        emit voteSend(proposalCount, vote);
    }

    /*
     * @notice Method checking the requirements of the upkeep
     */
    function checkUpkeep(
        bytes memory /* checkData */
    ) public view returns (bool upkeepNeeded, bytes memory /*performData*/) {
        bool execute = proposals[proposalCount].executed == false;
        bool deadline = proposals[proposalCount].deadline <= block.timestamp;
        upkeepNeeded = (execute && deadline);
        return (upkeepNeeded, "0x0");
    }

    /*
     * @notice Method for executing the proposal
     */
    function performUpkeep(bytes calldata /*performData*/) external {
        (bool upkeepNeeded, ) = checkUpkeep("");
        require(upkeepNeeded, "Requirements are not fulfilled!");
        proposals[proposalCount].executed = true;
        Proposal memory proposal = proposals[proposalCount];
        proposalCount++;
        currentDeadline = block.timestamp + interval;
        if (proposal.yayVotes > proposal.nayVotes) {
            if (proposal.buying == true) {
                IERC20 token = IERC20(proposal.tokenAddress);
                uint marketplaceBalance = token.balanceOf(
                    tokenMarketplaceAddresse
                );
                if (marketplaceBalance >= proposal.amount) {
                    uint price = tokenMarketplace.getPrice(
                        proposal.tokenAddress
                    );
                    uint cost = proposal.amount * price;
                    if (address(this).balance >= cost) {
                        bool success = tokenMarketplace.buy{value: cost}(
                            proposal.tokenAddress,
                            proposal.amount
                        );

                        require(success, "The buy did not work");
                    }
                }
            } else {
                uint price = tokenMarketplace.getPrice(proposal.tokenAddress);
                uint cost = proposal.amount * price;
                uint marketplaceBalance = tokenMarketplaceAddresse.balance;
                if (marketplaceBalance >= cost) {
                    IERC20 token = IERC20(proposal.tokenAddress);
                    uint tokenAmount = proposal.amount;
                    token.increaseAllowance(
                        tokenMarketplaceAddresse,
                        tokenAmount
                    );
                    bool success = tokenMarketplace.sell(
                        proposal.tokenAddress,
                        proposal.amount
                    );
                    require(success, "The sell did not work!");
                }
            }

            proposal.executed = true;
        }
        uint requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        uint priceETF = tokenMarketplace.getPrice(etfTokenAddress);

        uint ethAmount = (address(this).balance * 1) / 100;
        uint etfAmount = ethAmount / priceETF;
        bool s = tokenMarketplace.buy{value: ethAmount}(
            etfTokenAddress,
            etfAmount
        );
        require(s, "You couldn't buy ETFToken back!");

        emit RequestedWinner(requestId);
    }

    /*
     * @notice Method for getting the winner and sending the prize
     * @param randomWords Random number to get the random winner
     */
    function fulfillRandomWords(
        uint256 /* requestId */,
        uint256[] memory randomWords
    ) internal override {
        uint256 indexOfWinner = randomWords[0] % voters.length;
        address recentWinner = voters[indexOfWinner];
        s_recentWinner = recentWinner;
        voters = new address payable[](0);
        uint price = (address(this).balance * 1) / 100;
        (bool success, ) = recentWinner.call{value: price}("");
        require(success, "Transaction failed!");
        emit WinnerPicked(recentWinner);
    }

    //////////////////////
    // Getter Functions //
    //////////////////////

    function getCurrentProposal() public view returns (Proposal memory) {
        Proposal memory currentProposal = proposals[proposalCount];
        return currentProposal;
    }

    function getOldProposal(
        uint proposalIndex
    ) public view returns (Proposal memory) {
        Proposal memory oldProposal = proposals[proposalIndex];
        return oldProposal;
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getProposalNum() public view returns (uint) {
        return proposalCount;
    }

    function getRemainingTime() public view returns (uint) {
        if (currentDeadline <= block.timestamp) {
            return 0;
        }
        uint time = currentDeadline - block.timestamp;
        return time;
    }

    receive() external payable {}

    fallback() external payable {}
}
