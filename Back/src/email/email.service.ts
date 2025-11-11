import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
}

export interface PurchaseEmailData {
  userName: string;
  userEmail: string;
  eventName: string;
  purchaseDate: string;
  totalAmount: number;
  items: {
    description: string;
    quantity: number;
    price: number;
  }[];
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  /**
   * Initialize nodemailer transporter
   */
  private initializeTransporter() {
    const emailHost = this.configService.get<string>('EMAIL_HOST');
    const emailPort = this.configService.get<number>('EMAIL_PORT', 587);
    const emailUser = this.configService.get<string>('EMAIL_USER');
    const emailPassword = this.configService.get<string>('EMAIL_PASSWORD');
    const emailFrom = this.configService.get<string>('EMAIL_FROM');

    if (!emailHost || !emailUser || !emailPassword) {
      this.logger.warn(
        'Email credentials not configured. Email service will be disabled.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    this.logger.log(
      `Email service initialized with host: ${emailHost}, from: ${emailFrom}`,
    );
  }

  /**
   * Check if email service is enabled
   */
  isEnabled(): boolean {
    return !!this.transporter;
  }

  /**
   * Send generic email
   */
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    if (!this.isEnabled()) {
      this.logger.warn('Email service is disabled. Skipping email send.');
      return false;
    }

    try {
      const emailFrom = this.configService.get<string>('EMAIL_FROM');

      const info = await this.transporter.sendMail({
        from: emailFrom,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      this.logger.log(`Email sent successfully to ${options.to}: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending email to ${options.to}: ${error.message}`);
      return false;
    }
  }

  /**
   * Send welcome email when user registers
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    const subject = '¡Bienvenido a JERPRO! 🏃‍♂️📸';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #e5e5e5;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background: #000000;
            }
            .header {
              background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
              color: #000000;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #1a1a1a;
              padding: 30px;
              border-radius: 0 0 10px 10px;
              color: #e5e5e5;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #F59E0B;
              color: #000000;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              color: #888;
              font-size: 12px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>¡Bienvenido a JERPRO! 🏃‍♂️</h1>
          </div>
          <div class="content">
            <h2>¡Hola ${data.userName}! 👋</h2>
            <p>
              Estamos emocionados de tenerte con nosotros. JERPRO es la plataforma
              donde podrás encontrar y descargar las mejores fotos de tus carreras.
            </p>
            <p>
              Con tu cuenta podrás:
            </p>
            <ul>
              <li>✅ Buscar tus fotos por número de dorsal</li>
              <li>✅ Descargar fotos en alta calidad</li>
              <li>✅ Guardar tus fotos favoritas</li>
              <li>✅ Acceder a eventos exclusivos</li>
            </ul>
            <p>
              ¿Listo para encontrar tus mejores momentos?
            </p>
            <div style="text-align: center;">
              <a href="${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}" class="button">
                Ir a JERPRO
              </a>
            </div>
            <p>
              Si tienes alguna pregunta, no dudes en contactarnos.
            </p>
            <p>
              ¡Nos vemos en la pista! 🎉
            </p>
          </div>
          <div class="footer">
            <p>JERPRO - Tus mejores momentos en carrera</p>
            <p>Este email fue enviado a ${data.userEmail}</p>
          </div>
        </body>
      </html>
    `;

    const text = `
¡Bienvenido a JERPRO! 🏃‍♂️

Hola ${data.userName}!

Estamos emocionados de tenerte con nosotros. JERPRO es la plataforma donde podrás encontrar y descargar las mejores fotos de tus carreras.

Con tu cuenta podrás:
- Buscar tus fotos por número de dorsal
- Descargar fotos en alta calidad
- Guardar tus fotos favoritas
- Acceder a eventos exclusivos

¿Listo para encontrar tus mejores momentos? Visita: ${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}

Si tienes alguna pregunta, no dudes en contactarnos.

¡Nos vemos en la pista! 🎉

---
JERPRO - Tus mejores momentos en carrera
Este email fue enviado a ${data.userEmail}
    `;

    return this.sendEmail({
      to: data.userEmail,
      subject,
      html,
      text,
    });
  }

  /**
   * Send purchase confirmation email
   */
  async sendPurchaseConfirmationEmail(data: PurchaseEmailData): Promise<boolean> {
    const subject = '✅ Confirmación de Compra - JERPRO';

    const itemsHtml = data.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #444; color: #e5e5e5;">${item.description}</td>
          <td style="padding: 10px; border-bottom: 1px solid #444; text-align: center; color: #e5e5e5;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #444; text-align: right; color: #e5e5e5;">$${item.price.toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #444; text-align: right; color: #e5e5e5;">$${(item.quantity * item.price).toFixed(2)}</td>
        </tr>
      `,
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #e5e5e5;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background: #000000;
            }
            .header {
              background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
              color: #000000;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #1a1a1a;
              padding: 30px;
              border-radius: 0 0 10px 10px;
              color: #e5e5e5;
            }
            .invoice {
              background: #2a2a2a;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th {
              background: #F59E0B;
              color: #000000;
              padding: 10px;
              text-align: left;
              font-weight: bold;
            }
            .total {
              background: #F59E0B;
              color: #000000;
              padding: 15px;
              text-align: right;
              font-size: 18px;
              font-weight: bold;
              border-radius: 5px;
              margin-top: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #F59E0B;
              color: #000000;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              color: #888;
              font-size: 12px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✅ ¡Compra Confirmada!</h1>
          </div>
          <div class="content">
            <h2>¡Hola ${data.userName}! 👋</h2>
            <p>
              Tu compra ha sido procesada exitosamente. ¡Gracias por confiar en JERPRO!
            </p>

            <div class="invoice">
              <h3>Detalles de la Compra</h3>
              <p><strong>Evento:</strong> ${data.eventName}</p>
              <p><strong>Fecha:</strong> ${data.purchaseDate}</p>

              <table>
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th style="text-align: center;">Cantidad</th>
                    <th style="text-align: right;">Precio Unit.</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <div class="total">
                TOTAL: $${data.totalAmount.toFixed(2)}
              </div>
            </div>

            <p>
              Ya puedes acceder y descargar tus fotos desde tu cuenta.
            </p>

            <div style="text-align: center;">
              <a href="${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/mis-fotos" class="button">
                Ver Mis Fotos
              </a>
            </div>

            <p>
              Si tienes alguna pregunta sobre tu compra, no dudes en contactarnos.
            </p>

            <p>
              ¡Disfruta tus fotos! 📸
            </p>
          </div>
          <div class="footer">
            <p>JERPRO - Tus mejores momentos en carrera</p>
            <p>Este email fue enviado a ${data.userEmail}</p>
          </div>
        </body>
      </html>
    `;

    const itemsText = data.items
      .map(
        (item) =>
          `${item.description} - Cantidad: ${item.quantity} - Precio: $${item.price.toFixed(2)} - Total: $${(item.quantity * item.price).toFixed(2)}`,
      )
      .join('\n');

    const text = `
✅ ¡Compra Confirmada!

Hola ${data.userName}!

Tu compra ha sido procesada exitosamente. ¡Gracias por confiar en JERPRO!

DETALLES DE LA COMPRA
Evento: ${data.eventName}
Fecha: ${data.purchaseDate}

ITEMS:
${itemsText}

TOTAL: $${data.totalAmount.toFixed(2)}

Ya puedes acceder y descargar tus fotos desde tu cuenta.
Visita: ${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/mis-fotos

Si tienes alguna pregunta sobre tu compra, no dudes en contactarnos.

¡Disfruta tus fotos! 📸

---
JERPRO - Tus mejores momentos en carrera
Este email fue enviado a ${data.userEmail}
    `;

    return this.sendEmail({
      to: data.userEmail,
      subject,
      html,
      text,
    });
  }
}
