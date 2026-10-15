const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true
    },
    donorName: {
        type: String,
        default: ""
    },
    donorEmail: {
        type: String,
        default: ""
    },
    donorContact: {
        type: String,
        default: ""
    },
    foodId: {
        type: String,
        default: ""
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
    category: {
        type: String,
        default: "Food Item"
    },
    photo: {
        type: String,
        default: ""
    },
    location: {
        type: String,
        required: true
    },
    pickupLocation: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        default: ""
    },
    date: {
        type: String,
        required: true
    },
    // Donation Type: 'free' or 'value_based'
    donationType: {
        type: String,
        enum: ["free", "value_based"],
        default: "free"
    },
    expectedAmount: {
        type: Number,
        default: 0
    },
    agreedAmount: {
        type: Number,
        default: 0
    },
    // Payment Status: 'not_applicable', 'pending', 'paid', 'failed'
    paymentStatus: {
        type: String,
        enum: ["not_applicable", "pending", "paid", "failed"],
        default: "not_applicable"
    },
    // Donation Status: 'available', 'requested', 'accepted', 'collection_scheduled', 'collected', 'completed', 'cancelled'
    donationStatus: {
        type: String,
        enum: [
            "available",
            "requested",
            "accepted",
            "collection_scheduled",
            "collected",
            "completed",
            "cancelled"
        ],
        default: "available"
    },
    // Display status (kept synchronized)
    status: {
        type: String,
        default: "Available"
    },
    requestedBy: {
        type: String,
        default: ""
    },
    ngoName: {
        type: String,
        default: ""
    },
    ngoEmail: {
        type: String,
        default: ""
    },
    ngoContact: {
        type: String,
        default: ""
    },
    requestedAt: {
        type: Date
    },
    acceptedAt: {
        type: Date
    },
    pickupDate: {
        type: String,
        default: ""
    },
    pickupTime: {
        type: String,
        default: ""
    },
    collectedAt: {
        type: Date
    },
    paymentRecordedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    cancelledAt: {
        type: Date
    },
    receiptId: {
        type: String,
        default: ""
    },
    timeline: [
        {
            event: { type: String },
            timestamp: { type: Date, default: Date.now },
            details: { type: String, default: "" },
            actor: { type: String, default: "" }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Donation = mongoose.model("Donation", donationSchema);

module.exports = Donation;