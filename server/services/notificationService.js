const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // Send email notification
  async sendEmailNotification(to, subject, content) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject,
        html: content
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email notification sent to ${to}`);
    } catch (error) {
      console.error('❌ Email notification failed:', error);
    }
  }

  // Comment notification
  async sendCommentNotification(recipientEmail, documentTitle, commentAuthor, commentText) {
    const subject = `New comment on "${documentTitle}"`;
    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #274690;">New Comment</h2>
        <p><strong>${commentAuthor}</strong> added a comment to your document:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p style="margin: 0; font-style: italic;">"${commentText}"</p>
        </div>
        <p><strong>Document:</strong> ${documentTitle}</p>
        <a href="${process.env.FRONTEND_URL}/document/${documentId}" 
           style="background-color: #274690; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Document
        </a>
      </div>
    `;

    await this.sendEmailNotification(recipientEmail, subject, content);
  }

  // Document shared notification
  async sendDocumentSharedNotification(recipientEmail, documentTitle, sharedBy, role) {
    const subject = `Document shared: "${documentTitle}"`;
    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #274690;">Document Shared</h2>
        <p><strong>${sharedBy}</strong> has shared a document with you.</p>
        <p><strong>Document:</strong> ${documentTitle}</p>
        <p><strong>Your Role:</strong> ${role}</p>
        <a href="${process.env.FRONTEND_URL}/document/${documentId}" 
           style="background-color: #274690; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Open Document
        </a>
      </div>
    `;

    await this.sendEmailNotification(recipientEmail, subject, content);
  }

  // Real-time notification via Socket.IO
  sendRealtimeNotification(socket, type, data) {
    socket.emit('notification', {
      type: type,
      data: data,
      timestamp: new Date().toISOString()
    });
  }

  // Broadcast notification to all users in a document
  broadcastDocumentNotification(io, documentId, type, data) {
    io.to(documentId).emit('document-notification', {
      type: type,
      data: data,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new NotificationService();
