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

    function getMyTokenBalance(
        address tokenAddress
    ) external view returns (uint);
}

interface IETFToken {
    function balanceOf(address account) external view returns (uint256);
}

contract ETFContract is VRFConsumerBaseV2, AutomationCompatibleInterface {
    IETFToken etfToken;
    ITokenMarketplace tokenMarketplace;

    uint public proposalCount;
    uint public interval;
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

    // Chainlink VRF Variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit = 100000;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    event WinnerPicked(address indexed winner);
    event RequestedRaffleWinner(uint requestId);

    constructor(
        address vrfCoordinatorV2,
        address _etfToken,
        address _tokenMarketplace,
        uint _interval,
        uint64 subscriptionId,
        bytes32 gasLane
    ) payable VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        etfToken = IETFToken(_etfToken);
        tokenMarketplace = ITokenMarketplace(_tokenMarketplace);
        interval = _interval;
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        currentDeadline = block.timestamp + interval;
        tokenMarketplaceAddresse = _tokenMarketplace;
    }

    enum Vote {
        YAY,
        NAY
    }

    mapping(uint => mapping(address => bool)) public voted;
    mapping(uint => Proposal) public proposals;
    address payable[] private voters;

    function addProposal(
        address tokenAddress,
        uint amount,
        bool buying
    ) external onlyTokenHolder {
        require(
            proposals[proposalCount].tokenAddress == address(0),
            "There is already an ongoing proposal!"
        );
        IETFToken token = IETFToken(tokenAddress);
        if (buying == true) {
            uint price = tokenMarketplace.getPrice(tokenAddress);
            uint cost = price * amount;
            require(
                address(this).balance >= cost,
                "There is not enough money to buy these token"
            );
        }
        if (buying == false) {
            uint balance = token.balanceOf(address(this));
            require(balance >= amount, "There are not enough token to sell!");
        }
        Proposal memory newProposal;
        newProposal.tokenAddress = tokenAddress;
        newProposal.amount = amount;
        newProposal.buying = buying;
        newProposal.deadline = currentDeadline;
        proposals[proposalCount] = newProposal;
    }

    function voteOnProposal(
        Vote vote
    ) external onlyTokenHolder proposalOngoing {
        require(voted[proposalCount][msg.sender] == false, "You already voted");
        if (vote == Vote.YAY) {
            proposals[proposalCount].yayVotes++;
            voted[proposalCount][msg.sender] = true;
        }
        if (vote == Vote.NAY) {
            proposals[proposalCount].nayVotes++;
            voted[proposalCount][msg.sender] = true;
        }

        voters.push(payable(msg.sender));
    }

    function checkUpkeep(
        bytes memory /* checkData */
    ) public view returns (bool upkeepNeeded, bytes memory /*performData*/) {
        bool execute = proposals[proposalCount].executed == false;
        bool deadline = proposals[proposalCount].deadline <= block.timestamp;
        upkeepNeeded = (execute && deadline);
        return (upkeepNeeded, "0x0");
    }

    function performUpkeep(bytes calldata /*performData*/) external {
        (bool upkeepNeeded, ) = checkUpkeep("");
        require(upkeepNeeded, "Requirements are not fulfilled");
        if (
            proposals[proposalCount].yayVotes >
            proposals[proposalCount].nayVotes
        ) {
            if (proposals[proposalCount].buying == true) {
                uint price = tokenMarketplace.getPrice(
                    proposals[proposalCount].tokenAddress
                );
                uint cost = proposals[proposalCount].amount * price;
                if (address(this).balance >= cost) {
                    bool success = tokenMarketplace.buy{value: cost}(
                        proposals[proposalCount].tokenAddress,
                        proposals[proposalCount].amount
                    );

                    require(success, "The buy doesnt work");
                }
            } else {
                IERC20 token = IERC20(proposals[proposalCount].tokenAddress);
                uint tokenAmount = proposals[proposalCount].amount;
                token.increaseAllowance(tokenMarketplaceAddresse, tokenAmount);
                bool success = tokenMarketplace.sell(
                    proposals[proposalCount].tokenAddress,
                    proposals[proposalCount].amount
                );
                require(success, "The sell doesnt work");
            }

            proposals[proposalCount].executed = true;
        }
        uint requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        proposals[proposalCount].executed = true;
        proposalCount++;
        currentDeadline = block.timestamp + interval;
        emit RequestedRaffleWinner(requestId);
    }

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
        require(success, "Transaction failed");
        emit WinnerPicked(recentWinner);
    }

    modifier onlyTokenHolder() {
        require(
            etfToken.balanceOf(msg.sender) >= 100,
            "You need to hold at least 100 token"
        );
        _;
    }

    modifier proposalOngoing() {
        require(
            proposals[proposalCount].deadline >= block.timestamp,
            "The deadline already passed"
        );
        _;
    }

    modifier proposalEnded() {
        require(
            proposals[proposalCount].deadline < block.timestamp,
            "The deadline already passed"
        );
        _;
    }

    function getProposal(
        uint proposalIndex
    ) public view returns (Proposal memory) {
        Proposal memory currentProposal = proposals[proposalIndex];
        return currentProposal;
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    receive() external payable {}
}