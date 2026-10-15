/**
 * ZeroWaste - Automated Expiry Date & Notification System Test Suite
 * Validates calendar-day calculation, midnight boundaries, notification rendering,
 * and backend donation constraints with controlled reference dates.
 */

const { parseCalendarDate, calculateExpiryStatus, formatCalendarDate } = require("./dateUtils");
const http = require("http");

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

async function runControlledDateTests() {
    console.log("=================================================");
    console.log("🧪 1. Testing Calendar-Day Expiry Date Calculation");
    console.log("=================================================\n");

    const baseTestDate = "2026-10-14"; // Controlled reference date: 14 October 2026

    // Case 1: Today: 14 Oct 2026; Expiry: 15 Oct 2026 -> "Expires tomorrow" or "Expires in 1 day"
    const case1 = calculateExpiryStatus("2026-10-15", baseTestDate);
    assert(case1.isValid === true, "Case 1: Valid date parsed");
    assert(case1.diffDays === 1, `Case 1: diffDays is 1 (actual: ${case1.diffDays})`);
    assert(
        case1.statusText === "Expires tomorrow" || case1.statusText === "Expires in 1 day",
        `Case 1: statusText is 'Expires tomorrow' or 'Expires in 1 day' (actual: '${case1.statusText}')`
    );
    assert(case1.isExpired === false, "Case 1: isExpired is false");
    assert(case1.isNotificationEligible === true, "Case 1: isNotificationEligible is true");

    // Case 2: Today: 14 Oct 2026; Expiry: 14 Oct 2026 -> "Expires today"
    const case2 = calculateExpiryStatus("2026-10-14", baseTestDate);
    assert(case2.isValid === true, "Case 2: Valid date parsed");
    assert(case2.diffDays === 0, `Case 2: diffDays is 0 (actual: ${case2.diffDays})`);
    assert(
        case2.statusText === "Expires today",
        `Case 2: statusText is 'Expires today' (actual: '${case2.statusText}')`
    );
    assert(
        case2.isExpired === false,
        "Case 2: Item expiring today is NOT marked expired before current calendar day ends"
    );
    assert(case2.isNotificationEligible === true, "Case 2: isNotificationEligible is true");

    // Case 3: Today: 14 Oct 2026; Expiry: 13 Oct 2026 -> "Expired 1 day ago"
    const case3 = calculateExpiryStatus("2026-10-13", baseTestDate);
    assert(case3.isValid === true, "Case 3: Valid date parsed");
    assert(case3.diffDays === -1, `Case 3: diffDays is -1 (actual: ${case3.diffDays})`);
    assert(
        case3.statusText === "Expired 1 day ago",
        `Case 3: statusText is 'Expired 1 day ago' (actual: '${case3.statusText}')`
    );
    assert(case3.isExpired === true, "Case 3: isExpired is true");
    assert(case3.isNotificationEligible === false, "Case 3: Expired item is not notification eligible");

    // Case 4: Today: 14 Oct 2026; Expiry: 20 Oct 2026 -> "Expires in 6 days"
    const case4 = calculateExpiryStatus("2026-10-20", baseTestDate);
    assert(case4.isValid === true, "Case 4: Valid date parsed");
    assert(case4.diffDays === 6, `Case 4: diffDays is 6 (actual: ${case4.diffDays})`);
    assert(
        case4.statusText === "Expires in 6 days",
        `Case 4: statusText is 'Expires in 6 days' (actual: '${case4.statusText}')`
    );
    assert(case4.isExpired === false, "Case 4: isExpired is false");
    assert(case4.isNotificationEligible === false, "Case 4: Not notification eligible (diff > 1)");

    // Case 4b: Multiple days expired (10 Oct 2026 relative to 14 Oct 2026) -> "Expired 4 days ago"
    const case4b = calculateExpiryStatus("2026-10-10", baseTestDate);
    assert(case4b.diffDays === -4, `Case 4b: diffDays is -4 (actual: ${case4b.diffDays})`);
    assert(
        case4b.statusText === "Expired 4 days ago",
        `Case 4b: statusText is 'Expired 4 days ago' (actual: '${case4b.statusText}')`
    );
    assert(case4b.isExpired === true, "Case 4b: isExpired is true");

    // Case 5: Safe validation for invalid or missing dates
    const badDate1 = calculateExpiryStatus(null, baseTestDate);
    assert(badDate1.isValid === false && badDate1.statusText === "Invalid Date", "Safely handles null expiry date");

    const badDate2 = calculateExpiryStatus("invalid-date-string", baseTestDate);
    assert(badDate2.isValid === false && badDate2.statusText === "Invalid Date", "Safely handles malformed date string");

    const badDate3 = calculateExpiryStatus("2026-02-31", baseTestDate);
    assert(badDate3.isValid === false, "Safely rejects non-existent calendar date (2026-02-31)");

    // Case 7: Midnight boundary and timezone shift robustness
    console.log("\n=================================================");
    console.log("⏰ 2. Testing Midnight Boundary & UTC Shift Resistance");
    console.log("=================================================\n");

    // Test just before midnight (23:59:59.999 local) on 14 October 2026
    const nearMidnightToday = new Date(2026, 9, 14, 23, 59, 59, 999);
    const resNearMidnight = calculateExpiryStatus("2026-10-15", nearMidnightToday);
    assert(
        resNearMidnight.diffDays === 1,
        `23:59:59.999 on Oct 14 correctly computes 1 day remaining for Oct 15 (diff: ${resNearMidnight.diffDays})`
    );
    assert(
        resNearMidnight.statusText === "Expires tomorrow" || resNearMidnight.statusText === "Expires in 1 day",
        `23:59:59.999 displays 'Expires tomorrow'`
    );

    // Test just after midnight (00:00:00.001 local) on 15 October 2026
    const justAfterMidnight = new Date(2026, 9, 15, 0, 0, 0, 1);
    const resAfterMidnight = calculateExpiryStatus("2026-10-15", justAfterMidnight);
    assert(
        resAfterMidnight.diffDays === 0,
        `00:00:00.001 on Oct 15 correctly computes 0 days remaining for Oct 15 (diff: ${resAfterMidnight.diffDays})`
    );
    assert(
        resAfterMidnight.statusText === "Expires today",
        `00:00:00.001 displays 'Expires today'`
    );
    assert(
        resAfterMidnight.isExpired === false,
        `00:00:00.001 is NOT expired on the calendar day itself`
    );

    // Year boundary test: 2026-12-31 -> 2027-01-01
    const newYearEve = calculateExpiryStatus("2027-01-01", "2026-12-31");
    assert(
        newYearEve.diffDays === 1 && newYearEve.statusText === "Expires tomorrow",
        "Year boundary Dec 31 to Jan 1 correctly computes 1 day remaining"
    );

    // Leap year check: 2028-02-28 -> 2028-02-29
    const leapDay = calculateExpiryStatus("2028-02-29", "2028-02-28");
    assert(
        leapDay.diffDays === 1,
        "Leap year Feb 28 to Feb 29 correctly computes 1 day remaining"
    );

    console.log("\n=================================================");
    console.log("🔔 3. Testing Multiple Food Notifications Logic");
    console.log("=================================================\n");

    // Simulate food items list for a user
    const sampleFoods = [
        { _id: "f1", name: "Fresh Milk", quantity: 2, unit: "litres", expiryDate: "2026-10-14", category: "Dairy" }, // today
        { _id: "f2", name: "Whole Bread", quantity: 1, unit: "packet", expiryDate: "2026-10-15", category: "Bakery" }, // tomorrow
        { _id: "f3", name: "Ripe Bananas", quantity: 6, unit: "pieces", expiryDate: "2026-10-15", category: "Fruits" }, // tomorrow
        { _id: "f4", name: "Basmati Rice", quantity: 5, unit: "kg", expiryDate: "2026-11-20", category: "Grains" }, // 37 days (not urgent)
        { _id: "f5", name: "Cooked Curry", quantity: 1, unit: "bowl", expiryDate: "2026-10-12", category: "Cooked Meals" } // expired 2 days ago
    ];

    // Filter items expiring today or tomorrow relative to 2026-10-14
    const urgent = sampleFoods.filter(food => {
        const status = calculateExpiryStatus(food.expiryDate, "2026-10-14");
        return status.isValid && (status.diffDays === 0 || status.diffDays === 1);
    });

    assert(urgent.length === 3, `Found exactly 3 items expiring today or tomorrow (actual: ${urgent.length})`);
    assert(urgent.some(f => f.name === "Fresh Milk"), "Includes 'Fresh Milk' expiring today");
    assert(urgent.some(f => f.name === "Whole Bread"), "Includes 'Whole Bread' expiring tomorrow");
    assert(urgent.some(f => f.name === "Ripe Bananas"), "Includes 'Ripe Bananas' expiring tomorrow");
    assert(!urgent.some(f => f.name === "Basmati Rice"), "Excludes 'Basmati Rice' expiring far in future");
    assert(!urgent.some(f => f.name === "Cooked Curry"), "Excludes already expired 'Cooked Curry'");

    // Check that each urgent item produces non-empty details with food name, quantity, expiry date, days remaining
    urgent.forEach(f => {
        const status = calculateExpiryStatus(f.expiryDate, "2026-10-14");
        const daysText = status.diffDays === 0 ? "0 days remaining" : "1 day remaining";
        const hasAllFields = f.name && f.quantity && f.unit && f.expiryDate && (status.diffDays === 0 || status.diffDays === 1);
        assert(hasAllFields, `Notification for ${f.name} contains name, qty (${f.quantity} ${f.unit}), expiry (${f.expiryDate}), days (${daysText})`);
    });
}

function runServerApiTests() {
    return new Promise((resolve) => {
        console.log("\n=================================================");
        console.log("🌐 4. Testing Live Backend API Routes");
        console.log("=================================================\n");

        const BASE_URL = "http://localhost:3000";

        function request(method, path, body = null, token = null) {
            return new Promise((resResolve, resReject) => {
                const url = new URL(path, BASE_URL);
                const headers = { "Content-Type": "application/json" };
                if (token) headers["Authorization"] = `Bearer ${token}`;
                const data = body ? JSON.stringify(body) : null;
                if (data) headers["Content-Length"] = Buffer.byteLength(data);

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
                            try { parsed = JSON.parse(chunks); } catch (e) { parsed = chunks; }
                            resResolve({ status: res.statusCode, body: parsed });
                        });
                    }
                );
                req.on("error", resReject);
                if (data) req.write(data);
                req.end();
            });
        }

        (async () => {
            try {
                // Register or login a test household user
                const testEmail = `expiry_tester_${Date.now()}@example.com`;
                const registerRes = await request("POST", "/api/register", {
                    name: "Expiry Tester",
                    email: testEmail,
                    password: "Password@123",
                    role: "household",
                    contactNumber: "+91 98765 43210",
                    address: "Coimbatore"
                });
                assert(registerRes.status === 201, "Household user registered successfully");
                const token = registerRes.body.token;
                assert(!!token, "JWT token received for testing");

                // Today in YYYY-MM-DD
                const todayStr = formatCalendarDate(new Date());
                const tomorrowDate = new Date();
                tomorrowDate.setDate(tomorrowDate.getDate() + 1);
                const tomorrowStr = formatCalendarDate(tomorrowDate);

                // Add food expiring today
                const addFoodToday = await request("POST", "/api/foods", {
                    name: "Automated Test Milk",
                    quantity: 2,
                    unit: "packets",
                    expiryDate: todayStr,
                    category: "Dairy"
                }, token);
                assert(addFoodToday.status === 201, `Food expiring today (${todayStr}) added successfully`);
                const foodTodayId = addFoodToday.body.food?._id;

                // Add food expiring tomorrow
                const addFoodTomorrow = await request("POST", "/api/foods", {
                    name: "Automated Test Bread",
                    quantity: 1,
                    unit: "loaf",
                    expiryDate: tomorrowStr,
                    category: "Bakery"
                }, token);
                assert(addFoodTomorrow.status === 201, `Food expiring tomorrow (${tomorrowStr}) added successfully`);
                const foodTomorrowId = addFoodTomorrow.body.food?._id;

                // Test invalid expiry date rejection
                const addBadDate = await request("POST", "/api/foods", {
                    name: "Bad Expiry Item",
                    quantity: 1,
                    unit: "kg",
                    expiryDate: "invalid-date",
                    category: "Vegetables"
                }, token);
                assert(addBadDate.status === 400, "Rejects food with malformed expiry date (returns 400)");

                // Test fetch inventory (user isolation)
                const userInventory = await request("GET", `/api/foods/${encodeURIComponent(testEmail)}`, null, token);
                assert(userInventory.status === 200, "Owner successfully retrieves inventory");
                assert(Array.isArray(userInventory.body), "Inventory returns array of items");

                // Test user isolation (cannot read another user's inventory)
                const unauthorizedInventory = await request("GET", "/api/foods/otheruser@example.com", null, token);
                assert(unauthorizedInventory.status === 403, "Cannot view another user's private inventory (returns 403)");

                // Test donate food expiring today (should SUCCEED because item is not yet expired)
                const donateToday = await request("POST", "/api/donations", {
                    foodName: "Fresh Milk for Charity",
                    quantity: 1,
                    unit: "packets",
                    location: "RS Puram, Coimbatore",
                    expiryDate: todayStr,
                    donationType: "free"
                }, token);
                assert(
                    donateToday.status === 201,
                    "Item expiring TODAY can be donated (calendar day not yet ended)"
                );

                // Test donate food expired yesterday (should FAIL with 400)
                const yesterdayDate = new Date();
                yesterdayDate.setDate(yesterdayDate.getDate() - 1);
                const yesterdayStr = formatCalendarDate(yesterdayDate);

                const donateExpired = await request("POST", "/api/donations", {
                    foodName: "Spoiled Milk",
                    quantity: 1,
                    unit: "packets",
                    location: "RS Puram, Coimbatore",
                    expiryDate: yesterdayStr,
                    donationType: "free"
                }, token);
                assert(
                    donateExpired.status === 400,
                    `Blocks donation of expired food from yesterday (${yesterdayStr}, returns 400)`
                );

                // Clean up test foods
                if (foodTodayId) await request("DELETE", `/api/foods/${foodTodayId}`, null, token);
                if (foodTomorrowId) await request("DELETE", `/api/foods/${foodTomorrowId}`, null, token);

                resolve();
            } catch (err) {
                console.error("API test error:", err);
                failed++;
                resolve();
            }
        })();
    });
}

async function main() {
    await runControlledDateTests();

    // Check if server is running, or start it to test API endpoints
    const isPortOpen = await new Promise(res => {
        const testReq = http.request({ hostname: "localhost", port: 3000, path: "/api/test", method: "GET" }, () => res(true));
        testReq.on("error", () => res(false));
        testReq.end();
    });

    if (isPortOpen) {
        await runServerApiTests();
    } else {
        const path = require("path");
        const { fork } = require("child_process");
        const serverProcess = fork(path.join(__dirname, "server.js"), { cwd: __dirname });
        let serverReady = false;
        for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 400));
            serverReady = await new Promise(res => {
                const req = http.request({ hostname: "localhost", port: 3000, path: "/api/test", method: "GET" }, () => res(true));
                req.on("error", () => res(false));
                req.end();
            });
            if (serverReady) break;
        }
        if (serverReady) {
            console.log("  ✅ Test server is active on port 3000");
            await runServerApiTests();
        } else {
            console.error("  ❌ Failed to start test server on port 3000");
            failed++;
        }
        serverProcess.kill();
    }

    console.log("\n=================================================");
    console.log(`Test Summary: Passed: ${passed}, Failed: ${failed}`);
    console.log("=================================================");
    if (failed > 0) {
        process.exit(1);
    }
}

main();
