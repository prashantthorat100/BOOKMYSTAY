import dotenv from 'dotenv';
import emailService from './utils/emailService.js';

// Load environment variables
dotenv.config();

console.log('Testing Email Configuration...');
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_PASS configured:', process.env.SMTP_PASS ? 'YES' : 'NO');

async function testEmail() {
  try {
    const testEmail = 'p14.thorat2006@gmail.com';
    const testOtp = '123456';
    
    console.log('\nSending test email...');
    const result = await emailService.sendOtpEmail(testEmail, testOtp);
    console.log('Email sent successfully:', result);
  } catch (error) {
    console.error('Email failed:', error.message);
  }
}

testEmail();
