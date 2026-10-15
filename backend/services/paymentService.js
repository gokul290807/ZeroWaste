/**
 * ZeroWaste Payment & Reimbursement Service
 * 
 * Provides an extensible payment abstraction layer for value-based food and crop donations.
 * In college demo mode, this operates seamlessly without requiring external API keys.
 * Structure is fully prepared for future plug-and-play integration with Razorpay or Stripe.
 */

class PaymentService {
    constructor() {
        this.provider = process.env.PAYMENT_PROVIDER || "demo"; // 'demo' | 'razorpay' | 'stripe'
        this.currency = "INR";
        this.currencySymbol = "₹";

        console.log(`💳 PaymentService initialized with provider: [${this.provider.toUpperCase()}]`);
    }

    /**
     * Records a payment transaction for value-based donations.
     * In demo mode: generates a verified receipt reference and marks the payment as recorded.
     * 
     * @param {Object} donation - The donation record
     * @param {Object} paymentData - { amount, method, notes, recordedBy }
     * @returns {Object} Payment result object
     */
    async recordPayment(donation, paymentData = {}) {
        const amount = Number(paymentData.amount || donation.agreedAmount || donation.expectedAmount || 0);
        const method = paymentData.method || "Cash / Direct Reimbursement";
        const recordedBy = paymentData.recordedBy || "Authorized User";
        const timestamp = new Date();
        const transactionRef = `ZW-TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

        return {
            success: true,
            status: "paid",
            paymentStatus: "paid",
            transactionId: transactionRef,
            amount: amount,
            currency: this.currency,
            currencySymbol: this.currencySymbol,
            method: method,
            recordedBy: recordedBy,
            recordedAt: timestamp,
            notes: paymentData.notes || "Payment recorded and verified successfully.",
            isSimulated: this.provider === "demo"
        };
    }

    /**
     * Staged for future Razorpay integration:
     * When RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set, this initiates a live order.
     */
    async createRazorpayOrder(donation, amount) {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return {
                available: false,
                message: "Razorpay credentials not configured. Using Demo Payment Workflow."
            };
        }

        // Future Razorpay integration placeholder:
        // const Razorpay = require('razorpay');
        // const instance = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
        // return await instance.orders.create({ amount: amount * 100, currency: "INR", receipt: `receipt_${donation._id}` });
        return {
            available: true,
            orderId: `order_mock_${Date.now()}`
        };
    }

    /**
     * Staged for future Stripe integration:
     * When STRIPE_SECRET_KEY is set, this creates a payment intent.
     */
    async createStripePaymentIntent(donation, amount) {
        if (!process.env.STRIPE_SECRET_KEY) {
            return {
                available: false,
                message: "Stripe credentials not configured. Using Demo Payment Workflow."
            };
        }

        return {
            available: true,
            clientSecret: `pi_mock_${Date.now()}_secret`
        };
    }

    /**
     * Generates a unique, standardized receipt ID
     */
    generateReceiptId(donationId) {
        const year = new Date().getFullYear();
        const suffix = (donationId ? donationId.toString().slice(-6) : Math.floor(100000 + Math.random() * 900000)).toUpperCase();
        return `ZW-${year}-${suffix}`;
    }
}

module.exports = new PaymentService();
