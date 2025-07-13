const validateZKPRequest = (req, res, next) => {
  const { identity, signal } = req.body;
  
  if (!identity || !signal) {
    return res.status(400).json({
      error: 'Missing required fields: identity and signal are required'
    });
  }

  // Validate identity format (should be a valid number or hex string)
  if (isNaN(identity) && !identity.match(/^0x[a-fA-F0-9]+$/)) {
    return res.status(400).json({
      error: 'Invalid identity format'
    });
  }

  next();
};

const validateVCIssuance = (req, res, next) => {
  const { studentDid, credentialType, credentialSubject } = req.body;
  
  if (!studentDid || !credentialType) {
    return res.status(400).json({
      error: 'Missing required fields: studentDid and credentialType are required'
    });
  }

  // Validate DID format
  if (!studentDid.match(/^did:[a-z]+:[a-zA-Z0-9]+$/)) {
    return res.status(400).json({
      error: 'Invalid DID format'
    });
  }

  // Validate credential subject
  if (credentialSubject && typeof credentialSubject !== 'object') {
    return res.status(400).json({
      error: 'credentialSubject must be an object'
    });
  }

  next();
};

const validateVCVerification = (req, res, next) => {
  const { jwt } = req.body;
  
  if (!jwt) {
    return res.status(400).json({
      error: 'Missing required field: jwt'
    });
  }

  // Basic JWT format validation
  if (!jwt.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/)) {
    return res.status(400).json({
      error: 'Invalid JWT format'
    });
  }

  next();
};

const validatePresentation = (req, res, next) => {
  const { credentials, holderDid } = req.body;
  
  if (!credentials || !Array.isArray(credentials)) {
    return res.status(400).json({
      error: 'Missing or invalid credentials array'
    });
  }

  if (!holderDid) {
    return res.status(400).json({
      error: 'Missing required field: holderDid'
    });
  }

  // Validate DID format
  if (!holderDid.match(/^did:[a-z]+:[a-zA-Z0-9]+$/)) {
    return res.status(400).json({
      error: 'Invalid holder DID format'
    });
  }

  next();
};

const validateAIQuery = (req, res, next) => {
  const { claims, question } = req.body;
  
  if (!question || typeof question !== 'string') {
    return res.status(400).json({
      error: 'Missing or invalid question field'
    });
  }

  if (claims && typeof claims !== 'object') {
    return res.status(400).json({
      error: 'claims must be an object'
    });
  }

  next();
};

module.exports = {
  validateZKPRequest,
  validateVCIssuance,
  validateVCVerification,
  validatePresentation,
  validateAIQuery
}; 