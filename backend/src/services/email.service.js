const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

const STATUS_MESSAGES = {
  CONFIRMED: 'Your order has been confirmed and is being processed.',
  ASSIGNED: 'A delivery agent has been assigned to your order.',
  PICKED_UP: 'Your package has been picked up by the delivery agent.',
  IN_TRANSIT: 'Your package is in transit to the destination.',
  OUT_FOR_DELIVERY: 'Your package is out for delivery! Expect it today.',
  DELIVERED: 'Your package has been delivered successfully. Thank you!',
  FAILED: 'Delivery attempt failed. Please reschedule your delivery.',
  RESCHEDULED: 'Your delivery has been rescheduled. We will attempt again on the new date.',
};

const sendStatusNotification = async ({ to, customerName, orderId, status, note, rescheduledDate }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[EMAIL SKIPPED] No email config. Would send ${status} to ${to}`);
    return;
  }

  const subject = `Order ${orderId} - Status: ${status.replace(/_/g, ' ')}`;
  const message = STATUS_MESSAGES[status] || `Your order status has been updated to: ${status}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="color: #fff; margin: 0;">LastMile Delivery</h2>
      </div>
      <div style="padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Hi <strong>${customerName}</strong>,</p>
        <p>${message}</p>
        ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
        ${rescheduledDate ? `<p><strong>Rescheduled Date:</strong> ${new Date(rescheduledDate).toDateString()}</p>` : ''}
        <div style="background: #f5f5f5; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Order ID:</strong> ${orderId}</p>
          <p style="margin: 5px 0 0;"><strong>Status:</strong> ${status.replace(/_/g, ' ')}</p>
        </div>
        <p style="color: #888; font-size: 12px;">This is an automated notification from LastMile Delivery.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, html });
    console.log(`[EMAIL SENT] ${status} notification to ${to}`);
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send to ${to}:`, err.message);
    // Don't throw — email failure shouldn't block the main flow
  }
};

module.exports = { sendStatusNotification };
