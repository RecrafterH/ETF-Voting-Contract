// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract ETFToken is ERC20, ERC20Burnable {
    address etfAddress;

    constructor(address _etfAddress) ERC20("ETFToken", "ETK") {
        _mint(msg.sender, 100000 * 10 ** 18);
        etfAddress = _etfAddress;
    }

    function transfer(
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        uint256 fromBalance = balanceOf(msg.sender);
        require(
            fromBalance >= amount,
            "ERC20: transfer amount exceeds balance"
        );
        address owner = _msgSender();

        uint burning = (amount * 2) / 100;
        uint etfAmount = (amount * 2) / 100;
        uint _amount = amount - burning - etfAmount;
        burn(burning);
        _transfer(owner, etfAddress, etfAmount);
        _transfer(owner, to, _amount);

        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        uint256 fromBalance = balanceOf(from);
        require(
            fromBalance >= amount,
            "ERC20: transfer amount exceeds balance"
        );
        address spender = _msgSender();
        uint burning = (amount * 2) / 100;
        uint etfAmount = (amount * 2) / 100;
        uint _amount = amount - burning - etfAmount;
        _spendAllowance(from, spender, amount);

        _transfer(from, etfAddress, etfAmount);
        _transfer(from, to, _amount);
        burn(burning);
        return true;
    }
}
