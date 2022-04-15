//SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BSCToken is ERC20 {

    constructor(string memory name, string memory symbol, uint256 initialSupply) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }

    function mint(address _to, uint256 _amount) public  {
        _mint(_to, _amount);
    }

    function burn(address _to, uint256 _amount) public  {
        _burn(_to, _amount);
    }
}