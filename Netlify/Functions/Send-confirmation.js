const { Resend } = require('resend');
const twilio = require('twilio');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { name, phone, email, service, date, time } = JSON.parse(event.body);

    const resend = new Resend(process.env.RESEND_API_KEY);
    const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('1868') 
      ? `+${cleanPhone}` 
      : cleanPhone.startsWith('868') 
      ? `+1${cleanPhone}` 
      : `+1868${cleanPhone}`;

    await twilioClient.messages.create({
      body: `Hi ${name}! Your booking at The Eyebrow Fairy for "${service}" on ${date} at ${time} is confirmed. See you soon!`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });

    if (email) {
      await resend.emails.send({
        from: 'The Eyebrow Fairy <onboarding@resend.dev>',
        to: email,
        subject: 'Appointment Confirmation - The Eyebrow Fairy',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #db2777;">Booking Confirmed! ✨</h2>
            <p>Hi <strong>${name}</strong>,</p>
            <p>Thank you for booking with <strong>The Eyebrow Fairy</strong>.</p>
            <ul>
              <li><strong>Service:</strong> ${service}</li>
              <li><strong>Date:</strong> ${date}</li>
              <li><strong>Time:</strong> ${time}</li>
            </ul>
            <p><em>Please note: Lamination and Tint services require a 24-hour patch test prior to your appointment.</em></p>
          </div>
        `
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Notifications sent successfully' })
    };
  } catch (error) {
    console.error('Error sending notifications:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
