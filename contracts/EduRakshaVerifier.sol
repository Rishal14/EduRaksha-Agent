// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./SemaphoreVerifier.sol";
import "./ENSVerifier.sol";

contract EduRakshaVerifier is Ownable {
    SemaphoreVerifier public semaphoreVerifier;
    ENSVerifier public ensVerifier;
    
    // Trusted issuers mapping
    mapping(address => bool) public trustedIssuers;
    mapping(string => address) public issuerDomains;
    
    // Verification records
    struct VerificationRecord {
        string claimType;
        address student;
        address issuer;
        bool isValid;
        uint256 timestamp;
        string proofHash;
    }
    
    // Nullifier tracking to prevent double-spending
    mapping(bytes32 => bool) public usedNullifiers;
    
    // Events
    event IssuerRegistered(address indexed issuer, string domain, bool trusted);
    event CredentialVerified(
        string indexed claimType,
        address indexed student,
        address indexed issuer,
        bool isValid,
        uint256 timestamp
    );
    event NullifierUsed(bytes32 indexed nullifier, address indexed student);
    
    constructor(address _semaphoreVerifier, address _ensVerifier) {
        semaphoreVerifier = SemaphoreVerifier(_semaphoreVerifier);
        ensVerifier = ENSVerifier(_ensVerifier);
    }
    
    modifier onlyTrustedIssuer() {
        require(trustedIssuers[msg.sender], "Not a trusted issuer");
        _;
    }
    
    /**
     * @dev Register a trusted issuer with their ENS domain
     * @param issuer Address of the issuer
     * @param domain ENS domain (e.g., "karnataka.gov.eth")
     * @param trusted Whether the issuer is trusted
     */
    function registerIssuer(address issuer, string memory domain, bool trusted) external onlyOwner {
        trustedIssuers[issuer] = trusted;
        issuerDomains[domain] = issuer;
        
        emit IssuerRegistered(issuer, domain, trusted);
    }
    
    /**
     * @dev Verify a ZKP credential proof
     * @param claimType Type of claim being verified (e.g., "Income < ₹1L")
     * @param student Address of the student
     * @param issuer Address of the credential issuer
     * @param a ZKP proof component a
     * @param b ZKP proof component b
     * @param c ZKP proof component c
     * @param input Public inputs for the ZKP
     * @param merkleTreeDepth Depth of the Merkle tree
     * @param nullifier Unique identifier to prevent double-spending
     */
    function verifyCredential(
        string memory claimType,
        address student,
        address issuer,
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[4] memory input,
        uint256 merkleTreeDepth,
        bytes32 nullifier
    ) external returns (bool) {
        // Step 1: Check if nullifier has been used
        require(!usedNullifiers[nullifier], "Proof already used");
        
        // Step 2: Verify issuer is trusted
        require(trustedIssuers[issuer], "Issuer not trusted");
        
        // Step 3: Verify ZKP using Semaphore
        bool zkpValid = semaphoreVerifier.verifyProof(
            a,
            b,
            c,
            input,
            merkleTreeDepth
        );
        
        if (!zkpValid) {
            // Record failed verification
            emit CredentialVerified(claimType, student, issuer, false, block.timestamp);
            return false;
        }
        
        // Step 4: Mark nullifier as used
        usedNullifiers[nullifier] = true;
        
        // Step 5: Record successful verification
        emit CredentialVerified(claimType, student, issuer, true, block.timestamp);
        emit NullifierUsed(nullifier, student);
        
        return true;
    }
    
    /**
     * @dev Verify issuer trust through ENS
     * @param ensDomain ENS domain to verify
     * @return trusted Whether the issuer is trusted
     * @return issuerAddress The verified issuer address
     */
    function verifyIssuerENS(string memory ensDomain) external view returns (bool trusted, address issuerAddress) {
        return ensVerifier.verifyIssuerENS(ensDomain);
    }
    
    /**
     * @dev Check if a nullifier has been used
     * @param nullifier The nullifier to check
     * @return True if nullifier has been used
     */
    function isNullifierUsed(bytes32 nullifier) external view returns (bool) {
        return usedNullifiers[nullifier];
    }
    
    /**
     * @dev Get issuer address by domain
     * @param domain ENS domain
     * @return Issuer address
     */
    function getIssuerByDomain(string memory domain) external view returns (address) {
        return issuerDomains[domain];
    }
    
    /**
     * @dev Batch verify multiple credentials
     * @param claimTypes Array of claim types
     * @param students Array of student addresses
     * @param issuers Array of issuer addresses
     * @param proofs Array of ZKP proof components
     * @param nullifiers Array of nullifiers
     * @return Array of verification results
     */
    function batchVerifyCredentials(
        string[] memory claimTypes,
        address[] memory students,
        address[] memory issuers,
        uint256[2][][] memory a,
        uint256[2][2][][] memory b,
        uint256[2][][] memory c,
        uint256[4][][] memory input,
        uint256[] memory merkleTreeDepths,
        bytes32[] memory nullifiers
    ) external returns (bool[] memory) {
        require(
            claimTypes.length == students.length &&
            students.length == issuers.length &&
            issuers.length == a.length &&
            a.length == b.length &&
            b.length == c.length &&
            c.length == input.length &&
            input.length == merkleTreeDepths.length &&
            merkleTreeDepths.length == nullifiers.length,
            "Array lengths must match"
        );
        
        bool[] memory results = new bool[](claimTypes.length);
        
        for (uint256 i = 0; i < claimTypes.length; i++) {
            results[i] = this.verifyCredential(
                claimTypes[i],
                students[i],
                issuers[i],
                a[i],
                b[i],
                c[i],
                input[i],
                merkleTreeDepths[i],
                nullifiers[i]
            );
        }
        
        return results;
    }
    
    /**
     * @dev Emergency function to revoke issuer trust
     * @param issuer Address of issuer to revoke
     */
    function revokeIssuerTrust(address issuer) external onlyOwner {
        trustedIssuers[issuer] = false;
        emit IssuerRegistered(issuer, "", false);
    }
    
    /**
     * @dev Get verification statistics
     * @return totalVerifications Total number of verifications
     * @return successfulVerifications Number of successful verifications
     * @return trustedIssuerCount Number of trusted issuers
     */
    function getVerificationStats() external view returns (
        uint256 totalVerifications,
        uint256 successfulVerifications,
        uint256 trustedIssuerCount
    ) {
        // This would require additional storage to track properly
        // For now, return basic stats
        trustedIssuerCount = 0;
        // Count trusted issuers (this is a simplified implementation)
        // In a real implementation, you'd maintain counters
        return (0, 0, trustedIssuerCount);
    }
} 