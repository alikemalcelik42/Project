module.exports = {
    "LOG_LEVEL": process.env.LOG_LEVEL || "debug",
    "PORT": process.env.PORT || 3000,
    "CONNECTION_STRING": process.env.CONNECTION_STRING || "mongodb://localhost/myapp",
    "JWT": {
        "SECRET": "1234567",
        "EXPIRE_TIME": !isNaN(parseInt(process.env.TOKEN_EXPIRE_TIME)) ? parseInt(process.env.TOKEN_EXPIRE_TIME) : 24*60*60
    },
    "PATH": {
        "FILE_UPLOAD_PATH": process.env.FILE_UPLOAD_PATH
    }
}