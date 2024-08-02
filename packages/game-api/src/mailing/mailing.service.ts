import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { join } from 'path';
import { google } from 'googleapis';
import { Options } from 'nodemailer/lib/smtp-transport';
import configuration from '@app/shared/configuration';

@Injectable()
export class MailingService {
  constructor(private readonly mailerService: MailerService) {}
  async sendMail(target: string) {
    try {
      await this.setTransport();
      await this.mailerService.sendMail({
        transporterName: 'gmail',
        to: target, // list of receivers
        from: 'decolgenlabs@gmail.com', // sender address
        subject: 'Thank you for your Applying', // Subject line
        template: 'index',
        // context: {
        //   // Data to be sent to template engine..
        //   code,
        // },
        // attachments: [
        //   {
        //     filename: 'dev.png',
        //     path: join(process.cwd(), 'imgs/dev.png'),
        //     cid: 'myImg',
        //   },
        // ],
      });
    } catch (error) {
      throw Error(error);
    }
  }

  private async setTransport() {
    const OAuth2 = google.auth.OAuth2;
    const oauth2Client = new OAuth2(
      configuration().google_authen.client_id,
      configuration().google_authen.client_secret,
      'https://developers.google.com/oauthplayground',
    );

    oauth2Client.setCredentials({
      refresh_token: configuration().google_authen.refresh_token,
    });

    const accessToken: string = await new Promise((resolve, reject) => {
      oauth2Client.getAccessToken((err, token) => {
        if (err) {
          reject('Failed to create access token');
        }
        resolve(token);
      });
    });

    const config: Options = {
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: configuration().google_authen.email,
        clientId: configuration().google_authen.client_id,
        clientSecret: configuration().google_authen.client_secret,
        accessToken,
      },
    };

    this.mailerService.addTransporter('gmail', config);
  }
}
