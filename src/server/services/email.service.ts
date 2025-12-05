import nodemailer from "nodemailer";

export class EmailService {
	private transporter: nodemailer.Transporter | null = null;

	constructor() {
		this.initializeTransporter();
	}

	private initializeTransporter() {
		const emailHost = process.env.EMAIL_HOST;
		const emailPort = process.env.EMAIL_PORT;
		const emailUser = process.env.EMAIL_USER;
		const emailPass = process.env.EMAIL_PASS;
		const emailFrom = process.env.EMAIL_FROM;

		if (!emailHost || !emailUser || !emailPass || !emailFrom) {
			console.warn(
				"Email configuration is incomplete. Email sending will be disabled.",
			);
			return;
		}

		try {
			this.transporter = nodemailer.createTransport({
				host: emailHost,
				port: Number(emailPort) || 587,
				secure: Number(emailPort) === 465,
				auth: {
					user: emailUser,
					pass: emailPass,
				},
			});

			console.log("✅ Email service initialized successfully");
		} catch (error) {
			console.error("Failed to initialize email transporter:", error);
		}
	}

	async sendPaymentLink(params: {
		to: string;
		buyerName?: string;
		orderId: string;
		totalAmount: number;
		paymentLink: string;
	}): Promise<boolean> {
		if (!this.transporter) {
			console.warn("Email transporter not configured. Skipping email send.");
			return false;
		}

		const { to, buyerName, orderId, totalAmount, paymentLink } = params;

		const subject = `Payment Required - Order #${orderId.slice(0, 8)}`;

		const html = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Payment Link</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
	<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
		<h1 style="margin: 0; font-size: 28px;">Livestream ERP Payments</h1>
		<p style="margin: 10px 0 0 0; opacity: 0.9;">Complete Your Payment</p>
	</div>
	
	<div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
		<p style="font-size: 16px; margin-bottom: 20px;">
			${buyerName ? `Hi ${buyerName},` : "Hello,"}
		</p>
		
		<p style="font-size: 16px; margin-bottom: 20px;">
			Your order has been created! Please complete your payment to proceed with your purchase.
		</p>
		
		<div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
			<p style="margin: 5px 0; color: #666; font-size: 14px;">Order ID</p>
			<p style="margin: 5px 0 15px 0; font-weight: bold; font-family: monospace; color: #333;">${orderId}</p>
			
			<p style="margin: 5px 0; color: #666; font-size: 14px;">Total Amount</p>
			<p style="margin: 5px 0; font-weight: bold; font-size: 24px; color: #667eea;">$${(totalAmount / 100).toFixed(2)} USD</p>
		</div>
		
		<div style="text-align: center; margin: 30px 0;">
			<a href="${paymentLink}" 
			   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
				Pay Now →
			</a>
		</div>
		
		<div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0;">
			<p style="margin: 0; font-size: 14px; color: #856404;">
				<strong>⏰ Important:</strong> This payment link is valid for your order. Click the button above to complete your payment securely.
			</p>
		</div>
		
		<p style="font-size: 14px; color: #666; margin-top: 30px;">
			If you didn't request this, please ignore this email.
		</p>
		
		<hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
		
		<p style="font-size: 12px; color: #999; text-align: center;">
			Payments are processed securely by Stripe<br>
			We never store your full card details
		</p>
	</div>
</body>
</html>
		`;

		const text = `
Livestream ERP Payments
Complete Your Payment

${buyerName ? `Hi ${buyerName},` : "Hello,"}

Your order has been created! Please complete your payment to proceed with your purchase.

Order Details:
- Order ID: ${orderId}
- Total Amount: $${(totalAmount / 100).toFixed(2)} USD

Payment Link:
${paymentLink}

Click the link above or copy it to your browser to complete your payment securely.

If you didn't request this, please ignore this email.

---
Payments are processed securely by Stripe
We never store your full card details
		`;

		try {
			await this.transporter.sendMail({
				from: process.env.EMAIL_FROM,
				to,
				subject,
				text,
				html,
			});

			console.log(`✅ Payment link email sent to ${to}`);
			return true;
		} catch (error) {
			console.error("Failed to send payment link email:", error);
			return false;
		}
	}
}
