export const testConfig = {
    jwt: {
        secret: 'test-jwt-secret-key',
        expiresIn: '1h',
    },
    mongodb: {
        uri: 'mongodb://localhost:27017/resumealign-test',
    },
    openai: {
        apiKey: 'test-openai-key',
    },
    gemini: {
        apiKey: 'test-gemini-key',
    },
    razorpay: {
        keyId: 'test-razorpay-key-id',
        keySecret: 'test-razorpay-key-secret',
    },
    frontend: {
        url: 'http://localhost:5173',
    },
};
