// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;

import './UniswapV3Pool.sol';

contract CalHash {
    function getInitHash() public pure returns(bytes32){
        bytes memory bytecode = type(UniswapV3Pool).creationCode;
        return keccak256(abi.encodePacked(bytecode));
    }
}