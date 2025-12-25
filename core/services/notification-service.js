// core/services/notification-service.js
// Simple notification dispatcher for ShopUp

(function(global) {
  function getConfig() {
    return (global.ConfigManager && global.ConfigManager.getServiceConfig('notification')) || {};
  }

  function buildResponse(type, payload) {
    const randomSuffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    return {
      success: true,
      id: `${type.toUpperCase()}-${Date.now()}-${randomSuffix}`,
      provider: getConfig().provider || 'resend',
      payload
    };
  }

  async function sendEmail(email) {
    if (!email || !email.to || !email.subject) {
      return { success: false, error: 'Invalid email payload' };
    }
    const config = getConfig();
    const finalPayload = {
      from: email.from || config.defaultSender || 'no-reply@shopup.gh',
      to: email.to,
      subject: email.subject,
      html: email.html || '',
      metadata: email.metadata || {}
    };

    console.log('📧 Sending email notification', finalPayload);
    return buildResponse('email', finalPayload);
  }

  async function sendSMS(message) {
    if (!message || !message.to || !message.body) {
      return { success: false, error: 'Invalid SMS payload' };
    }
    const config = getConfig();
    const smsPayload = {
      from: message.from || 'ShopUp',
      to: message.to,
      body: message.body,
      metadata: message.metadata || {},
      provider: config.smsProvider || config.provider || 'africastalking'
    };

    console.log('📱 Sending SMS notification', smsPayload);
    return buildResponse('sms', smsPayload);
  }

  async function sendInApp(notification) {
    if (!notification || !notification.title || !notification.body) {
      return { success: false, error: 'Invalid in-app notification' };
    }
    const payload = {
      title: notification.title,
      body: notification.body,
      type: notification.type || 'info',
      metadata: notification.metadata || {}
    };

    console.log('🔔 Sending in-app notification', payload);
    return buildResponse('in_app', payload);
  }

  const NotificationService = {
    getConfig,
    sendEmail,
    sendSMS,
    sendInApp
  };

  global.NotificationService = NotificationService;
  console.log('✅ Notification service initialized', {
    provider: getConfig().provider || 'resend'
  });
})(window);
