const mongoose = require("mongoose");

async function ConnectMongoDb(url) {
    return mongoose.connect(url);
}

module.exports = {
    ConnectMongoDb,
}