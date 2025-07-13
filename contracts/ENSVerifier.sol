// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface ENS {
    function resolver(bytes32 node) external view returns (address);
}

interface Resolver {
    function addr(bytes32 node) external view returns (address);
    function text(bytes32 node, string calldata key) external view returns (string memory);
}

contract ENSVerifier is Ownable {
    ENS public ens;
    
    mapping(address => bool) public trustedIssuers;
    mapping(string => address) public issuerENS;
    mapping(address => string) public issuerName;
    
    event IssuerRegistered(address indexed issuer, string name, string ensDomain);
    event IssuerTrusted(address indexed issuer, bool trusted);
    
    constructor(address _ens) {
        ens = ENS(_ens);
    }
    
    function registerIssuer(address issuer, string memory name, string memory ensDomain) external onlyOwner {
        trustedIssuers[issuer] = true;
        issuerENS[name] = issuer;
        issuerName[issuer] = name;
        
        emit IssuerRegistered(issuer, name, ensDomain);
    }
    
    function setIssuerTrust(address issuer, bool trusted) external onlyOwner {
        trustedIssuers[issuer] = trusted;
        emit IssuerTrusted(issuer, trusted);
    }
    
    function verifyIssuerENS(string memory ensDomain) public view returns (bool, address) {
        bytes32 node = keccak256(abi.encodePacked(ensDomain));
        address resolver = ens.resolver(node);
        
        if (resolver == address(0)) {
            return (false, address(0));
        }
        
        Resolver res = Resolver(resolver);
        address issuerAddress = res.addr(node);
        
        if (issuerAddress == address(0)) {
            return (false, address(0));
        }
        
        return (trustedIssuers[issuerAddress], issuerAddress);
    }
    
    function isTrustedIssuer(address issuer) public view returns (bool) {
        return trustedIssuers[issuer];
    }
    
    function getIssuerName(address issuer) public view returns (string memory) {
        return issuerName[issuer];
    }
    
    function getIssuerAddress(string memory name) public view returns (address) {
        return issuerENS[name];
    }
} 