// Test setup file
process.env.NODE_ENV = 'test';

// Mock environment variables for testing
process.env.PORT = '3001';
process.env.ETHEREUM_RPC_URL = 'https://test.rpc.url';
process.env.PRIVATE_KEY = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.ISSUER_PRIVATE_KEY = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

// Global test timeout
jest.setTimeout(10000);

// Suppress console logs during tests unless there's an error
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = originalConsoleError; // Keep error logging
});

afterAll(() => {
  console.log = originalConsoleLog;
}); 