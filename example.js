const { MerkleTree } = require('merkletreejs');
var web3 = require('web3');
const keccak = require('keccak256');

let whitelistAddresses = [
    "0x1E8a9D0Bd8C19bB27CBb38A997b16B8373578E8a",
    "0xE1B7906410dF6d52598F8a500EC2F07d6D936b1D",
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0x6C96f978C5A3f76b871C7243297D5ff100A4cD9F",
    "0x28A994b7E36eaa9C4f5a38f87787969d8Bd1CFCB"
]

const leafNodes = whitelistAddresses.map(addr => keccak(addr, addr.toString()));
const merkleTree = new MerkleTree(leafNodes, keccak);

const rootHash = merkleTree.getRoot();

// const inclusionProof = merkleTree.getHexProof(leafNodes[0]);

console.log('Whitelist Merkle Tree\n', merkleTree.toString());

console.log('Merkle Root:', rootHash.toString('hex'));

// console.log(inclusionProof);

// console.log(leafNodes[2].toString('hex'))