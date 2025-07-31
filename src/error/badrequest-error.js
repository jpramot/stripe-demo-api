import CustomError from "./custom-error.js";

export default class BadRequest extends CustomError {
  constructor(message) {
    super(message, 400);
  }
}
