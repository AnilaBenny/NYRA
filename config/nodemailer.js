const nodemailer = require('nodemailer');
const randomstring = require('randomstring');

// Disable SSL/TLS certificate validation (for testing/development only)
// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'rmtipop@gmail.com', //  Gmail email address
    pass: 'dkrszqhmjlrtxpxa', // Your Gmail application-specific password
  },
});

function sentOtp(email) {
  const otp = randomstring.generate({
    length: 6,
    charset: 'numeric',
  }
  );

  const mailOptions = {
    from: 'rmtipop@gmail.com',
    to: email,
    subject: 'Your OTP Code for verification',
    text: `Your OTP code is: ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
      console.log('OTP:', otp);
    }
  });
  return otp;
}

module.exports = { sentOtp,transporter};