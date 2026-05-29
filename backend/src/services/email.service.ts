import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import logger from "../utils/logger";

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT),
        secure: parseInt(SMTP_PORT) === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });
    } else {
      logger.warn("SMTP configuration missing. Emails will be logged to the console.");
    }
  }

  private loadTemplate(templateName: string): string {
    const possiblePaths = [
      path.join(__dirname, "..", "templates", "email", `${templateName}.html`),
      path.join(__dirname, "..", "..", "src", "templates", "email", `${templateName}.html`),
      path.join(process.cwd(), "src", "templates", "email", `${templateName}.html`),
      path.join(process.cwd(), "backend", "src", "templates", "email", `${templateName}.html`),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p, "utf-8");
      }
    }

    logger.error(`Failed to find email template: ${templateName}.`);
    return "";
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.transporter) {
      logger.info(`[Email Mock to ${to}] Subject: ${subject}\nContent length: ${html.length} chars.`);
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"Apna Restorant" <noreply@apnarestorant.com>',
        to,
        subject,
        html,
      });
      logger.info(`Email sent successfully to ${to}`);
      return true;
    } catch (err: any) {
      logger.error(`Error sending email to ${to}: ${err.message}`, err);
      return false;
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    let html = this.loadTemplate("welcome");
    if (!html) return false;

    html = html
      .replace(/{{name}}/g, name)
      .replace(/{{loginUrl}}/g, `${process.env.FRONTEND_URL || "http://localhost:3000"}/login`);

    return this.sendEmail(to, "Welcome to Apna Restorant! 🍕", html);
  }

  async sendResetPasswordEmail(to: string, name: string, resetToken: string): Promise<boolean> {
    let html = this.loadTemplate("resetPassword");
    if (!html) return false;

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
    html = html
      .replace(/{{name}}/g, name)
      .replace(/{{resetUrl}}/g, resetUrl);

    return this.sendEmail(to, "Reset Your Password - Apna Restorant", html);
  }

  async sendInvoiceEmail(to: string, name: string, order: any): Promise<boolean> {
    let html = this.loadTemplate("invoice");
    if (!html) return false;

    let itemsHtml = "";
    if (order.items && Array.isArray(order.items)) {
      for (const item of order.items) {
        itemsHtml += `
          <tr>
            <td>${item.name}</td>
            <td style="text-align: center;">${item.quantity}</td>
            <td style="text-align: right;">₹${item.price}</td>
            <td style="text-align: right;">₹${item.subtotal}</td>
          </tr>
        `;
      }
    }

    html = html
      .replace(/{{orderNumber}}/g, order.orderNumber || "")
      .replace(/{{name}}/g, name || "")
      .replace(/{{orderDate}}/g, order.createdAt ? new Date(order.createdAt).toLocaleDateString() : new Date().toLocaleDateString())
      .replace(/{{paymentMethod}}/g, (order.paymentMethod || "").toUpperCase())
      .replace(/{{orderType}}/g, (order.orderType || "").toUpperCase())
      .replace(/{{invoiceItems}}/g, itemsHtml)
      .replace(/{{subtotal}}/g, Number(order.subtotal ?? 0).toFixed(2))
      .replace(/{{gstPercent}}/g, (order.gstPercent ?? 5).toString())
      .replace(/{{gstAmount}}/g, Number(order.gstAmount ?? 0).toFixed(2))
      .replace(/{{deliveryCharge}}/g, Number(order.deliveryCharge ?? 0).toFixed(2))
      .replace(/{{discount}}/g, Number(order.discount ?? 0).toFixed(2))
      .replace(/{{totalAmount}}/g, Number(order.totalAmount ?? 0).toFixed(2));

    return this.sendEmail(to, `Your Order Invoice - ${order.orderNumber} 🧾`, html);
  }
}

export default new EmailService();
