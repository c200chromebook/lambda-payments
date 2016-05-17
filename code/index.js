'use strict';
console.log('Loading event');

require('dotenv').load();

var stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
var validCountryList= JSON.parse(process.env.VALID_COUNTRIES);

exports.handler = function(event, context) {
   var message="";
   if(validCountryList.indexOf(event.stripeShippingAddressCountryCode) == -1)
   {
     context.succeed({variableHTML:(process.env.HTML_HEADER+process.env.BAD_COUNTRY)});
   }
   var customer = stripe.customers.create(
    {
     email:event.stripeEmail,
     source:event.stripeToken,
     plan:process.env.PLAN_NAME,
     metadata:
     {
       billName:event.stripeBillingName
     },
     shipping:
     {
       address:
       {
         city:event.stripeShippingAddressCity,
         country:event.stripeShippingAddressCountryCode,
         line1:event.stripeShippingAddressLine1,
         postal_code:event.stripeShippingAddressZip,
         state:event.stripeShippingAddressState
       },
       name:event.stripeShippingName
     }
   }, function(err, charge)
     {
       if(err)
       {
         message+=process.env.GENERIC_ERROR_HEADER;
         switch (err.type) {
          case 'StripeCardError':
            // A declined card error
            message+=err.message; // => e.g. "Your card's expiration year is invalid."
            break;
          case 'RateLimitError':
            message+=process.env.RATE_LIMIT_ERROR;
            // Too many requests made to the API too quickly
            break;
          case 'StripeInvalidRequestError':
            message+=process.env.INVALID_REQUEST_ERROR;
            // Invalid parameters were supplied to Stripe's API
            break;
          case 'StripeAPIError':
            message+=process.env.API_ERROR;
            // An error occurred internally with Stripe's API
            break;
          case 'StripeConnectionError':
            message+=process.env.CONN_ERROR;
            // Some kind of error occurred during the HTTPS communication
            break;
          case 'StripeAuthenticationError':
            message+=process.env.AUTH_ERROR;
            // You probably used an incorrect API key
            break;
          default:
            message+=process.env.WEIRD_ERROR;
            // Handle any other types of unexpected errors
            break;
        }
       }
       else
       {
         message=process.env.SUCCESS_RESPONSE;
       }
       context.succeed({variableHTML:(process.env.HTML_HEADER+message)});
     });
};
//thanks to https://github.com/TaylorBriggs/stripe-lambda/blob/master/index.js for error handling
