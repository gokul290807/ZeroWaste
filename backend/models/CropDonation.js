const mongoose = require("mongoose");

const cropDonationSchema = new mongoose.Schema({

    userEmail: {
        type: String,
        required: true
    },

    cropId: {
        type: String,
        required: true
    },

    cropName: {
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

const CropDonation =
    mongoose.model(
        "CropDonation",
        cropDonationSchema
    );

module.exports = CropDonation;