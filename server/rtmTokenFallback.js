/**
 * RTM Token Builder Fallback
 * This is a simplified implementation of the Agora RTM token builder.
 * Used as a fallback when the main agora-access-token module fails.
 */

// Import dependencies
const { AccessToken } = require('agora-access-token');

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
    console.log('Using fallback RTM token builder');
    try {
      // Create a new access token
      const key = new AccessToken(appId, appCertificate, account, '');
      
      // Define privileges
      const privileges = {
        // RTM login privilege (1)
        kRtmLogin: 1
      };
      
      // Add RTM login privilege
      key.addPriviledge(privileges.kRtmLogin, privilegeExpiredTs);
      
      // Build and return the token
      return key.build();
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
