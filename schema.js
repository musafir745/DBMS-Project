const Joi = require("joi");

module.exports.hotelSchema = Joi.object({
  hotel: Joi.object({
    name: Joi.string().trim().required(),
    location: Joi.string().trim().required(),
    description: Joi.string().trim().required(),
    contact: Joi.string().trim().required(),
    image_url: Joi.string().trim().uri().allow("", null),
  }).required(),
});

module.exports.roomSchema = Joi.object({
  room: Joi.object({
    hotel_id: Joi.number().integer().positive().required(),
    room_type: Joi.string().trim().required(),
    capacity: Joi.number().integer().positive().required(),
    price: Joi.number().positive().required(),
    availability: Joi.string().valid("Available", "Unavailable").required(),
  }).required(),
});

module.exports.customerSchema = Joi.object({
  customer: Joi.object({
    name: Joi.string().trim().required(),
    email: Joi.string().trim().email().allow("", null),
    phone: Joi.string()
      .trim()
      .pattern(/^[0-9+\-\s()]{7,20}$/)
      .allow("", null),
  }).required(),
});

module.exports.bookingSchema = Joi.object({
  booking: Joi.object({
    room_id: Joi.number().integer().positive().required(),
    customer_id: Joi.number().integer().positive().required(),
    check_in_date: Joi.date().iso().required(),
    check_out_date: Joi.date().iso().greater(Joi.ref("check_in_date")).required(),
    status: Joi.string()
      .valid("Pending", "Confirmed", "Cancelled", "Completed")
      .required(),
  }).required(),
});
