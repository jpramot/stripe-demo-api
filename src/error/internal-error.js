import CustomError from "./custom-error.js";

export default class InternalError extends CustomError {
  constructor(message) {
    super(message, 500);
  }
}
