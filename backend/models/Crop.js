const mongoose = require("mongoose");

const cropSchema = new mongoose.Schema({

    userEmail: {
        type: String,
        required: true
    },

    name: {
        type: String,
        required: true
    },

    quantity: {
        type: Number,
        required: true
    },

    unit: {
        type: String,
        required: true
    },

    date: {
        type: String,
        required: true
    },

    location: {
        type: String,
        required: true
    },

    description: {
        type: String,
        default: ""
    },

    status: {
        type: String,
        default: "Available"
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

const Crop =
    mongoose.model(
        "Crop",
        cropSchema
    );

module.exports = Crop;