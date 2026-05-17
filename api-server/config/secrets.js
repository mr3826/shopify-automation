const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

class SecretsManager {
  constructor() {
    this.client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'ap-south-1' });
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getSecret(secretName) {
    // Check cache first
    const cached = this.cache.get(secretName);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.value;
    }

    try {
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await this.client.send(command);

      let secret;
      if (response.SecretString) {
        // Secrets Manager may return either a JSON string or a plain string.
        // Try to parse JSON first, but fall back to raw string when parse fails.
        try {
          secret = JSON.parse(response.SecretString);
        } catch (parseErr) {
          // Not JSON - return raw string
          secret = response.SecretString;
        }
      } else if (response.SecretBinary) {
        // Handle binary secrets (may be JSON encoded)
        const decoded = Buffer.from(response.SecretBinary, 'base64').toString('utf8');
        try {
          secret = JSON.parse(decoded);
        } catch {
          secret = decoded;
        }
      } else {
        secret = {};
      }

      // Cache the secret
      this.cache.set(secretName, {
        value: secret,
        timestamp: Date.now()
      });

      return secret;

    } catch (error) {
      console.error(`Error fetching secret ${secretName}:`, error);
      
      // Fallback to environment variables for development
      if (process.env.NODE_ENV === 'development') {
        return this.getSecretFromEnv(secretName);
      }

      throw new Error(`Failed to retrieve secret: ${secretName}`);
    }
  }

  getSecretFromEnv(secretName) {
    const envMappings = {
      'shopify-automation/db-credentials': {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        username: process.env.DB_USERNAME || 'shopify_admin',
        password: process.env.DB_PASSWORD || 'dev-password',
        database: process.env.DB_NAME || 'shopify_automation'
      },
      'shopify-automation/jwt-secret': {
        secret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production'
      },
      'shopify-automation/shopify-api': {
        apiKey: process.env.SHOPIFY_API_KEY || 'dev-api-key',
        apiSecret: process.env.SHOPIFY_API_SECRET || 'dev-api-secret',
        webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET || 'dev-webhook-secret'
      },
      'shopify-automation/openai-api': {
        apiKey: process.env.OPENAI_API_KEY || 'dev-openai-key'
      }
    };

    return envMappings[secretName] || {};
  }

  async getDatabaseConfig() {
    return this.getSecret('shopify-automation/db-credentials');
  }

  async getJWTSecret() {
    const secret = await this.getSecret('shopify-automation/jwt-secret');
    // secret may be an object { secret: '...' } or a raw string
    if (!secret) return null;
    if (typeof secret === 'string') return secret;
    return secret.secret || null;
  }

  async getShopifyConfig() {
    return this.getSecret('shopify-automation/shopify-api');
  }

  async getOpenAIConfig() {
    return this.getSecret('shopify-automation/openai-api');
  }

  // Clear cache (useful for testing or when secrets are updated)
  clearCache() {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    const now = Date.now();
    let validCount = 0;
    let expiredCount = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp < this.cacheTimeout) {
        validCount++;
      } else {
        expiredCount++;
      }
    }

    return {
      total: this.cache.size,
      valid: validCount,
      expired: expiredCount
    };
  }
}

// Singleton instance
const secretsManager = new SecretsManager();

module.exports = secretsManager;
