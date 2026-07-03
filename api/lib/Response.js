const Enum = require('../config/Enum');
const CustomError = require('./Error');


class Response {
    constructor(res) {}
    static successResponse(data, code=200) {
        return {
            code,
            data
        };
    }

    static errorResponse(error, code) {

        if(!error) {
            return {
                code: Enum.HTTP_CODES.INTERNAL_SERVER_ERROR,
                error: {
                    message: 'An error occurred',
                    description: 'No additional information provided'
                }
            };
        }

        if(error instanceof CustomError) {
            return {
                code: error.code,
                error: {
                    message: error.message,
                    description: error.description
                }
            };
        }
        else if(error.message?.includes("E11000")) {
            return {
                code: Enum.HTTP_CODES.CONFLICT,
                error: {
                    message: "Already Exists",
                    description: "A record with the same unique key already exists."
                }
            };
        }
        
        return {
            code : Enum.HTTP_CODES.INTERNAL_SERVER_ERROR,
            error: {
                message: error.message || 'An error occurred',
                description: error.description || 'No additional information provided'
            }
        };
    }
}

module.exports = Response;