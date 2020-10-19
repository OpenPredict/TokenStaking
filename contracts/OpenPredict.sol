pragma solidity ^0.6.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";

contract OpenPredict is ERC20, ERC20Burnable {

  constructor () public ERC20("Open Predict Token", "OPT") {
    _mint(msg.sender, 9900000 * (10 ** uint256(decimals())));
  }
}
