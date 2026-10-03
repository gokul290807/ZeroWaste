const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({

    userEmail: {
        type: String,
        required: true
    },

    foodId: {
        type: String,
        required: true
    },

    foodName: {
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

    location: {
        type: String,
        required: true
    },

    description: {
        type: String,
        default: ""
    },

    date: {
        type: String,
        required: true
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

const Donation =
    mongoose.model(
        "Donation",
        donationSchema
    );

module.exports = Donation;