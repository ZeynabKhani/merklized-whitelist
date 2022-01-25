// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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

        bool isWhiteListed = (MerkleTree.calcRootHashWithoutLength(_index, leaf, _merkleInclusionProof) == merkleRoot);

        require(isWhiteListed, "Caller is not whitelisted!");

        calledTheFunction[msg.sender] = true;

    }

    function addToWhitelist(bytes32[] calldata _merkleAppendProof, address _newWhitelistAdr, uint256 _length) public onlyAdmin {
         bytes32 leaf = keccak256(abi.encodePacked(_newWhitelistAdr)); 

         bytes32 newRoot = MerkleTree.append(_length, merkleRoot, leaf, _merkleAppendProof);

         merkleRoot = newRoot;

         emit NewAddressAdded(_newWhitelistAdr, leaf, newRoot);
    }
}

library MerkleTree {

    function calcRootHashWithoutLength(
        uint256 _idx,
        bytes32 _leafHash,
        bytes32[] memory _proof
    ) public pure returns (bytes32 _rootHash) {
        bytes32 _nodeHash = _leafHash;

        for (uint256 i = 0; i < _proof.length; i++) {
            uint256 _peerIdx = (_idx / 2) * 2;
            bytes32 _peerHash = _proof[i];
            bytes32 _parentHash = bytes32(0);
            if (_peerIdx > _idx) {
                _parentHash = keccak256(abi.encodePacked(_nodeHash, _peerHash));
            } else {
                _parentHash = keccak256(abi.encodePacked(_peerHash, _nodeHash));
            }

            _idx = _idx / 2;
            _nodeHash = _parentHash;
        }

        return _nodeHash;
    }

    function append(
        uint256 _len,
        bytes32 _oldRoot,
        bytes32 _leafHash,
        bytes32[] memory _proof
    ) public pure returns (bytes32 _newRoot) {
        if (_len > 0) {
            if ((_len & (_len - 1)) == 0) {
                // 2^n, a new layer will be added.
                require(_proof[0] == _oldRoot, "ERR_PROOF");
            } else {
                require(
                    _verify(_len, _len, _oldRoot, bytes32(0), _proof),
                    "ERR_PROOF"
                );
            }
        }

        return _calculateRoot(_len, _len + 1, _leafHash, _proof);
    }

    function _calculateRoot(
        uint256 _idx,
        uint256 _len,
        bytes32 _leafHash,
        bytes32[] memory _proof
    ) public pure returns (bytes32 _rootHash) {
        if (_len == 0) {
            return bytes32(0);
        }

        uint256 _proofIdx = 0;
        bytes32 _nodeHash = _leafHash;

        while (_len > 1) {
            uint256 _peerIdx = (_idx / 2) * 2;
            bytes32 _peerHash = bytes32(0);
            if (_peerIdx == _idx) {
                _peerIdx += 1;
            }
            if (_peerIdx < _len) {
                _peerHash = _proof[_proofIdx];
                _proofIdx += 1;
            }

            bytes32 _parentHash = bytes32(0);
            if (_peerIdx >= _len && _idx >= _len) {
                // pass, _parentHash = bytes32(0)
            } else if (_peerIdx > _idx) {
                _parentHash = keccak256(abi.encodePacked(_nodeHash, _peerHash));
            } else {
                _parentHash = keccak256(abi.encodePacked(_peerHash, _nodeHash));
            }

            _len = (_len - 1) / 2 + 1;
            _idx = _idx / 2;
            _nodeHash = _parentHash;
        }

        return _nodeHash;
    }

    function _verify(
        uint256 _idx,
        uint256 _len,
        bytes32 _root,
        bytes32 _oldLeafHash,
        bytes32[] memory _proof
    ) public pure returns (bool) {
        return _calculateRoot(_idx, _len, _oldLeafHash, _proof) == _root;
    }

}
