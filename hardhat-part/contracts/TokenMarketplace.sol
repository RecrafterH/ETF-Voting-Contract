// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);

    function balanceOf(address account) external view returns (uint256);

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
}

contract TokenMarketplace {
    address public owner;

    constructor() payable {
        owner = msg.sender;
    }

    mapping(address => uint) public price;

    function buy(
        address tokenAddress,
        uint amount
    ) external payable returns (bool) {
        IERC20 token = IERC20(tokenAddress);
        require(isAvailable(tokenAddress), "No token available");
        require(
            token.balanceOf(address(this)) >= amount,
            "Not enough token available"
        );
        uint costs = price[tokenAddress] * amount;
        require(costs == msg.value, "Not enough eth to pay");
        bool success = token.transfer(msg.sender, amount);
        require(success, "The transaction failed");
        return true;
    }

    function sell(
        address tokenAddress,
        uint amount
    ) external payable returns (bool) {
        IERC20 token = IERC20(tokenAddress);
        uint costs = price[tokenAddress] * amount;
        require(address(this).balance >= costs);
        bool success = token.transferFrom(msg.sender, address(this), amount);
        require(success, "Sadly the transaction failed");
        (bool s, ) = msg.sender.call{value: costs}("");
        require(s, "No money for you");
        return true;
    }

    function setPrice(address tokenAddress, uint value) public onlyOwner {
        require(price[tokenAddress] == 0, "There is already a price");
        price[tokenAddress] = value;
    }

    function changePrice(address tokenAddress, uint newPrice) public onlyOwner {
        require(price[tokenAddress] != 0, "Please add a price first");
        price[tokenAddress] = newPrice;
    }

    function isAvailable(address tokenAddress) public view returns (bool) {
        IERC20 token = IERC20(tokenAddress);
        uint balance = token.balanceOf(address(this));
        if (balance == 0) {
            return false;
        }
        return true;
    }

    function getPrice(address tokenAddress) public view returns (uint) {
        uint number = price[tokenAddress];
        return number;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "You are not the owner");
        _;
    }
}
