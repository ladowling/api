import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { company } from '../company.constants';
import {
  AuctionEndedStaffNotificationInput,
  AuctionWonNotificationInput,
  ContactFormNotificationInput,
  OutbidNotificationInput,
  VehicleApprovedNotificationInput,
  BuyerWelcomeMailInput,
  InvoiceCreatedMailInput,
  NewClientMailInput,
  NewStaffMailInput,
  PasswordResetOtpMailInput,
  ProjectAttachmentMailInput,
  ProjectCommentMailInput,
  ProjectCreatedMailInput,
  ProjectUpdatedMailInput,
  QuoteCreatedMailInput,
} from './mail.types';

@Injectable()
export class MailService {
  constructor(private readonly mailer: MailerService) {}

  private withBranding<T extends object>(context: T) {
    return {
      ...context,
      companyPhone: company.phone,
      portalUrl: company.portalUrl,
    };
  }

  async sendVehicleApprovedNotification(dto: VehicleApprovedNotificationInput) {
    await this.mailer.sendMail({
      to: dto.email,
      subject: 'New Vehicle Available for Bidding',
      template: 'vehicle-approved',
      context: this.withBranding(dto),
    });
  }

  async sendBuyerWelcomeMail(dto: BuyerWelcomeMailInput) {
    await this.mailer.sendMail({
      to: dto.email,
      subject: 'Your Buyer Account Has Been Created',
      template: 'buyer-welcome',
      context: this.withBranding(dto),
    });
  }

  async sendNewStaffMail(dto: NewStaffMailInput) {
    await this.mailer.sendMail({
      to: dto.email,
      subject: 'Lane 16 Staff account has been created',
      template: 'new-staff',
      context: this.withBranding(dto),
    });
  }

  async sendNewClientMail(dto: NewClientMailInput) {
    await this.mailer.sendMail({
      to: dto.email,
      subject: 'Lane 16 Client account has been created',
      template: 'new-client',
      context: this.withBranding(dto),
    });
  }

  async sendProjectCommentMail(dto: ProjectCommentMailInput) {
    await this.mailer.sendMail({
      to: dto.recipientEmail,
      subject: 'Lane 16 Project comment has been added',
      template: 'project-comment',
      context: this.withBranding(dto),
    });
  }

  async sendProjectAttachmentMail(dto: ProjectAttachmentMailInput) {
    await this.mailer.sendMail({
      to: dto.recipientEmail,
      subject: 'Lane 16 Project documents have been updated',
      template: 'project-attachment',
      context: this.withBranding(dto),
    });
  }

  async sendProjectCreatedMail(dto: ProjectCreatedMailInput) {
    await this.mailer.sendMail({
      to: dto.recipientEmail,
      subject: 'Lane 16 Project has been created',
      template: 'project-created',
      context: this.withBranding(dto),
    });
  }

  async sendProjectUpdatedMail(dto: ProjectUpdatedMailInput) {
    await this.mailer.sendMail({
      to: dto.recipientEmail,
      subject: 'Lane 16 Project has been updated',
      template: 'project-updated',
      context: this.withBranding(dto),
    });
  }

  async sendQuoteCreatedMail(dto: QuoteCreatedMailInput) {
    await this.mailer.sendMail({
      to: dto.recipientEmail,
      subject: 'Lane 16 Quote has been created',
      template: 'quote-created',
      context: this.withBranding(dto),
    });
  }

  async sendInvoiceCreatedMail(dto: InvoiceCreatedMailInput) {
    await this.mailer.sendMail({
      to: dto.recipientEmail,
      subject: 'Lane 16 Invoice has been created',
      template: 'invoice-created',
      context: this.withBranding(dto),
    });
  }

  async sendContactFormNotification(dto: ContactFormNotificationInput) {
    await this.mailer.sendMail({
      to: 'support@lane16.com',
      subject: `New Contact Message from ${dto.name}`,
      template: 'contact-form',
      context: this.withBranding(dto),
    });
  }

  async sendOutbidNotification(dto: OutbidNotificationInput) {
    await this.mailer.sendMail({
      to: dto.email,
      subject: `You've been outbid on ${dto.vehicleName}`,
      template: 'outbid',
      context: this.withBranding(dto),
    });
  }

  async sendAuctionWonNotification(dto: AuctionWonNotificationInput) {
    await this.mailer.sendMail({
      to: dto.email,
      subject: `Congratulations! You won the auction for ${dto.vehicleName}`,
      template: 'auction-won',
      context: this.withBranding(dto),
    });
  }

  async sendAuctionEndedStaffNotification(dto: AuctionEndedStaffNotificationInput) {
    await this.mailer.sendMail({
      to: dto.email,
      subject: `Auction Ended: ${dto.vehicleName}`,
      template: 'auction-ended-staff',
      context: this.withBranding(dto),
    });
  }

  async sendPasswordResetOtpMail(dto: PasswordResetOtpMailInput) {
    await this.mailer.sendMail({
      to: dto.email,
      subject: 'Lane 16 Password reset OTP',
      template: 'password-reset-otp',
      context: this.withBranding(dto),
    });
  }
}
