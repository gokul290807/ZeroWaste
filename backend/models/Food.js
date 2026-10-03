const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({

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

    expiryDate: {
        type: String,
        required: true
    },

    category: {
        type: String,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

const Food = mongoose.model("Food", foodSchema);

module.exports = Food;