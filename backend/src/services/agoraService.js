// src/services/agoraService.js
const { RtcTokenBuilder, RtmTokenBuilder } = require('agora-access-token');

const getAgoraToken = (channelName, uid, role = 'subscriber') => {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  
  if (!appId || !appCertificate) {
    console.error('Agora credentials not configured');
    return null;
  }
  
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
  
  let token;
  
  if (role === 'publisher') {
    // RTC role: publisher (host)
    token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcTokenBuilder.Role,
      RtcTokenBuilder.RolePublisher,
      privilegeExpiredTs
    );
  } else {
    // RTC role: subscriber (audience)
    token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcTokenBuilder.RoleSubscriber,
      privilegeExpiredTs
    );
  }
  
  return token;
};

const getRtmToken = (userId) => {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  
  if (!appId || !appCertificate) {
    return null;
  }
  
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
  
  const token = RtmTokenBuilder.buildToken(
    appId,
    appCertificate,
    userId.toString(),
    RtmTokenBuilder.RoleRtmUser,
    privilegeExpiredTs
  );
  
  return token;
};

const generateChannelName = (auctionId) => {
  return `auction_${auctionId}_${Date.now()}`;
};

module.exports = {
  getAgoraToken,
  getRtmToken,
  generateChannelName,
};