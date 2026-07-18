const ExpressError = require("./utils/ExpressError.js");
const {
  hotelSchema,
  roomSchema,
  customerSchema,
  bookingSchema,
} = require("./schema.js");

function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errMsg = error.details.map((el) => el.message).join(", ");
      throw new ExpressError(400, errMsg);
    }

    next();
  };
}

module.exports.validateHotel = validate(hotelSchema);
module.exports.validateRoom = validate(roomSchema);
module.exports.validateCustomer = validate(customerSchema);
module.exports.validateBooking = validate(bookingSchema);
