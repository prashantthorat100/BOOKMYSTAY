import dotenv from 'dotenv';
import gmailService from './utils/gmailService.js';

// Load environment variables
dotenv.config();

console.log('=== TESTING EMAIL CONFIGURATION ===');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS configured:', process.env.SMTP_PASS ? 'YES' : 'NO');
console.log('SMTP_SECURE:', process.env.SMTP_SECURE);
console.log('NODE_ENV:', process.env.NODE_ENV);

console.log('\n=== TESTING EMAIL SERVICE ===');

async function testEmailService() {
  try {
    console.log('Initializing email service...');
    
    // Test email sending
    const testEmail = 'p14.thorat2006@gmail.com';
    const testOtp = '123456';
    
    console.log(`Sending test email to: ${testEmail}`);
    
    const result = await gmailService.sendOtpEmail(testEmail, testOtp);
    console.log('Email sent successfully:', result);
    
  } catch (error) {
    console.error('Email test failed:', error.message);
    console.error('Full error:', error);
  }
}

testEmailService();
