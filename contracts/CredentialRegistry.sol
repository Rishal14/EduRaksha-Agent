// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CredentialRegistry {
    struct Credential {
        address student;
        bytes32 credentialHash; // Hash of the VC or ZKP
        string zkpReference;    // IPFS hash or off-chain ZKP reference
        uint256 issuedAt;
        address issuer;
    }

    // Mapping from credential ID to Credential
    mapping(bytes32 => Credential) public credentials;

    // Event emitted when a credential is registered
    event CredentialRegistered(bytes32 indexed credentialId, address indexed student, address indexed issuer);

    // Register a new credential
    function registerCredential(bytes32 credentialId, address student, bytes32 credentialHash, string calldata zkpReference) external {
        require(credentials[credentialId].issuedAt == 0, "Credential already exists");
        credentials[credentialId] = Credential({
            student: student,
            credentialHash: credentialHash,
            zkpReference: zkpReference,
            issuedAt: block.timestamp,
            issuer: msg.sender
        });
        emit CredentialRegistered(credentialId, student, msg.sender);
    }

    // Get credential details
    function getCredential(bytes32 credentialId) external view returns (Credential memory) {
        return credentials[credentialId];
    }

    address public semaphoreVerifier;

    event ProofVerified(bytes32 indexed credentialId, bool valid);

    function setSemaphoreVerifier(address _verifier) external {
        // In production, restrict this to owner/issuer
        semaphoreVerifier = _verifier;
    }

    function verifyZKP(
        bytes32 credentialId,
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[4] calldata input,
        uint256 merkleTreeDepth
    ) external returns (bool) {
        require(semaphoreVerifier != address(0), "Verifier not set");
        (bool success, bytes memory data) = semaphoreVerifier.call(
            abi.encodeWithSignature(
                "verifyProof(uint256[2],uint256[2][2],uint256[2],uint256[4],uint256)",
                a, b, c, input, merkleTreeDepth
            )
        );
        bool valid = success && abi.decode(data, (bool));
        emit ProofVerified(credentialId, valid);
        return valid;
    }
} 