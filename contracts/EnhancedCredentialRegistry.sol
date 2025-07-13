// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./SemaphoreVerifier.sol";
import "./ENSVerifier.sol";

contract EnhancedCredentialRegistry is Ownable {
    SemaphoreVerifier public semaphoreVerifier;
    ENSVerifier public ensVerifier;
    
    struct CredentialProof {
        string credentialId;
        address issuer;
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
        uint256[4] input;
        uint256 merkleTreeDepth;
        uint256 timestamp;
    }
    
    struct VerificationResult {
        bool isValid;
        string credentialType;
        string issuerName;
        uint256 verifiedAt;
        string errorMessage;
    }
    
    mapping(bytes32 => bool) public usedNullifiers;
    mapping(address => bool) public authorizedVerifiers;
    mapping(string => address) public credentialIssuers;
    
    event CredentialVerified(
        string indexed credentialId,
        address indexed issuer,
        bool isValid,
        uint256 timestamp
    );
    
    event VerifierAuthorized(address indexed verifier, bool authorized);
    event IssuerRegistered(string indexed credentialType, address indexed issuer);
    
    constructor(address _semaphoreVerifier, address _ensVerifier) {
        semaphoreVerifier = SemaphoreVerifier(_semaphoreVerifier);
        ensVerifier = ENSVerifier(_ensVerifier);
    }
    
    modifier onlyAuthorizedVerifier() {
        require(authorizedVerifiers[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    function verifyCredentialZKP(
        CredentialProof calldata proof
    ) external onlyAuthorizedVerifier returns (VerificationResult memory) {
        // Check if nullifier has been used
        bytes32 nullifier = keccak256(abi.encodePacked(proof.input[1]));
        require(!usedNullifiers[nullifier], "Proof already used");
        
        // Verify ZKP using Semaphore
        bool zkpValid = semaphoreVerifier.verifyProof(
            proof.a,
            proof.b,
            proof.c,
            proof.input,
            proof.merkleTreeDepth
        );
        
        if (!zkpValid) {
            return VerificationResult({
                isValid: false,
                credentialType: "",
                issuerName: "",
                verifiedAt: block.timestamp,
                errorMessage: "ZKP verification failed"
            });
        }
        
        // Verify issuer trust through ENS
        (bool issuerTrusted, address verifiedIssuer) = ensVerifier.verifyIssuerENS(
            string(abi.encodePacked("did:ens:", Strings.toHexString(proof.issuer)))
        );
        
        if (!issuerTrusted || verifiedIssuer != proof.issuer) {
            return VerificationResult({
                isValid: false,
                credentialType: "",
                issuerName: "",
                verifiedAt: block.timestamp,
                errorMessage: "Issuer not trusted"
            });
        }
        
        // Mark nullifier as used
        usedNullifiers[nullifier] = true;
        
        // Get issuer name
        string memory issuerName = ensVerifier.getIssuerName(proof.issuer);
        
        emit CredentialVerified(
            proof.credentialId,
            proof.issuer,
            true,
            block.timestamp
        );
        
        return VerificationResult({
            isValid: true,
            credentialType: proof.credentialId,
            issuerName: issuerName,
            verifiedAt: block.timestamp,
            errorMessage: ""
        });
    }
    
    function verifyCredentialBatch(
        CredentialProof[] calldata proofs
    ) external onlyAuthorizedVerifier returns (VerificationResult[] memory) {
        VerificationResult[] memory results = new VerificationResult[](proofs.length);
        
        for (uint256 i = 0; i < proofs.length; i++) {
            results[i] = this.verifyCredentialZKP(proofs[i]);
        }
        
        return results;
    }
    
    function authorizeVerifier(address verifier, bool authorized) external onlyOwner {
        authorizedVerifiers[verifier] = authorized;
        emit VerifierAuthorized(verifier, authorized);
    }
    
    function registerCredentialIssuer(string memory credentialType, address issuer) external onlyOwner {
        credentialIssuers[credentialType] = issuer;
        emit IssuerRegistered(credentialType, issuer);
    }
    
    function isNullifierUsed(bytes32 nullifier) external view returns (bool) {
        return usedNullifiers[nullifier];
    }
    
    function getCredentialIssuer(string memory credentialType) external view returns (address) {
        return credentialIssuers[credentialType];
    }
    
    function isAuthorizedVerifier(address verifier) external view returns (bool) {
        return authorizedVerifiers[verifier] || verifier == owner();
    }
} 