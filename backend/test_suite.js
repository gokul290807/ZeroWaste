/**
 * ZeroWaste Comprehensive Test Suite
 * Validates Authentication, Authorization, Food Inventory, Farmer Crops,
 * Donation Lifecycle, Contact Privacy, and Cancellation.
 */

const http = require("http");

const BASE_URL = "http://localhost:3000";

function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const headers = { "Content-Type": "application/json" };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const data = body ? JSON.stringify(body) : null;
        if (data) {
            headers["Content-Length"] = Buffer.byteLength(data);
        }

        const req = http.request(
            {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: method,
                headers: headers
            },
            res => {
                let chunks = "";
                res.on("data", chunk => (chunks += chunk));
                res.on("end", () => {
                    let parsed = null;
                    try {
                        parsed = JSON.parse(chunks);
                    } catch (e) {
                        parsed = chunks;
                    }
                    resolve({ status: res.statusCode, body: parsed });
                });
            }
        );

        req.on("error", reject);
        if (data) req.write(data);
        req.end();
    });
}

let passed = 0;
let failed = 0;

function assert(condition, testName, extraInfo = "") {
    if (condition) {
        console.log(`  ✅ PASS: ${testName}`);
        passed++;
    } else {
        console.error(`  ❌ FAIL: ${testName} ${extraInfo}`);
        failed++;
    }
}

async function runTests() {
    console.log("==========================================");
    console.log("🌱 Starting ZeroWaste Technical Verification");
    console.log("==========================================\n");

    try {
        // 1. Health check
        console.log("1. Testing Health Check & System Status:");
        const health = await request("GET", "/api/test");
        assert(health.status === 200, "Health check returns 200");
        assert(health.body.storageEngine !== undefined, `Storage engine identified: ${health.body.storageEngine}`);
        console.log(`     Active Storage Mode: ${health.body.storageEngine} (Mongo connected: ${health.body.mongoConnected})`);

        // 2. Demo logins & JWT generation
        console.log("\n2. Testing Authentication & Session Management:");
        const rahulLogin = await request("POST", "/api/login", {
            email: "rahul@gmail.com",
            password: "password123"
        });
        assert(rahulLogin.status === 200, "Household demo login succeeds");
        assert(!!rahulLogin.body.token, "JWT token generated on login");
        assert(!rahulLogin.body.user.password, "Password hash is never returned in response");
        assert(rahulLogin.body.user.contactNumber === "+91 98765 43210", "Real contact number returned (not a fallback)");
        const rahulToken = rahulLogin.body.token;

        const sureshLogin = await request("POST", "/api/login", {
            email: "suresh@farmer.com",
            password: "password123"
        });
        assert(sureshLogin.status === 200, "Farmer demo login succeeds");
        const sureshToken = sureshLogin.body.token;

        const ngoLogin = await request("POST", "/api/login", {
            email: "ngo@helpinghands.org",
            password: "password123"
        });
        assert(ngoLogin.status === 200, "NGO demo login succeeds");
        const ngoToken = ngoLogin.body.token;

        // Registration validation tests
        const badEmail = await request("POST", "/api/register", {
            name: "Test",
            email: "invalid-email-address",
            password: "pass",
            role: "household",
            contactNumber: "1234567890"
        });
        assert(badEmail.status === 400, "Rejects invalid email format");

        const noPhone = await request("POST", "/api/register", {
            name: "Test",
            email: "test_nophone@example.com",
            password: "password123",
            role: "household",
            contactNumber: ""
        });
        assert(noPhone.status === 400, "Rejects Household registration without contact number");

        // 3. Household Food Inventory
        console.log("\n3. Testing Household Food Inventory & Ownership Protections:");
        const addFood = await request("POST", "/api/foods", {
            name: "Fresh Spinach",
            quantity: 3,
            unit: "kg",
            expiryDate: "2026-10-20",
            category: "Vegetables"
        }, rahulToken);
        assert(addFood.status === 201, "Household user can add food to inventory");
        const foodId = addFood.body.food._id;

        const readFood = await request("GET", "/api/foods/rahul@gmail.com", null, rahulToken);
        assert(readFood.status === 200, "Household user can view their own inventory");

        const unauthorizedFoodRead = await request("GET", "/api/foods/rahul@gmail.com", null, sureshToken);
        assert(unauthorizedFoodRead.status === 403, "Another user cannot read Rahul's inventory (Returns 403)");

        const editFood = await request("PUT", `/api/foods/${foodId}`, {
            name: "Fresh Organic Spinach",
            quantity: 4,
            unit: "kg",
            expiryDate: "2026-10-21"
        }, rahulToken);
        assert(editFood.status === 200 && editFood.body.food.quantity === 4, "Owner can edit food item");

        const deleteFood = await request("DELETE", `/api/foods/${foodId}`, null, rahulToken);
        assert(deleteFood.status === 200, "Owner can delete food item");

        // 4. Farmer Crops
        console.log("\n4. Testing Farmer Crops & Ownership Protections:");
        const addCrop = await request("POST", "/api/crops", {
            name: "Golden Corn",
            quantity: 40,
            unit: "kg",
            date: "2026-10-28",
            location: "Pollachi Farm",
            description: "Freshly harvested golden corn"
        }, sureshToken);
        assert(addCrop.status === 201, "Farmer can add crop produce");
        const cropId = addCrop.body.crop._id;

        const editCrop = await request("PUT", `/api/crops/${cropId}`, {
            name: "Fresh Sweet Corn",
            quantity: 35
        }, sureshToken);
        assert(editCrop.status === 200 && editCrop.body.crop.name === "Fresh Sweet Corn", "Farmer can edit crop produce");

        const deleteCrop = await request("DELETE", `/api/crops/${cropId}`, null, sureshToken);
        assert(deleteCrop.status === 200, "Farmer can delete crop produce");

        // 5. Food Donation Lifecycle & Contact Privacy
        console.log("\n5. Testing Donation Lifecycle & Contact Number Privacy:");
        
        // 5.1 Test cannot donate expired food
        const expiredDonation = await request("POST", "/api/donations", {
            foodName: "Expired Milk",
            quantity: 2,
            unit: "litres",
            location: "RS Puram, Coimbatore",
            expiryDate: "2020-01-01",
            donationType: "free"
        }, rahulToken);
        assert(expiredDonation.status === 400, "Blocks donation of expired food item");

        // 5.2 Create valid value-based donation
        const createDonation = await request("POST", "/api/donations", {
            foodName: "Organic Mangoes",
            quantity: 15,
            unit: "kg",
            category: "Fruits",
            location: "RS Puram, Coimbatore",
            donationType: "value_based",
            expectedAmount: 450
        }, rahulToken);
        assert(createDonation.status === 201, "Donor creates value-based donation");
        const donationId = createDonation.body.donation._id;

        // 5.3 Privacy Check BEFORE Acceptance:
        // When NGO browses marketplace, donor contact MUST be masked!
        const browseMarketplace = await request("GET", `/api/donations/item/${donationId}`, null, ngoToken);
        assert(
            browseMarketplace.body.donorContact && browseMarketplace.body.donorContact.includes("revealed once"),
            "PRIVACY: Donor contact number is HIDDEN from NGO before acceptance"
        );

        // 5.4 NGO Requests Donation
        const requestDonation = await request("PUT", `/api/donations/${donationId}/request`, {
            notes: "We will collect with our distribution van."
        }, ngoToken);
        assert(requestDonation.status === 200, "NGO requests donation successfully");
        assert(requestDonation.body.donation.donationStatus === "requested", "Status updated to 'requested'");

        // 5.5 Duplicate Request Prevention
        const duplicateRequest = await request("PUT", `/api/donations/${donationId}/request`, {}, ngoToken);
        assert(duplicateRequest.status === 400, "Prevents duplicate active request while already requested");

        // 5.6 Non-owner cannot accept
        const unauthorizedAccept = await request("PUT", `/api/donations/${donationId}/accept`, { agreedAmount: 450 }, sureshToken);
        assert(unauthorizedAccept.status === 403, "Non-owner cannot accept donation request (Returns 403)");

        // 5.7 Donor Accepts Request
        const donorAccept = await request("PUT", `/api/donations/${donationId}/accept`, {
            agreedAmount: 400
        }, rahulToken);
        assert(donorAccept.status === 200, "Donor accepts request and agrees on reimbursement amount (₹400)");
        assert(donorAccept.body.donation.donationStatus === "accepted", "Status updated to 'accepted'");

        // 5.8 Privacy Check AFTER Acceptance:
        // Assigned NGO now has permission to view real donor contact number!
        const ngoViewAfterAccept = await request("GET", `/api/donations/item/${donationId}`, null, ngoToken);
        assert(
            ngoViewAfterAccept.body.donorContact === "+91 98765 43210",
            "PRIVACY: Real donor contact number is REVEALED to assigned NGO after acceptance"
        );

        // 5.9 Schedule Pickup
        const schedulePickup = await request("PUT", `/api/donations/${donationId}/schedule`, {
            pickupDate: "2026-10-15",
            pickupTime: "4:30 PM",
            pickupLocation: "RS Puram, Coimbatore"
        }, ngoToken);
        assert(schedulePickup.status === 200, "Pickup successfully scheduled");
        assert(schedulePickup.body.donation.donationStatus === "collection_scheduled", "Status updated to 'collection_scheduled'");

        // 5.10 Confirm Collection (only assigned NGO can confirm)
        const donorCollectFail = await request("PUT", `/api/donations/${donationId}/collect`, {}, rahulToken);
        assert(donorCollectFail.status === 403, "Donor cannot self-confirm NGO collection (Only assigned NGO can confirm)");

        const ngoConfirmCollect = await request("PUT", `/api/donations/${donationId}/collect`, {}, ngoToken);
        assert(ngoConfirmCollect.status === 200, "Assigned NGO confirms physical collection on site");
        assert(ngoConfirmCollect.body.donation.donationStatus === "collected", "Status updated to 'collected'");

        // 5.11 Record Payment
        const recordPayment = await request("PUT", `/api/donations/${donationId}/payment`, {
            method: "Direct Cash Reimbursement on Pickup"
        }, rahulToken);
        assert(recordPayment.status === 200, "Payment successfully recorded in audit trail");
        assert(recordPayment.body.donation.paymentStatus === "paid", "Payment status updated to 'paid'");

        // 5.12 Complete Donation & Generate Receipt
        const completeDonation = await request("PUT", `/api/donations/${donationId}/complete`, {}, rahulToken);
        assert(completeDonation.status === 200, "Donation completed successfully");
        assert(!!completeDonation.body.donation.receiptId, `Official receipt ID generated: ${completeDonation.body.donation.receiptId}`);
        assert(completeDonation.body.donation.timeline.length >= 6, "Full audit trail preserved with timeline events");

        // 5.13 Disallow Cancellation of Completed Donation
        const cancelCompleted = await request("PUT", `/api/donations/${donationId}/cancel`, {}, rahulToken);
        assert(cancelCompleted.status === 400, "Cannot cancel a completed/collected transaction");

        // 6. Test NGO Request Cancellation Workflow
        console.log("\n6. Testing Request Cancellation & Availability Restoration:");
        const testListing = await request("POST", "/api/donations", {
            foodName: "Surplus Apples",
            quantity: 5,
            unit: "kg",
            location: "Gandhipuram",
            donationType: "free"
        }, rahulToken);
        const testListingId = testListing.body.donation._id;

        await request("PUT", `/api/donations/${testListingId}/request`, {}, ngoToken);
        const ngoCancel = await request("PUT", `/api/donations/${testListingId}/cancel`, {
            reason: "Vehicle broke down"
        }, ngoToken);
        assert(ngoCancel.status === 200, "NGO can cancel their own pending request");
        assert(ngoCancel.body.donation.donationStatus === "available", "Listing returned safely to Available marketplace");

        console.log("\n==========================================");
        console.log(`Test Results: ${passed} passed, ${failed} failed`);
        console.log("==========================================");
    } catch (e) {
        console.error("Test execution error:", e);
    }
}

runTests();
