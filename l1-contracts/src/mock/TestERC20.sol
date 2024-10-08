// SPDX-License-Identifier: Apache-2.0
// docs:start:contract
pragma solidity ^0.8.0;

import "@oz/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20 {
  constructor() ERC20("Portal", "PORTAL") {}

  function mint(address to, uint256 amount) external {
    _mint(to, amount);
  }
}
// docs:end:contract
