const http = require("http");
const assert = require("assert");

const BASE = "http://localhost:3000";

function apiRequest(path, method = "GET", data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                "Content-Type": "application/json"
            }
        };

        if (token) {
            options.headers["Authorization"] = `Bearer ${token}`;
        }

        const bodyData = data ? JSON.stringify(data) : null;
        if (bodyData) {
            options.headers["Content-Length"] = Buffer.byteLength(bodyData);
        }

        const req = http.request(options, (res) => {
            let resBody = "";
            res.on("data", chunk => resBody += chunk);
            res.on("end", () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(resBody);
                } catch (e) {
                    parsed = resBody;
                }
                resolve({ status: res.statusCode, data: parsed });
            });
        });

        req.on("error", reject);
        if (bodyData) {
            req.write(bodyData);
        }
        req.end();
    });
}

async function runTests() {
    console.log("=================================================");
    console.log("🧪 TESTING DONATION REMOVAL & STATUS SYNCHRONIZATION");
    console.log("=================================================\n");

    const stamp = Date.now();
    const householdEmail = `test_house_${stamp}@example.com`;
    const farmerEmail = `test_farm_${stamp}@example.com`;
    const ngoEmail = `test_ngo_${stamp}@example.com`;

    // 1. Register users
    console.log("1. Setting up test accounts (Household, Farmer, NGO)...");
    const regHouse = await apiRequest("/api/register", "POST", {
        name: "Test Household",
        email: householdEmail,
        password: "password123",
        role: "household",
        contactNumber: "+91 99999 11111",
        address: "123 Green Street, Coimbatore"
    });
    assert.strictEqual(regHouse.status, 201, "Household registration must succeed");
    const houseToken = regHouse.data.token;
    console.log("  ✅ Household user registered successfully");

    const regFarmer = await apiRequest("/api/register", "POST", {
        name: "Test Farmer",
        email: farmerEmail,
        password: "password123",
        role: "farmer",
        contactNumber: "+91 99999 22222",
        address: "Pollachi Farm Sector, Coimbatore"
    });
    assert.strictEqual(regFarmer.status, 201, "Farmer registration must succeed");
    const farmerToken = regFarmer.data.token;
    console.log("  ✅ Farmer user registered successfully");

    const regNgo = await apiRequest("/api/register", "POST", {
        name: "Test Community NGO",
        email: ngoEmail,
        password: "password123",
        role: "ngo",
        contactNumber: "+91 99999 33333",
        address: "ZeroWaste Center, Coimbatore"
    });
    assert.strictEqual(regNgo.status, 201, "NGO registration must succeed");
    const ngoToken = regNgo.data.token;
    console.log("  ✅ NGO user registered successfully");

    // 2. Household adds food and creates active donation
    console.log("\n2. Testing Household Food Deletion & Active Donation Synchronization...");
    const addFoodRes = await apiRequest("/api/foods", "POST", {
        name: "Fresh Red Apples",
        quantity: 5,
        unit: "kg",
        expiryDate: "2026-10-25",
        category: "Fruits"
    }, houseToken);
    assert.strictEqual(addFoodRes.status, 201, "Food creation must succeed");
    const foodId = addFoodRes.data.food._id;
    console.log(`  ✅ Food item created with ID: ${foodId}`);

    const createDonationRes = await apiRequest("/api/donations", "POST", {
        foodId: foodId,
        foodName: "Fresh Red Apples",
        quantity: 5,
        unit: "kg",
        category: "Fruits",
        location: "123 Green Street, Coimbatore",
        pickupLocation: "123 Green Street, Coimbatore",
        description: "Fresh surplus apples",
        donationType: "free"
    }, houseToken);
    assert.strictEqual(createDonationRes.status, 201, "Food donation creation must succeed");
    const donationId = createDonationRes.data.donation._id;
    console.log(`  ✅ Active food donation listed with ID: ${donationId}`);

    // Verify Available Food endpoint returns it
    const availBefore = await apiRequest("/api/donations?status=available", "GET", null, ngoToken);
    const foundInAvailBefore = availBefore.data.find(d => String(d._id) === String(donationId));
    assert(foundInAvailBefore, "Donation must initially appear in Available Food");
    console.log("  ✅ Food donation is visible in NGO Available Food list");

    // Delete the food item from inventory
    const delFoodRes = await apiRequest(`/api/foods/${foodId}`, "DELETE", null, houseToken);
    assert.strictEqual(delFoodRes.status, 200, "Food deletion must succeed");
    console.log("  ✅ Food item deleted from household inventory");

    // Verify donation record is NOT deleted, but updated to "Removed by User"
    const userDonationsRes = await apiRequest(`/api/donations/user/${encodeURIComponent(householdEmail)}`, "GET", null, houseToken);
    const updatedDonation = userDonationsRes.data.find(d => String(d._id) === String(donationId));
    assert(updatedDonation, "Donation record MUST be preserved in database as history");
    assert.strictEqual(updatedDonation.donationStatus, "removed_by_user", "Donation donationStatus must be 'removed_by_user'");
    assert.strictEqual(updatedDonation.status, "Removed by User", "Donation status must be 'Removed by User'");
    console.log(`  ✅ Donation preserved as history with status: '${updatedDonation.status}' ('${updatedDonation.donationStatus}')`);

    // Verify NGO dashboard Available Food NO LONGER lists it
    const availAfter = await apiRequest("/api/donations?status=available", "GET", null, ngoToken);
    const foundInAvailAfter = availAfter.data.find(d => String(d._id) === String(donationId));
    assert(!foundInAvailAfter, "Removed donation must NO LONGER appear in Available Food");
    console.log("  ✅ NGO Available Food list no longer contains the removed donation");

    // Verify NGO CANNOT request the removed donation
    const requestAttempt = await apiRequest(`/api/donations/${donationId}/request`, "PUT", { notes: "Trying to collect" }, ngoToken);
    assert.strictEqual(requestAttempt.status, 400, "Requesting a removed donation must return HTTP 400");
    console.log("  ✅ NGO blocked from requesting removed donation (returned 400: " + requestAttempt.data.message + ")");

    // 3. Testing NGO Remove Button & Authorization
    console.log("\n3. Testing NGO Removal Button & Authorization...");
    // Create another food item & donation
    const addFoodRes2 = await apiRequest("/api/foods", "POST", {
        name: "Organic Spinach",
        quantity: 2,
        unit: "bunches",
        expiryDate: "2026-10-22",
        category: "Vegetables"
    }, houseToken);
    const foodId2 = addFoodRes2.data.food._id;

    const createDonationRes2 = await apiRequest("/api/donations", "POST", {
        foodId: foodId2,
        foodName: "Organic Spinach",
        quantity: 2,
        unit: "bunches",
        category: "Vegetables",
        location: "123 Green Street, Coimbatore",
        pickupLocation: "123 Green Street, Coimbatore",
        donationType: "free"
    }, houseToken);
    const donationId2 = createDonationRes2.data.donation._id;
    console.log(`  ✅ New food donation listed with ID: ${donationId2}`);

    // Non-NGO tries to remove -> Forbidden
    const unauthRemove = await apiRequest(`/api/donations/${donationId2}/remove`, "PUT", { reason: "Testing unauth" }, houseToken);
    assert.strictEqual(unauthRemove.status, 403, "Household user must be forbidden from removing donations via NGO endpoint");
    console.log("  ✅ Non-NGO account blocked from removing donation (returned 403)");

    // Authorized NGO removes the donation
    const ngoRemove = await apiRequest(`/api/donations/${donationId2}/remove`, "PUT", { reason: "Duplicate or unfit for distribution" }, ngoToken);
    assert.strictEqual(ngoRemove.status, 200, "Authorized NGO removal must succeed");
    assert.strictEqual(ngoRemove.data.donation.donationStatus, "removed_by_ngo", "Status must update to 'removed_by_ngo'");
    console.log("  ✅ Authorized NGO removed donation successfully (Status: " + ngoRemove.data.donation.status + ")");

    // Verify Available Food no longer returns it
    const availAfterNgoRemove = await apiRequest("/api/donations?status=available", "GET", null, ngoToken);
    const foundNgoRemoved = availAfterNgoRemove.data.find(d => String(d._id) === String(donationId2));
    assert(!foundNgoRemoved, "Donation removed by NGO must not appear in Available Food");
    console.log("  ✅ Donation removed by NGO no longer appears in Available Food");

    // Verify donation is still in database history
    const userDonationsRes2 = await apiRequest(`/api/donations/user/${encodeURIComponent(householdEmail)}`, "GET", null, houseToken);
    const preservedDonation2 = userDonationsRes2.data.find(d => String(d._id) === String(donationId2));
    assert(preservedDonation2, "Donation removed by NGO must remain in database history");
    assert.strictEqual(preservedDonation2.status, "Removed by NGO");
    console.log("  ✅ Donation remains in history with status 'Removed by NGO'");

    // 4. Farmer Crop Deletion & Active Crop Donation Synchronization
    console.log("\n4. Testing Farmer Crop Deletion & Crop Donation Synchronization...");
    const addCropRes = await apiRequest("/api/crops", "POST", {
        name: "Golden Wheat Grain",
        quantity: 50,
        unit: "kg",
        date: "2026-10-15",
        location: "Pollachi Farm Sector, Coimbatore",
        description: "Freshly harvested wheat"
    }, farmerToken);
    assert.strictEqual(addCropRes.status, 201, "Crop creation must succeed");
    const cropId = addCropRes.data.crop._id;
    console.log(`  ✅ Farmer crop produce added with ID: ${cropId}`);

    const createCropDonationRes = await apiRequest("/api/crop-donations", "POST", {
        cropId: cropId,
        cropName: "Golden Wheat Grain",
        quantity: 50,
        unit: "kg",
        category: "Crops & Harvest",
        location: "Pollachi Farm Sector, Coimbatore",
        pickupLocation: "Pollachi Farm Sector, Coimbatore",
        donationType: "free"
    }, farmerToken);
    assert.strictEqual(createCropDonationRes.status, 201, "Crop donation creation must succeed");
    const cropDonationId = createCropDonationRes.data.donation._id;
    console.log(`  ✅ Active crop donation listed with ID: ${cropDonationId}`);

    // Verify Available Crops endpoint returns it
    const availCropsBefore = await apiRequest("/api/crop-donations?status=available", "GET", null, ngoToken);
    const foundCropAvailBefore = availCropsBefore.data.find(d => String(d._id) === String(cropDonationId));
    assert(foundCropAvailBefore, "Crop donation must initially appear in Available Crops");
    console.log("  ✅ Crop donation is visible in NGO Available Crops list");

    // Delete the crop produce
    const delCropRes = await apiRequest(`/api/crops/${cropId}`, "DELETE", null, farmerToken);
    assert.strictEqual(delCropRes.status, 200, "Crop deletion must succeed");
    console.log("  ✅ Crop produce deleted by farmer");

    // Verify crop donation record is NOT deleted, but updated to "Removed by User"
    const farmerCropsRes = await apiRequest(`/api/crop-donations/user/${encodeURIComponent(farmerEmail)}`, "GET", null, farmerToken);
    const updatedCropDonation = farmerCropsRes.data.find(d => String(d._id) === String(cropDonationId));
    assert(updatedCropDonation, "Crop donation record MUST be preserved in database as history");
    assert.strictEqual(updatedCropDonation.donationStatus, "removed_by_user");
    assert.strictEqual(updatedCropDonation.status, "Removed by User");
    console.log(`  ✅ Crop donation preserved as history with status: '${updatedCropDonation.status}'`);

    // Verify NGO dashboard Available Crops NO LONGER lists it
    const availCropsAfter = await apiRequest("/api/crop-donations?status=available", "GET", null, ngoToken);
    const foundCropAvailAfter = availCropsAfter.data.find(d => String(d._id) === String(cropDonationId));
    assert(!foundCropAvailAfter, "Removed crop donation must NO LONGER appear in Available Crops");
    console.log("  ✅ NGO Available Crops list no longer contains the removed crop donation");

    // Verify NGO CANNOT request the removed crop donation
    const requestCropAttempt = await apiRequest(`/api/crop-donations/${cropDonationId}/request`, "PUT", { notes: "Trying to collect" }, ngoToken);
    assert.strictEqual(requestCropAttempt.status, 400, "Requesting a removed crop donation must return HTTP 400");
    console.log("  ✅ NGO blocked from requesting removed crop donation (returned 400)");

    console.log("\n=================================================");
    console.log("🎉 ALL TESTS PASSED! Donation removal & sync verified.");
    console.log("=================================================");
}

runTests().catch(err => {
    console.error("❌ Test failed:", err);
    process.exit(1);
});
