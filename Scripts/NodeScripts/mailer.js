'use strict';
const nodemailer = require('nodemailer');

const config = require('C:\\node\\config.js');

let smtpConfig = {
    pool: true,
    host: config.mail.host,
    port: config.mail.port,
    secure: false,
    auth: {
        user: config.mail.username,
        pass: config.mail.password
    },
    debug: true
}

let transporter = nodemailer.createTransport(smtpConfig);

// verify connection configuration
transporter.verify(function(error, success) {
   if (error) {
        console.log(error);
   } else {
        console.log('Server is ready to take our messages');
   }
});


var email = {
    'send' : send
}

function send(to, from, subject, message, htmlMessage) {
    var message = {
        from: from,
        to: to,
        subject: subject,
        text: message,
        html: htmlMessage
    };

    transporter.sendMail(message, (err, info) => {
        if (err) {
            console.log(err);
        }
        console.log("email sent");
    });
}

module.exports = email;

// Testing 
//email.send('jeremy@biffis.com', 'ottawa@biffis.com', 'Script finished running', "Test", "Test");