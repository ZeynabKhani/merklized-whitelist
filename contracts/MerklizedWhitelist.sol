// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract MerklizedWhitelist {
    address public admin;
    bytes32 public merkleRoot;
    mapping(address => bool) public calledTheFunction;

    event NewAddressAdded(address newAddress, bytes32 newAddressHash, bytes32 newRoot);

    modifier onlyAdmin {
        require(msg.sender == admin, "Caller is not the admin");
        _;
    }

    constructor(bytes32 _merkleRoot) {
        admin = msg.sender;
        merkleRoot = _merkleRoot;
    }

    function target(bytes32[] calldata _merkleInclusionProof, uint256 _index) external {

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));

        bool isWhiteListed = (MerkleTree.verify(_index, leaf, _merkleInclusionProof) == merkleRoot);

        require(isWhiteListed, "Caller is not whitelisted!");

        calledTheFunction[msg.sender] = true;

    }

    function addToWhitelist(bytes32[] calldata _merkleAppendProof, address _newWhitelistAdr, uint256 _length) public onlyAdmin {
         bytes32 leaf = keccak256(abi.encodePacked(_newWhitelistAdr)); 

         bytes32 newRoot = MerkleTree.verify(_length, leaf, _merkleAppendProof);

         merkleRoot = newRoot;

         emit NewAddressAdded(_newWhitelistAdr, leaf, newRoot);
    }
}


library MerkleTree {

    /**
     * @dev this function is used both for inclusion proof check and insersion proof check
     * Note that elements do not need to be sorted
     * Note When there is an odd number of nodes in a level of a tree, an empty byte must be used in calculating the proof
     * emotyHash = 0x0000000000000000000000000000000000000000000000000000000000000000
     */
    function verify(uint256 _index, bytes32 _leaf, bytes32[] memory _inclusionProof) internal pure returns (bytes32) {
        bytes32 currentHash = _leaf;

        uint256 rightOrLeft = _index;

        for (uint256 i = 0; i < _inclusionProof.length; i++) {
            bytes32 proofElementHash = _inclusionProof[i];

            // order of the elements in a hash is important
            if (rightOrLeft % 2 == 0) {
                currentHash = keccak256(abi.encodePacked(currentHash, proofElementHash));
            } else {
                currentHash = keccak256(abi.encodePacked(proofElementHash, currentHash));
            }

            rightOrLeft = rightOrLeft/2;
        }

        return currentHash;
    }
}
