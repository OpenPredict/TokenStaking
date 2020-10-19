// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/utils/Pausable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";

contract TokenStaking is Pausable {

  using SafeMath for uint256;

  struct StakingEpoch {
    uint amount;
    uint depositTime;
    bool claimed;
  }

  mapping (address => StakingEpoch[]) StakingPerAddress;
  address public owner;

  address OpenPredictToken;
  address RewardPool;

  uint APR = 26;
  uint numDaysPerYear = 365;
  // Daily Percentage Return per token: 26 (APR)/365 (number of days in a year) expressed in wei
  uint DPR = 712328767123287;     
  uint secsDaily;
  uint minimumDeposit = 50 * 1 ether;

  // start gatekeeping functions
  function _onlyOwner() private view {
    require(msg.sender == owner, "TokenStaking: msg.sender is not owner");
  }

  function _hasStakingEpoch() private view {
    require(StakingPerAddress[msg.sender].length > 0, "TokenStaking: No staking epochs for address");
  }

  function _minimumAmount(uint amount) private view {
    require(amount >= minimumDeposit, "TokenStaking: Amount staked must be greater than 50 OP");
  }

  constructor(address _OpenPredictToken, address _RewardPool, uint _secsDaily) public {
    OpenPredictToken = _OpenPredictToken;
    RewardPool = _RewardPool;
    secsDaily = _secsDaily;
    owner = msg.sender;
  }

  function deposit (uint amount) 
    whenNotPaused
    external {
    _minimumAmount(amount);

    // transfer from msg.sender to this contract. allowance must have been granted before.
    transferFrom(msg.sender, address(this), amount);

    // Create new StakingEpoch at this address
    StakingPerAddress[msg.sender].push(StakingEpoch(amount, block.timestamp, false));

  }
  function withdraw () 
  whenNotPaused
  external {
    _hasStakingEpoch();
    
    StakingEpoch[] storage stakingEpochs = StakingPerAddress[msg.sender];
    for(uint i=0; i<stakingEpochs.length; i++){
      StakingEpoch storage stakingEpoch = stakingEpochs[i];
      if(stakingEpoch.claimed == true)
        continue;
      // calculate number of days since depositTime
      uint numDays = (block.timestamp - stakingEpoch.depositTime) / secsDaily; // will auto round down
      // calculate stake reward
      uint reward = ((numDays * DPR * stakingEpoch.amount))/ 1 ether;
      // transfer reward from pool
      transferFrom(RewardPool, msg.sender, reward);
      // transfer amount from contract
      transfer(msg.sender, stakingEpoch.amount);
      // set epoch as claimed.
      stakingEpoch.claimed = true;
    }
  }

  function setRewardPool(address _RewardPool) 
  public {
    _onlyOwner();
    RewardPool = _RewardPool;
  }

  function setOpenPredictToken(address _OpenPredictToken) 
  public {
    _onlyOwner();
    OpenPredictToken = _OpenPredictToken;
  }

  function getRewardPool() 
  public view returns(address) {
    return RewardPool;
  }

  function getOpenPredictToken() 
  public view returns(address) {
    return OpenPredictToken;
  }

  function revoke() public {
    _onlyOwner();

    transfer(owner, balanceOf(address(this)));
  }
  
  function pause() whenNotPaused public {
    _onlyOwner();
    
    _pause();
  }
  
  function unpause() whenPaused public {
    _onlyOwner();
    
    _unpause();
  }


  function transferFrom(address _from, address _to, uint _tokensToTransfer) internal  {
      (bool success, bytes memory result) = OpenPredictToken.call(
          (abi.encodeWithSignature("transferFrom(address,address,uint256)", 
            _from, _to, _tokensToTransfer)
      ));
      require(success, "TokenStaking: call to OpenPredict token contract failed (transferFrom)");
  }

  function transfer(address _to, uint _tokensToTransfer) internal  {
      (bool success, bytes memory result) = OpenPredictToken.call(
          (abi.encodeWithSignature("transfer(address,uint256)", 
            _to, _tokensToTransfer)
      ));
      require(success, "TokenStaking: call to OpenPredict token contract failed (transfer)");
  }

  function balanceOf(address _address) internal returns(uint _balance)  {
      (bool success, bytes memory result) = OpenPredictToken.call(
          (abi.encodeWithSignature("balanceOf(address)", 
          _address)
      ));
      require(success, "TokenStaking: call to OpenPredict token contract failed (balanceOf)");
      assembly {
          _balance := mload(add(result, 0x20))
      }
  } 

  function getStakingPerAddress() public view returns(StakingEpoch[] memory){
    return StakingPerAddress[msg.sender];
  }
}
