const normalizeBdPhone = (phone) => {
  let number = String(phone || '').trim();

  number = number.replace(/\s+/g, '');
  number = number.replace(/-/g, '');

  if (number.startsWith('+880')) {
    number = number.replace('+', '');
  }

  if (number.startsWith('01')) {
    number = `88${number}`;
  }

  return number;
};

const sendSms = async (phone, message) => {
  try {
    const apiUrl = process.env.SMS_API_URL;
    const apiKey = process.env.SMS_API_KEY;
    const senderId = process.env.SMS_SENDER_ID;

    if (!apiUrl || !apiKey || !senderId) {
      console.log('SMS config missing. Message was not sent.');
      return {
        success: false,
        message: 'SMS configuration missing',
      };
    }

    const receiver = normalizeBdPhone(phone);

    const params = new URLSearchParams({
      api_key: apiKey,
      type: 'text',
      number: receiver,
      senderid: senderId,
      message,
    });

    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      method: 'GET',
    });

    const providerResponse = await response.text();

    console.log('SMS Provider Response:', providerResponse);

    return {
      success: response.ok,
      providerResponse,
    };
  } catch (error) {
    console.log('SMS sending failed:', error.message);

    return {
      success: false,
      message: error.message,
    };
  }
};

module.exports = {
  sendSms,
  normalizeBdPhone,
};