import { Injectable, Logger } from '@nestjs/common';
import { SendSmsDto } from './dto/send-sms.dto';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  // MiMSMS credentials
  private readonly apiKey = 'C55AX924Q4H13M3';
  private readonly userName = 'masihur96@gmail.com';
  private readonly nonMaskedSenderName = '8809617634017';
  private readonly maskedSenderName = 'School Care';

  // We use OneToMany API since it supports bulk and both T and P. But actually for same message to multiple numbers
  // Promotional API P is usually enough for bulk if we just join by comma, up to 1000.
  // We'll use OneToMany POST as per the PDF if it's multiple numbers. Or just regular POST if single.
  
  async sendBulkSms(sendSmsDto: SendSmsDto) {
    const { mobNumbers, message, isMasked } = sendSmsDto;
    
    const senderName = isMasked ? this.maskedSenderName : this.nonMaskedSenderName;
    
    // We can use the POST /api/V2/SMS with comma-separated numbers if it's Promotional.
    // Assuming we are sending promotional bulk for now or transactional bulk using OneToMany.
    // The OneToMany endpoint uses a structured smsData array.

    const url = 'https://api.mimsms.com/api/V2/OneToMany';
    
    const smsData = mobNumbers.map((mob) => ({ mobNumber: mob }));

    const payload = {
      apiKey: this.apiKey,
      userName: this.userName,
      senderName: senderName,
      message: message,
      smsData: smsData,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.text(); // the API might return text or json
      
      this.logger.log(`SMS Sent. Masked: ${isMasked}. Response: ${data}`);
      
      return {
        success: response.ok,
        data: data,
      };
    } catch (error: any) {
      this.logger.error(`Failed to send SMS: ${error.message}`);
      throw error;
    }
  }
}
