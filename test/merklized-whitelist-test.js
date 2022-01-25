const web3 = require("web3");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const emptyNode = "0x0000000000000000000000000000000000000000000000000000000000000000";

function calculateHash(input) {
  return input.map((addr) => web3.utils.soliditySha3(addr));
}

function calculateRootHash(nodes) {
  hashes = calculateHash(nodes)

  if (hashes.length == 0) {
    return emptyNode;
  }

  while (hashes.length > 1) {
    let treeNodes = [];
    for (let i = 0; i < hashes.length; i += 2) {
      treeNodes.push(
        web3.utils.soliditySha3(
          { t: "bytes32", v: hashes[i] },
          {
            t: "bytes32",
            v:
              i + 1 < hashes.length
                ? hashes[i + 1]
                : emptyNode,
          }
        )
      );
    }

    hashes = treeNodes;
  }

  return hashes[0]; // the root
}

function getInclusionProof(nodes, index) {
  var result =[], currentLayer =[...nodes], currentN = index  

    while(currentLayer.length > 1){    
        // no odd length layers
        if(currentLayer.length % 2)   
            currentLayer.push(emptyNode)

        result.push(currentN %2 
               // sibling is on the left side
            ? currentLayer[currentN-1]
               // sibling is on the right side
            : currentLayer[currentN+1])
        // move to the next layer up
        currentN = Math.floor(currentN/2) 
        currentLayer = oneLevelUp(currentLayer) 
    } 

    return result  
}

function oneLevelUp( inputArray ) {     
  var result = [ ] 
  var input =[...inputArray] 

  if(input.length%2 === 1) input.push(emptyNode)     

  for(var i =0; i < input.length; i +=2)   
    result.push(web3.utils.soliditySha3(input[i], input[i + 1]))

  return result
}

function getAppendProof(nodes) {
  let index = nodes.length

  hashes = calculateHash(nodes);
  
  hashes.push(
    emptyNode
  );
  
  return getInclusionProof(hashes, index);
}

describe("MerklizedWhitelist", async () => {
  let whitelistAddresses;
  let admin, client, newClient;
  let merklizedWhitelist;
  let clientAddress;


  before("deploy the contract", async () => {
    [admin, client, newClient] = await ethers.getSigners();

    clientAddress = await client.getAddress();

    whitelistAddresses = [
      "0x1E8a9D0Bd8C19bB27CBb38A997b16B8373578E8a",
      "0xE1B7906410dF6d52598F8a500EC2F07d6D936b1D",
      "0x6C96f978C5A3f76b871C7243297D5ff100A4cD9F",
      clientAddress,
      "0x28A994b7E36eaa9C4f5a38f87787969d8Bd1CFCB",
    ];
    
    rootHash = await calculateRootHash(whitelistAddresses);

    // console.log(rootHash);

    const MerklizedWhitelist = await ethers.getContractFactory("MerklizedWhitelist", admin);

    merklizedWhitelist = await MerklizedWhitelist.deploy(rootHash)
    await merklizedWhitelist.deployed();

  });

  it("should execute the target function successfully", async () => {

    const merklizedWhitelistAsClient = merklizedWhitelist.connect(client)


    const proof = getInclusionProof(
      calculateHash(whitelistAddresses), 
      whitelistAddresses.indexOf(client.address)
    )

    await merklizedWhitelistAsClient.target(
      proof, 
      whitelistAddresses.indexOf(client.address)
    )

    expect(await merklizedWhitelist.calledTheFunction(clientAddress)).to.to.true;

  });

  it("should update the merkle root by appending a new address to the tree", async () => {
    const merklizedWhitelistAsAdmin = merklizedWhitelist.connect(admin);

    const proof = getAppendProof(whitelistAddresses);

    // console.log(rootHash)
    // console.log(proof)

    await expect(
      merklizedWhitelistAsAdmin.addToWhitelist(
        proof, newClient.address, whitelistAddresses.length
      )
    ).to.emit(merklizedWhitelistAsAdmin, "NewAddressAdded");

    whitelistAddresses.push(newClient.address);

    let root = calculateRootHash(whitelistAddresses);

    expect(await merklizedWhitelistAsAdmin.merkleRoot()).to.be.equal(root)
  });

  it("reverts because only admin can update the whitelist", async () => {
    const merklizedWhitelistAsClient = merklizedWhitelist.connect(client);

    const proof = getAppendProof(whitelistAddresses);

    await expect(merklizedWhitelistAsClient.addToWhitelist(
      proof, newClient.address, whitelistAddresses.length)
    ).to.be.revertedWith("Caller is not the admin");
  })
});