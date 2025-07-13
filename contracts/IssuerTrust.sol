// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IENS {
    function resolver(bytes32 node) external view returns (address);
}

contract IssuerTrust {
    address public owner;
    mapping(address => bool) public trustedIssuers;
    IENS public ens;

    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);
    event ENSSet(address indexed ensAddress);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address ensAddress) {
        owner = msg.sender;
        ens = IENS(ensAddress);
    }

    function addIssuer(address issuer) external onlyOwner {
        trustedIssuers[issuer] = true;
        emit IssuerAdded(issuer);
    }

    function removeIssuer(address issuer) external onlyOwner {
        trustedIssuers[issuer] = false;
        emit IssuerRemoved(issuer);
    }

    function isTrusted(address issuer) external view returns (bool) {
        return trustedIssuers[issuer];
    }

    function setENS(address ensAddress) external onlyOwner {
        ens = IENS(ensAddress);
        emit ENSSet(ensAddress);
    }

    // Example ENS-based check (pseudo, for demo)
    function isENSVerified(bytes32 node, address expected) external view returns (bool) {
        return ens.resolver(node) == expected;
    }
} 