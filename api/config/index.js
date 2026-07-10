module.exports = {
    "LOG_LEVEL": process.env.LOG_LEVEL || "debug",
    "PORT": process.env.PORT || 3000,
    "CONNECTION_STRING": process.env.CONNECTION_STRING || "mongodb://localhost/myapp",
    "JWT": {
        "SECRET": process.env.SECRET || "d3fb2ea8a434dca30b5fc988aface476ce7d9beef1099e65b73622f60d6b5f44a5d1deefa96a63714b3368d31e0c7b558e5a06f4e4d1f87dd91618f5258f61eb",
        "EXPIRE_TIME": !isNaN(parseInt(process.env.TOKEN_EXPIRE_TIME)) ? parseInt(process.env.TOKEN_EXPIRE_TIME) : 24*60*60
    },
    "PATH": {
        "FILE_UPLOAD_PATH": process.env.FILE_UPLOAD_PATH
    }
}