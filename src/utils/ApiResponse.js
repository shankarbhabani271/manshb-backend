class ApiResponse {
  /**
   * Creates an instance of ApiResponse.
   * @param {number} statusCode - HTTP status code
   * @param {any} data - The payload to send back to the client
   * @param {string} [message="Success"] - Short descriptive success message
   */
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export { ApiResponse };
export default ApiResponse;
