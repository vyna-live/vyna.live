/**
 * RTM Token Builder Fallback
 * This is a simplified implementation of the Agora RTM token builder.
 * Since we can't rely on the agora-access-token package, we're implementing
 * a minimal version for development purposes that returns a placeholder token.
 */

// Define roles for RTM
const Role = {
  Rtm_User: 1
};

// Build the RTM token builder
class RtmTokenBuilder {
  /**
   * Build an RTM token.
   *
   * @param {string} appId - The App ID issued by Agora
   * @param {string} appCertificate - The App Certificate issued by Agora
   * @param {string} account - The user account
   * @param {number} role - The user role, currently only Role.Rtm_User is supported
   * @param {number} privilegeExpiredTs - The expiration time of the token
   * @returns {string} The RTM token
   */
  static buildToken(appId, appCertificate, account, role, privilegeExpiredTs) {
    console.log('Using development fallback RTM token builder');
    try {
      // Since we're in development mode and can't rely on the official SDK,
      // we'll generate a placeholder token that follows the pattern of a real token
      // Note: This will not work with Agora servers but lets local testing continue
      
      // Simple token format that includes the key identifiers in a base64-like string
      const timestamp = Math.floor(Date.now() / 1000);
      const randomHex = Math.random().toString(16).substring(2, 10);
      const sanitizedAccount = account.replace(/[^a-zA-Z0-9]/g, '');
      
      // Create a token-like string
      // Format: 00<appId><account><timestamp><role><random>
      const tokenStr = `00${appId}RTM${sanitizedAccount}${timestamp}${role}${randomHex}`;
      
      // Return the token
      return tokenStr;
    } catch (error) {
      console.error('Error in fallback RTM token generation:', error);
      throw error;
    }
  }
}

module.exports = {
  RtmTokenBuilder,
  Role
};
