import CustomError from "./custom-error.js";

export default class NotFound extends CustomError {
  constructor(message) {
    super(message, 404);
  }
}
