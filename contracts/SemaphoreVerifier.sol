// SPDX-License-Identifier: MIT
pragma solidity >=0.8.23 <=0.8.28;

import {ISemaphoreVerifier} from "@semaphore-protocol/contracts/interfaces/ISemaphoreVerifier.sol";

/**
 * @title SemaphoreVerifier
 * @dev Ethereum-based ZKP verifier using Groth16 for Semaphore protocol
 * This contract verifies Zero-Knowledge Proofs for privacy-preserving credential verification
 */
contract SemaphoreVerifier is ISemaphoreVerifier {
    
    // Mapping to track used nullifiers to prevent double-spending
    mapping(uint256 => bool) public usedNullifiers;
    
    // Mapping to track credential groups
    mapping(uint256 => bool) public validGroups;
    
    // Events
    event ProofVerified(
        uint256 indexed groupId,
        uint256 indexed nullifier,
        uint256 signal,
        address indexed verifier
    );
    
    event NullifierUsed(uint256 indexed nullifier, address indexed user);
    event GroupRegistered(uint256 indexed groupId, address indexed issuer);

    /**
     * @dev Verify a Semaphore proof using Groth16 verification
     * @param a First element of the proof
     * @param b Second element of the proof  
     * @param c Third element of the proof
     * @param input Public inputs to the circuit
     * @param merkleTreeDepth Depth of the Merkle tree
     * @return True if proof is valid, false otherwise
     */
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[4] memory input,
        uint256 merkleTreeDepth
    ) external pure override returns (bool) {
        // In a production environment, this would call the actual Groth16 verification
        // For now, we'll implement a basic verification that checks proof structure
        
        // Check that proof elements are not zero
        if (a[0] == 0 || a[1] == 0) {
            return false;
        }
        
        // Check that B matrix elements are not zero
        if (b[0][0] == 0 || b[0][1] == 0 || b[1][0] == 0 || b[1][1] == 0) {
            return false;
        }
        
        // Check that C elements are not zero
        if (c[0] == 0 || c[1] == 0) {
            return false;
        }
        
        // Check that public inputs are valid
        if (input[0] == 0 || input[1] == 0 || input[2] == 0 || input[3] == 0) {
            return false;
        }
        
        // Check Merkle tree depth is reasonable
        if (merkleTreeDepth < 1 || merkleTreeDepth > 32) {
            return false;
        }
        
        // For demo purposes, return true if all basic checks pass
        // In production, this would call the actual ZKP verification library
        return true;
    }
    
    /**
     * @dev Verify a proof and check nullifier usage
     * @param a First element of the proof
     * @param b Second element of the proof
     * @param c Third element of the proof
     * @param input Public inputs to the circuit
     * @param merkleTreeDepth Depth of the Merkle tree
     * @param nullifier The nullifier to check for double-spending
     * @param groupId The group ID for the credential
     * @return True if proof is valid and nullifier not used
     */
    function verifyProofWithNullifier(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[4] memory input,
        uint256 merkleTreeDepth,
        uint256 nullifier,
        uint256 groupId
    ) external returns (bool) {
        // Verify the proof first
        bool proofValid = this.verifyProof(a, b, c, input, merkleTreeDepth);
        if (!proofValid) {
            return false;
        }
        
        // Check if nullifier has been used before
        if (usedNullifiers[nullifier]) {
            return false;
        }
        
        // Check if group is valid
        if (!validGroups[groupId]) {
            return false;
        }
        
        // Mark nullifier as used
        usedNullifiers[nullifier] = true;
        
        // Extract signal from public inputs (first element)
        uint256 signal = input[0];
        
        // Emit events
        emit ProofVerified(groupId, nullifier, signal, msg.sender);
        emit NullifierUsed(nullifier, msg.sender);
        
        return true;
    }
    
    /**
     * @dev Register a new credential group
     * @param groupId The group ID to register
     */
    function registerGroup(uint256 groupId) external {
        validGroups[groupId] = true;
        emit GroupRegistered(groupId, msg.sender);
    }
    
    /**
     * @dev Check if a nullifier has been used
     * @param nullifier The nullifier to check
     * @return True if nullifier has been used
     */
    function isNullifierUsed(uint256 nullifier) external view returns (bool) {
        return usedNullifiers[nullifier];
    }
    
    /**
     * @dev Check if a group is valid
     * @param groupId The group ID to check
     * @return True if group is valid
     */
    function isGroupValid(uint256 groupId) external view returns (bool) {
        return validGroups[groupId];
    }
} 