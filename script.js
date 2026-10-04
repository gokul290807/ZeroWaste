/* =========================
   ECO MIND AI
   MAIN JAVASCRIPT
========================= */


/* =========================
   HOME PAGE
========================= */

function getStarted() {

    window.location.href = "register.html";

}


function learnMore() {

    const aboutSection = document.getElementById("about");

    if (aboutSection) {

        aboutSection.scrollIntoView({
            behavior: "smooth"
        });

    }

}


/* =========================
   LOGIN
========================= */

async function loginUser(event) {

    event.preventDefault();

    const email =
        document.getElementById("email").value;

    const password =
        document.getElementById("password").value;


    try {

        const response =
            await fetch("https://zerowaste-umw9.onrender.com/api/login", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    email: email,

                    password: password

                })

            });


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                "❌ " + data.message
            );

            return;

        }


        /* Save logged-in user for dashboard */

        localStorage.setItem(
            "ecoMindUser",
            JSON.stringify(data.user)
        );


        alert(
            "✅ Login successful!\n\n" +
            "Welcome to ZeroWaste, " +
            data.user.name
        );


        window.location.href =
            "dashboard.html";


    } catch (error) {

        console.log(
            "Login error:",
            error
        );

        alert(
            "❌ Cannot connect to ZeroWaste backend.\n\n" +
            "Please make sure the backend is running."
        );

    }

}
/* =========================
   REGISTER
========================= */

async function registerUser(event) {

    event.preventDefault();

    const name =
        document.getElementById("name").value;

    const email =
        document.getElementById("registerEmail").value;

    const password =
        document.getElementById("registerPassword").value;

    const role =
        document.getElementById("role").value;


    try {

        const response =
            await fetch("https://zerowaste-umw9.onrender.com/api/register", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    name: name,

                    email: email,

                    password: password,

                    role: role

                })

            });


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                "❌ " + data.message
            );

            return;

        }


        /* Save user locally for the current dashboard */

        const user = {

            name: name,

            email: email,

            role: role

        };


        localStorage.setItem(
            "ecoMindUser",
            JSON.stringify(user)
        );


        alert(
            "✅ Account created successfully!\n\n" +
            "Welcome, " +
            name +
            "!"
        );


        window.location.href =
            "dashboard.html";


    } catch (error) {

        console.log(
            "Registration error:",
            error
        );

        alert(
            "❌ Cannot connect to ZeroWaste backend.\n\n" +
            "Please make sure the backend is running."
        );

    }

}


/* =========================
   DASHBOARD
========================= */

function loadDashboard() {

    const user =
        JSON.parse(localStorage.getItem("ecoMindUser"));


    // If there is no logged-in user
    if (!user) {

        window.location.href = "login.html";

        return;

    }


    // Show user's name
    const welcomeMessage =
        document.getElementById("welcomeMessage");

    if (welcomeMessage) {

        welcomeMessage.textContent =
            "Welcome, " + user.name + "!";

    }


    // Show user's role
    const roleMessage =
        document.getElementById("roleMessage");

    if (roleMessage) {

        roleMessage.textContent =
            "You are logged in as " +
            user.role +
            ".";

    }


    // =========================
    // ROLE-BASED DASHBOARD
    // =========================

    const householdFeatures =
        document.getElementById("householdFeatures");

    const farmerFeatures =
        document.getElementById("farmerFeatures");

    const ngoFeatures =
        document.getElementById("ngoFeatures");

    const donationsShortcutCard =
        document.getElementById("donationsShortcutCard");

    const aiShortcutCard =
        document.getElementById("aiShortcutCard");

    const saveFoodShortcutCard =
        document.getElementById("saveFoodShortcutCard");

    const donationSection =
        document.querySelector(".donation-section");

    const householdFoodSection =
        document.getElementById("householdFoodSection");

    const householdInventorySection =
        document.getElementById("householdInventorySection");

    const householdStatsSection =
        document.getElementById("householdStatsSection");

    const householdAISection =
        document.getElementById("householdAISection");


    // Hide all role sections first

    if (householdFeatures) {

        householdFeatures.style.display =
            "none";

    }

    if (farmerFeatures) {

        farmerFeatures.style.display =
            "none";

    }

    if (ngoFeatures) {

        ngoFeatures.style.display =
            "none";

    }

    if (donationsShortcutCard) {
        donationsShortcutCard.style.display =
            "none";
    }

    if (aiShortcutCard) {
        aiShortcutCard.style.display =
            "none";
    }

    if (saveFoodShortcutCard) {
        saveFoodShortcutCard.style.display =
            "none";
    }

    if (donationSection) {
        donationSection.style.display = 
            "none";
    }
    if (householdFoodSection){
        householdFoodSection.style.display = 
            "none";
    }
    if (householdInventorySection){
        householdInventorySection.style.display = 
            "none";
    }
    if (householdStatsSection){
    householdStatsSection.style.display = "none";
    }
    if (householdAISection){
    householdAISection.style.display = "none";
    }

    // Show the correct section

    if (user.role === "household") {

    if (donationsShortcutCard) {
        donationsShortcutCard.style.display =
            "block";
    }

    if (aiShortcutCard) {
        aiShortcutCard.style.display =
            "block";
    }

    if (saveFoodShortcutCard) {
        saveFoodShortcutCard.style.display =
            "block";
    }

    if (householdFeatures) {

        householdFeatures.style.display =
            "block";

    }

    if (donationSection) {

        donationSection.style.display =
            "block";

    }

    if (householdFoodSection) {
        householdFoodSection.style.display = 
            "block";
    }

    if (householdInventorySection) {
        householdInventorySection.style.display = 
            "block";
    }

    if (householdStatsSection) {
    householdStatsSection.style.display = "grid";
    }

    if (householdAISection) {
    householdAISection.style.display = "block";
    }
}


    if (user.role === "farmer") {

        if (farmerFeatures) {

            farmerFeatures.style.display =
                "block";

        }

    }


    if (user.role === "ngo") {

        if (ngoFeatures) {

            ngoFeatures.style.display =
                "block";

        }

        if (donationsShortcutCard) {

            donationsShortcutCard.style.display =
                "none";

        }

        if (aiShortcutCard) {

            aiShortcutCard.style.display =
                "none";

        }

        if (saveFoodShortcutCard) {
            saveFoodShortcutCard.style.display = "none";
        }

    }

}

/* =========================
   LOGOUT
========================= */

function logoutUser() {

    localStorage.removeItem(
        "ecoMindUser"
    );


    window.location.href =
        "login.html";

}


/* =========================
   FOOD INVENTORY
========================= */

function openFoodInventory() {

    alert(
        "Food Inventory\n\n" +
        "This feature will be built next."
    );

}


/* =========================
   DONATIONS
========================= */

function openDonations() {

    const donationSection =
        document.querySelector(".donation-section");

    if (donationSection) {

        donationSection.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }

}

/* =========================
   AI SUGGESTION
========================= */

async function showAISuggestion() {

    const aiSection =
        document.getElementById("householdAISection");

    if (aiSection) {

        aiSection.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }

    await generateAISuggestion();

}


/* =========================
   ADD FOOD
========================= */

function addFood() {

    scrollToAddFood();

}


/* =========================
   DONATE FOOD
========================= */

function donateFood() {

    alert(
        "Donate Food\n\n" +
        "The donation system " +
        "will be added next."
    );

}


/* =========================
   AUTOMATIC DASHBOARD LOAD
========================= */

if (
    window.location.pathname.includes(
        "dashboard.html"
    )
) {

    loadDashboard();

}
/* =========================
   FOOD INVENTORY SYSTEM
========================= */


/* Save Food */

async function saveFood(event) {

    event.preventDefault();

    const foodName =
        document.getElementById("foodName").value;

    const foodQuantity =
        document.getElementById("foodQuantity").value;

    const foodUnit =
        document.getElementById("foodUnit").value;

    const foodExpiry =
        document.getElementById("foodExpiry").value;


    const user =
        JSON.parse(
            localStorage.getItem("ecoMindUser")
        );


    if (!user) {

        alert("Please login first.");

        return;

    }


    try {

        const response =
            await fetch(
                "https://zerowaste-umw9.onrender.com/api/foods",
                {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        userEmail: user.email,

                        name: foodName,

                        quantity: Number(foodQuantity),

                        unit: foodUnit,

                        expiryDate: foodExpiry,

                        category: "General"

                    })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                "❌ " + data.message
            );

            return;

        }


        alert(
            "Food added successfully! 🍎"
        );


        /* Clear form */

        document.getElementById("foodName").value = "";

        document.getElementById("foodQuantity").value = "";

        document.getElementById("foodUnit").value = "";

        document.getElementById("foodExpiry").value = "";


    } catch (error) {

        console.log(
            "Food saving error:",
            error
        );

        alert(
            "❌ Cannot connect to ZeroWaste backend."
        );

    }

}


/* Display Food */

async function displayFoodInventory() {

    const foodTable =
        document.getElementById(
            "foodInventory"
        );

    const emptyMessage =
        document.getElementById(
            "emptyInventory"
        );

    if (!foodTable) {
        return;
    }

    const user =
        JSON.parse(
            localStorage.getItem("ecoMindUser")
        );

    if (!user) {
        return;
    }

    try {

        const response =
            await fetch(
                "https://zerowaste-umw9.onrender.com/api/foods/" +
                encodeURIComponent(user.email)
            );

        const foodList =
            await response.json();

        if (!response.ok) {

            alert(
                "❌ " +
                (foodList.message ||
                "Unable to load food.")
            );

            return;
        }

        foodTable.innerHTML = "";

        /* No food */

        if (foodList.length === 0) {

            if (emptyMessage) {

                emptyMessage.style.display =
                    "block";

            }

            updateFoodStatistics();

            return;
        }

        if (emptyMessage) {

            emptyMessage.style.display =
                "none";

        }

        /* Display every food item */

        foodList.forEach(function(food) {

            const row =
                document.createElement("tr");

            const status =
                getFoodStatus(
                    food.expiryDate
                );

            row.innerHTML = `

                <td>
                    <strong>
                        ${food.name}
                    </strong>
                </td>

                <td>
                    ${food.quantity}
                    ${food.unit}
                </td>

                <td>
                    ${food.expiryDate}
                </td>

                <td>
                    <span class="${status.className}">
                        ${status.text}
                    </span>
                </td>

                <td>

                    <button
                        class="delete-food-btn"
                        onclick="deleteFood('${food._id}')">

                        Delete

                    </button>

                </td>

            `;

            foodTable.appendChild(row);

        });

        updateFoodStatistics();

    } catch (error) {

        console.log(
            "Food loading error:",
            error
        );

        alert(
            "❌ Cannot connect to ZeroWaste backend."
        );

    }

}


/* Calculate Food Status */

function getFoodStatus(expiryDate) {

    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const expiry =
        new Date(
            expiryDate + "T00:00:00"
        );


    const difference =
        expiry - today;


    const days =
        Math.ceil(
            difference /
            (1000 * 60 * 60 * 24)
        );


    /* Expired */

    if (days < 0) {

        return {

            text: "Expired",

            className:
                "status status-expired"

        };

    }


    /* Expiring within 3 days */

    if (days <= 3) {

        return {

            text:
                days === 0
                    ? "Expires Today"
                    : "Expiring Soon",

            className:
                "status status-warning"

        };

    }


    /* Fresh */

    return {

        text: "Fresh",

        className:
            "status status-fresh"

    };

}



/* Delete Food */

async function deleteFood(foodId) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this food?"
        );

    if (!confirmDelete) {
        return;
    }

    try {

        const response =
            await fetch(
                "https://zerowaste-umw9.onrender.com/api/foods/" +
                foodId,
                {
                    method: "DELETE"
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                "❌ " + data.message
            );

            return;
        }

        alert(
            "🗑️ Food deleted successfully!"
        );

        displayFoodInventory();

    } catch (error) {

        console.log(
            "Food deletion error:",
            error
        );

        alert(
            "❌ Cannot connect to ZeroWaste backend."
        );

    }

}



/* Update Statistics */

async function updateFoodStatistics() {

    const foodCount =
        document.getElementById("foodCount");

    const expiryCount =
        document.getElementById("expiryCount");

    const user =
        JSON.parse(
            localStorage.getItem("ecoMindUser")
        );

    if (!user) return;

    try {

        const response =
            await fetch(
                "https://zerowaste-umw9.onrender.com/api/foods/" +
                encodeURIComponent(user.email)
            );

        const foodList =
            await response.json();

        if (!response.ok) {
            console.log(
                "Statistics loading error:",
                foodList.message
            );
            return;
        }

        // Total food items
        if (foodCount) {
            foodCount.textContent =
                foodList.length;
        }

        // Count expiring food
        let expiringCount = 0;

        foodList.forEach(function(food) {

            const status =
                getFoodStatus(
                    food.expiryDate
                );

            if (
                status.text === "Expiring Soon" ||
                status.text === "Expires Today"
            ) {
                expiringCount++;
            }

        });

        if (expiryCount) {
            expiryCount.textContent =
                expiringCount;
        }

    } catch (error) {

        console.log(
            "Statistics error:",
            error
        );

    }
}


/* Scroll to Add Food */

function scrollToAddFood() {

    const foodSection =
        document.querySelector(
            ".food-section"
        );


    if (foodSection) {

        foodSection.scrollIntoView({

            behavior: "smooth"

        });

    }

}



/* Food Saving Tip */

function showFoodTip() {

    alert(
        "🌱 EcoMind Food Saving Tip\n\n" +

        "Check foods that are expiring soon " +
        "and use them first. This helps " +
        "reduce unnecessary food waste!"
    );

}



/* Load Inventory Automatically */

if (
    window.location.pathname.includes(
        "dashboard.html"
    )
) {

    displayFoodInventory();

}
/* =========================
   ECOMIND AI SUGGESTIONS
========================= */


/* Generate AI Suggestion */

async function generateAISuggestion() {

    const suggestionBox =
        document.getElementById(
            "aiSuggestionBox"
        );

    if (!suggestionBox) return;


    const user =
        JSON.parse(
            localStorage.getItem("ecoMindUser")
        );


    if (!user) return;


    try {

        const response =
            await fetch(
                "https://zerowaste-umw9.onrender.com/api/foods/" +
                encodeURIComponent(user.email)
            );


        const foodList =
            await response.json();


        if (!response.ok) {

            console.log(
                "AI food loading error:",
                foodList.message
            );

            return;

        }


        // No food

        if (foodList.length === 0) {

            suggestionBox.innerHTML = `

                <h3>🤖 ZeroWaste AI</h3>

                <p>

                    Your inventory is empty.

                    Add food items so ZeroWaste AI can

                    monitor expiry dates.

                </p>

            `;

            return;

        }


        // Find ALL foods expiring within 3 days

        const expiringFood =
            foodList.filter(function(food) {

                const days =
                    calculateDaysUntilExpiry(
                        food.expiryDate
                    );

                return days >= 0 && days <= 3;

            });


        // Find ALL expired foods

        const expiredFood =
            foodList.filter(function(food) {

                const days =
                    calculateDaysUntilExpiry(
                        food.expiryDate
                    );

                return days < 0;

            });


        // If expired food exists

        if (expiredFood.length > 0) {

            let expiredHTML = "";


            expiredFood.forEach(
                function(food) {

                    expiredHTML += `

                        <div
                            class="ai-food-item expired-item">

                            🚨
                            <strong>
                                ${food.name}
                            </strong>

                            <span>
                                Expired on
                                ${food.expiryDate}
                            </span>

                        </div>

                    `;

                }
            );


            suggestionBox.innerHTML = `

                <h3>
                    🚨 Expired Food Alert
                </h3>

                <p>

                    Please check these food items:

                </p>

                <div class="ai-food-list">

                    ${expiredHTML}

                </div>

            `;

            return;

        }


        // If food is expiring soon

        if (expiringFood.length > 0) {

            let expiringHTML = "";


            expiringFood.forEach(
                function(food) {

                    const days =
                        calculateDaysUntilExpiry(
                            food.expiryDate
                        );


                    let message = "";


                    if (days === 0) {

                        message =
                            "⚠️ Expires today";

                    }

                    else if (days === 1) {

                        message =
                            "🔔 Expires tomorrow";

                    }

                    else {

                        message =
                            "Expires in " +
                            days +
                            " days";

                    }


                    expiringHTML += `

                        <div
                            class="ai-food-item">

                            <strong>

                                ${food.name}

                            </strong>

                            <span>

                                ${food.quantity}
                                ${food.unit}

                            </span>

                            <span>

                                ${message}

                            </span>

                        </div>

                    `;

                }
            );


            suggestionBox.innerHTML = `

                <h3>

                    ⚠️ ZeroWaste AI —
                    Food Expiry Alert

                </h3>

                <p>

                    The following food items need
                    your attention:

                </p>

                <div class="ai-food-list">

                    ${expiringHTML}

                </div>

                <p>

                    💡 Consider using or donating
                    these foods before they expire.

                </p>

            `;

            return;

        }


        // Everything is fine

        suggestionBox.innerHTML = `

            <h3>

                ✅ Your inventory looks good!

            </h3>

            <p>

                No food items are expiring within
                the next 3 days.

            </p>

        `;


    } catch (error) {

        console.log(
            "AI suggestion error:",
            error
        );

    }

}

/* Calculate days until expiry */

function calculateDaysUntilExpiry(
    expiryDate
) {

    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const expiry =
        new Date(
            expiryDate +
            "T00:00:00"
        );


    const difference =
        expiry - today;


    return Math.ceil(
        difference /
        (1000 * 60 * 60 * 24)
    );

}



/* Display Expiry Alerts */

async function displayExpiryAlerts() {

    const alertContainer =
        document.getElementById(
            "expiryAlerts"
        );

    if (!alertContainer) {
        return;
    }

    const user =
        JSON.parse(
            localStorage.getItem("ecoMindUser")
        );

    if (!user) {
        return;
    }

    try {

        const response =
            await fetch(
                "https://zerowaste-umw9.onrender.com/api/foods/" +
                encodeURIComponent(user.email)
            );

        const foodList =
            await response.json();

        if (!response.ok) {

            console.log(
                "Expiry alert loading error:",
                foodList.message
            );

            return;
        }

        alertContainer.innerHTML = "";

        if (foodList.length === 0) {

            alertContainer.innerHTML = `

                <div class="no-expiry-alert">

                    No food items have been
                    added yet.

                </div>

            `;

            return;
        }

        let alertFound = false;

        foodList.forEach(
            function(food) {

                const status =
                    getFoodStatus(
                        food.expiryDate
                    );

                const days =
                    calculateDaysUntilExpiry(
                        food.expiryDate
                    );

                /* Expired */

                if (
                    status.text ===
                    "Expired"
                ) {

                    alertFound = true;

                    const alert =
                        document.createElement(
                            "div"
                        );

                    alert.className =
                        "expired-alert";

                    alert.innerHTML = `

                        <strong>
                            🚨 ${food.name}
                        </strong>

                        <p>
                            This food item has expired.
                            Please check it before use.
                        </p>

                    `;

                    alertContainer.appendChild(
                        alert
                    );

                }

                /* Expiring soon */

                else if (
                    status.text ===
                        "Expiring Soon" ||
                    status.text ===
                        "Expires Today"
                ) {

                    alertFound = true;

                    const alert =
                        document.createElement(
                            "div"
                        );

                    alert.className =
                        "expiry-alert";

                    let message = "";

                    if (days === 0) {

                        message =
                            "Expires today!";

                    }

                    else {

                        message =
                            "Expires in " +
                            days +
                            " day(s).";

                    }

                    alert.innerHTML = `

                        <strong>
                            ⚠️ ${food.name}
                        </strong>

                        <p>
                            ${message}
                            Consider using it soon
                            to reduce food waste.
                        </p>

                    `;

                    alertContainer.appendChild(
                        alert
                    );

                }

            }
        );

        /* No alerts */

        if (!alertFound) {

            alertContainer.innerHTML = `

                <div class="no-expiry-alert">

                    ✅ Great!
                    No food items are expiring
                    within the next 3 days.

                </div>

            `;

        }

    } catch (error) {

        console.log(
            "Expiry alert error:",
            error
        );

    }

}
async function notifyOneDayBeforeExpiry() {

    const user =
        JSON.parse(
            localStorage.getItem("ecoMindUser")
        );

    if (!user) {
        return;
    }

    try {

        const response =
            await fetch(
                "https://zerowaste-umw9.onrender.com/api/foods/" +
                encodeURIComponent(user.email)
            );

        const foodList =
            await response.json();

        if (!response.ok) {

            console.log(
                "Notification food loading error:",
                foodList.message
            );

            return;
        }

        foodList.forEach(function(food) {

            const days =
                calculateDaysUntilExpiry(
                    food.expiryDate
                );


            // Notify exactly one day before expiry
            if (days === 1) {

                const notificationKey =
                    "zeroWasteNotified_" +
                    food._id;


                // Prevent repeated notification
                if (
                    localStorage.getItem(
                        notificationKey
                    )
                ) {
                    return;
                }


                // Browser notification
                if ("Notification" in window) {

                    if (
                        Notification.permission ===
                        "granted"
                    ) {

                        new Notification(
                            "🔔 ZeroWaste - Expiry Alert",
                            {
                                body:
                                    food.name +
                                    " will expire tomorrow. " +
                                    "Consider using or donating it.",
                                icon: "🌱"
                            }
                        );

                    }

                }


                // Mark as notified
                localStorage.setItem(
                    notificationKey,
                    "true"
                );

            }

        });

    } catch (error) {

        console.log(
            "Expiry notification error:",
            error
        );

    }

}
// =========================
// FOOD DONATION SYSTEM
// =========================

async function loadDonationFood() {

    const donationFood =
        document.getElementById("donationFood");

    if (!donationFood) return;


    const user =
        JSON.parse(
            localStorage.getItem("ecoMindUser")
        );

    if (!user) return;


    try {

        const response =
            await fetch(
                "https://zerowaste-umw9.onrender.com/api/foods/" +
                encodeURIComponent(user.email)
            );


        const foodList =
            await response.json();


        if (!response.ok) {

            console.log(
                "Donation food loading error:",
                foodList.message
            );

            return;

        }


        // Keep the first option

        donationFood.innerHTML = `

            <option value="">
                Choose food from your inventory
            </option>

        `;


        foodList.forEach(function(food) {

            const option =
                document.createElement("option");


            option.value =
                food._id;


            option.textContent =
                food.name +
                " - " +
                food.quantity +
                " " +
                food.unit;


            donationFood.appendChild(
                option
            );

        });


    } catch (error) {

        console.log(
            "Donation food error:",
            error
        );

    }

}
async function submitDonation(event) {

    event.preventDefault();


    const foodId =
        document.getElementById("donationFood").value;

    const quantity =
        document.getElementById("donationQuantity").value;

    const unit =
        document.getElementById("donationUnit").value;

    const location =
        document.getElementById("donationLocation").value;

    const description =
        document.getElementById("donationDescription").value;


    if (!foodId) {

        alert("Please select a food item.");

        return;

    }


    const user =
        JSON.parse(
            localStorage.getItem("ecoMindUser")
        );


    if (!user) {

        alert("Please login first.");

        return;

    }


    try {

        // Get food from MongoDB

        const foodResponse =
            await fetch(
                "https://zerowaste-umw9.onrender.com/api/foods/" +
                encodeURIComponent(user.email)
            );


        const foodList =
            await foodResponse.json();


        if (!foodResponse.ok) {

            alert(
                "❌ " +
                (foodList.message ||
                "Unable to load food.")
            );

            return;

        }


        // Find selected food

        const selectedFood =
            foodList.find(function(food) {

                return food._id === foodId;

            });


        if (!selectedFood) {

            alert("Food item not found.");

            return;

        }


        // Save donation to MongoDB

        const donationResponse =
            await fetch(
                "https://zerowaste-umw9.onrender.com/api/donations",
                {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        userEmail: user.email,

                        foodId: selectedFood._id,

                        foodName: selectedFood.name,

                        quantity: Number(quantity),

                        unit: unit,

                        location: location,

                        description: description

                    })

                }
            );


        const donationData =
            await donationResponse.json();


        if (!donationResponse.ok) {

            alert(
                "❌ " +
                (donationData.message ||
                "Unable to create donation.")
            );

            return;

        }


        // Clear form

        document.getElementById(
            "donationFood"
        ).value = "";

        document.getElementById(
            "donationQuantity"
        ).value = "";

        document.getElementById(
            "donationUnit"
        ).value = "";

        document.getElementById(
            "donationLocation"
        ).value = "";

        document.getElementById(
            "donationDescription"
        ).value = "";


        alert(
            "🤝 Food donation created successfully!"
        );


        // Refresh donations

        displayDonations();


    } catch (error) {

        console.log(
            "Donation error:",
            error
        );

        alert(
            "❌ Cannot connect to ZeroWaste backend."
        );

    }

}
async function displayDonations() {

    const donationListContainer =
        document.getElementById("donationList");

    if (!donationListContainer) return;


    const user =
        JSON.parse(
            localStorage.getItem("ecoMindUser")
        );


    if (!user) return;


    try {

        const response =
            await fetch(
                "https://zerowaste-umw9.onrender.com/api/donations/" +
                encodeURIComponent(user.email)
            );


        const donationList =
            await response.json();


        if (!response.ok) {

            console.log(
                "Donation loading error:",
                donationList.message
            );

            return;

        }


        if (donationList.length === 0) {

            donationListContainer.innerHTML = `

                <p class="empty-donations">

                    You have not donated any food yet.

                </p>

            `;

            return;

        }


        donationListContainer.innerHTML = "";


        donationList.forEach(function(donation) {

            const donationCard =
                document.createElement("div");


            donationCard.className =
                "donation-card";


            donationCard.innerHTML = `

                <div class="donation-card-header">

                    <h4>
                        🍎 ${donation.foodName}
                    </h4>

                    <span class="donation-status">
                        ${donation.status}
                    </span>

                </div>


                <p>

                    <strong>Quantity:</strong>

                    ${donation.quantity}
                    ${donation.unit}

                </p>


                <p>

                    <strong>📍 Pickup:</strong>

                    ${donation.location}

                </p>


                <p>

                    <strong>📅 Date:</strong>

                    ${donation.date}

                </p>


                ${
                    donation.description
                    ?
                    `<p>

                        <strong>Description:</strong>

                        ${donation.description}

                    </p>`
                    :
                    ""
                }

            `;


            donationListContainer.appendChild(
                donationCard
            );

        });


    } catch (error) {

        console.log(
            "Donation loading error:",
            error
        );

    }

}
function viewAvailableDonations() {

    const ngoDonationArea =
        document.getElementById("ngoDonationArea");

    if (!ngoDonationArea) return;


    const donations =
        JSON.parse(
            localStorage.getItem("ecoMindDonations")
        ) || [];


    if (donations.length === 0) {

        ngoDonationArea.innerHTML = `

            <div class="ngo-empty-message">

                <h3>🥫 No Food Donations Available</h3>

                <p>
                    There are currently no food donations
                    available from households.
                </p>

            </div>

        `;

        return;
    }


    ngoDonationArea.innerHTML = `

        <h3>🥫 Available Food Donations</h3>

        <div class="ngo-donation-list"></div>

    `;


    const donationList =
        ngoDonationArea.querySelector(
            ".ngo-donation-list"
        );


    donations.forEach(function(donation) {

        const donationCard =
            document.createElement("div");

        donationCard.className =
            "donation-card";


        donationCard.innerHTML = `

            <div class="donation-card-header">

                <h4>
                    🍎 ${donation.foodName}
                </h4>

                <span class="donation-status">
                    ${donation.status}
                </span>

            </div>


            <p>
                <strong>Quantity:</strong>
                ${donation.quantity}
                ${donation.unit}
            </p>


            <p>
                <strong>📍 Pickup:</strong>
                ${donation.location}
            </p>


            <p>
                <strong>📅 Date:</strong>
                ${donation.date}
            </p>


            ${
                donation.description
                ?
                `<p>
                    <strong>Description:</strong>
                    ${donation.description}
                </p>`
                :
                ""
            }

        `;


        donationList.appendChild(
            donationCard
        );

    });


    ngoDonationArea.scrollIntoView({
        behavior: "smooth"
    });

}
function viewAvailableCropDonations() {

    const ngoDonationArea =
        document.getElementById("ngoDonationArea");

    if (!ngoDonationArea) return;


    const donations =
        JSON.parse(
            localStorage.getItem("ecoMindCropDonations")
        ) || [];


    if (donations.length === 0) {

        ngoDonationArea.innerHTML = `

            <div class="ngo-empty-message">

                <h3>🌾 No Crop Donations Available</h3>

                <p>
                    There are currently no crop donations
                    available from farmers.
                </p>

            </div>

        `;

        return;
    }


    ngoDonationArea.innerHTML = `

        <h3>🌾 Available Crop Donations</h3>

        <div class="ngo-crop-donation-list"></div>

    `;


    const donationList =
        ngoDonationArea.querySelector(
            ".ngo-crop-donation-list"
        );


    donations.forEach(function(donation) {

        const donationCard =
            document.createElement("div");

        donationCard.className =
            "donation-card";


        donationCard.innerHTML = `

            <div class="donation-card-header">

                <h4>
                    🌾 ${donation.cropName}
                </h4>

                <span class="donation-status">
                    ${donation.status}
                </span>

            </div>


            <p>
                <strong>Quantity:</strong>
                ${donation.quantity}
                ${donation.unit}
            </p>


            <p>
                <strong>📍 Pickup:</strong>
                ${donation.location}
            </p>


            <p>
                <strong>📅 Date:</strong>
                ${donation.date}
            </p>


            ${
                donation.description
                ?
                `<p>
                    <strong>Description:</strong>
                    ${donation.description}
                </p>`
                :
                ""
            }

        `;


        donationList.appendChild(
            donationCard
        );

    });


    ngoDonationArea.scrollIntoView({
        behavior: "smooth"
    });

}
// =========================
// FARMER CROPS
// =========================

async function saveFarmerCrop(event) {

    event.preventDefault();


    const name =
        document.getElementById("cropName").value;

    const quantity =
        document.getElementById("cropQuantity").value;

    const unit =
        document.getElementById("cropUnit").value;

    const date =
        document.getElementById("cropDate").value;

    const location =
        document.getElementById("cropLocation").value;

    const description =
        document.getElementById("cropDescription").value;


    const user =
        JSON.parse(
            localStorage.getItem("ecoMindUser")
        );


    if (!user) {

        alert("Please login first.");

        return;

    }


    try {

        const response =
            await fetch(
                "https://zerowaste-umw9.onrender.com/api/crops",
                {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        userEmail: user.email,

                        name: name,

                        quantity: Number(quantity),

                        unit: unit,

                        date: date,

                        location: location,

                        description: description

                    })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                "❌ " +
                (data.message ||
                "Unable to add crop.")
            );

            return;

        }


        event.target.reset();


        alert(
            "🌾 Crop added successfully!"
        );


    } catch (error) {

        console.log(
            "Crop saving error:",
            error
        );


        alert(
            "❌ Cannot connect to ZeroWaste backend."
        );

    }

}
async function displayFarmerCrops() {

    const cropList =
        document.getElementById(
            "farmerCropList"
        );

    if (!cropList) return;


    const user =
        JSON.parse(
            localStorage.getItem("ecoMindUser")
        );


    if (!user) return;


    try {

        const response =
            await fetch(
                "https://zerowaste-umw9.onrender.com/api/crops/" +
                encodeURIComponent(user.email)
            );


        const crops =
            await response.json();


        if (!response.ok) {

            console.log(
                "Crop loading error:",
                crops.message
            );

            return;

        }


        if (crops.length === 0) {

            cropList.innerHTML = `

                <p>
                    No crops added yet.
                </p>

            `;

            return;

        }


        cropList.innerHTML = "";


        crops.forEach(function(crop) {

            cropList.innerHTML += `

                <div class="crop-card">

                    <h4>
                        🌾 ${crop.name}
                    </h4>


                    <p>
                        Quantity:
                        ${crop.quantity}
                        ${crop.unit}
                    </p>


                    <p>
                        Location:
                        ${crop.location}
                    </p>


                    <p>
                        Available Until:
                        ${crop.date}
                    </p>


                    <p>
                        Status:
                        ${crop.status}
                    </p>


                    <button
                        class="delete-crop-button"
                        onclick="deleteFarmerCrop('${crop._id}')">

                        🗑️ Delete Crop

                    </button>


                </div>

            `;

        });


    } catch (error) {

        console.log(
            "Crop loading error:",
            error
        );

    }

}
async function deleteFarmerCrop(cropId) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this crop?"
        );


    if (!confirmDelete) {
        return;
    }


    try {

        const response =
            await fetch(
                "https://zerowaste-umw9.onrender.com/api/crops/" +
                cropId,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                "❌ " +
                (data.message ||
                "Unable to delete crop.")
            );

            return;

        }


        alert(
            "🌾 Crop deleted successfully!"
        );


        // Refresh My Crops

        displayFarmerCrops();


    } catch (error) {

        console.log(
            "Crop deletion error:",
            error
        );


        alert(
            "❌ Cannot connect to ZeroWaste backend."
        );

    }

}
function requestNotificationPermission() {

    if ("Notification" in window) {

        if (Notification.permission === "default") {

            Notification.requestPermission();

        }

    }

}
function openFarmerCropForm() {


    const farmerCropArea =
        document.getElementById("farmerCropArea");

    if (!farmerCropArea) {

        alert("❌ Crop section not found!");

        return;
    }

    farmerCropArea.style.display = "block";

    farmerCropArea.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}
async function showFarmerDonation() {

    const farmerDonationArea =
        document.getElementById("farmerDonationArea");

    if (!farmerDonationArea) return;


    const user =
        JSON.parse(
            localStorage.getItem("ecoMindUser")
        );


    if (!user) {

        alert("Please login first.");

        return;

    }


    try {

        // Get farmer crops from MongoDB

        const response =
            await fetch(
                "https://zerowaste-umw9.onrender.com/api/crops/" +
                encodeURIComponent(user.email)
            );


        const crops =
            await response.json();


        if (!response.ok) {

            alert(
                "❌ " +
                (crops.message ||
                "Unable to load crops.")
            );

            return;

        }


        if (crops.length === 0) {

            alert(
                "🌾 Please add a crop before donating."
            );

            return;

        }


        farmerDonationArea.innerHTML = `

            <div class="crop-form">

                <h3>🤝 Donate Unsold Crop</h3>


                <form
                    onsubmit="submitFarmerCropDonation(event)"
                >


                    <label>Select Crop</label>


                    <select
                        id="donationCrop"
                        required
                    >

                        <option value="">
                            Choose crop from your crops
                        </option>


                        ${crops.map(function(crop) {

                            return `

                                <option
                                    value="${crop._id}"
                                >

                                    ${crop.name}
                                    -
                                    ${crop.quantity}
                                    ${crop.unit}

                                </option>

                            `;

                        }).join("")}


                    </select>


                    <label>Pickup Location</label>


                    <input
                        type="text"
                        id="cropDonationLocation"
                        placeholder="Enter pickup location"
                        required
                    >


                    <label>Description</label>


                    <textarea
                        id="cropDonationDescription"
                        placeholder="Add information about the crop..."
                    ></textarea>


                    <button type="submit">

                        🤝 Donate Crop

                    </button>


                </form>

            </div>

        `;


        farmerDonationArea.scrollIntoView({

            behavior: "smooth"

        });


    } catch (error) {

        console.log(
            "Farmer donation crop loading error:",
            error
        );


        alert(
            "❌ Cannot connect to ZeroWaste backend."
        );

    }

}
async function submitFarmerCropDonation(event) {

    event.preventDefault();


    const cropId =
        document.getElementById("donationCrop").value;

    const location =
        document.getElementById(
            "cropDonationLocation"
        ).value;

    const description =
        document.getElementById(
            "cropDonationDescription"
        ).value;


    if (!cropId) {

        alert("Please select a crop.");

        return;

    }


    const user =
        JSON.parse(
            localStorage.getItem("ecoMindUser")
        );


    if (!user) {

        alert("Please login first.");

        return;

    }


    try {

        // Get farmer crops from MongoDB

        const cropResponse =
            await fetch(
                "https://zerowaste-umw9.onrender.com/api/crops/" +
                encodeURIComponent(user.email)
            );


        const crops =
            await cropResponse.json();


        if (!cropResponse.ok) {

            alert(
                "❌ " +
                (crops.message ||
                "Unable to load crops.")
            );

            return;

        }


        // Find selected crop

        const selectedCrop =
            crops.find(function(crop) {

                return crop._id === cropId;

            });


        if (!selectedCrop) {

            alert("Crop not found.");

            return;

        }


        // Save crop donation to MongoDB

        const donationResponse =
            await fetch(
                "https://zerowaste-umw9.onrender.com/api/crop-donations",
                {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        userEmail: user.email,

                        cropId: selectedCrop._id,

                        cropName: selectedCrop.name,

                        quantity: Number(
                            selectedCrop.quantity
                        ),

                        unit: selectedCrop.unit,

                        location: location,

                        description: description

                    })

                }
            );


        const donationData =
            await donationResponse.json();


        if (!donationResponse.ok) {

            alert(
                "❌ " +
                (donationData.message ||
                "Unable to create crop donation.")
            );

            return;

        }


        // Clear form

        document.getElementById(
            "donationCrop"
        ).value = "";

        document.getElementById(
            "cropDonationLocation"
        ).value = "";

        document.getElementById(
            "cropDonationDescription"
        ).value = "";


        alert(
            "🤝 Crop donation created successfully!"
        );


        // Refresh crop list

        displayFarmerCrops();
        displayCropDonations();


    } catch (error) {

        console.log(
            "Crop donation error:",
            error
        );


        alert(
            "❌ Cannot connect to ZeroWaste backend."
        );

    }

}
async function displayCropDonations() {

    const farmerDonationArea =
        document.getElementById("farmerDonationArea");

    if (!farmerDonationArea) return;

    const user =
        JSON.parse(
            localStorage.getItem("ecoMindUser")
        );

    if (!user) return;

    try {

        const response =
            await fetch(
                "https://zerowaste-umw9.onrender.com/api/crop-donations/" +
                encodeURIComponent(user.email)
            );

        const cropDonations =
            await response.json();

        if (!response.ok) {

            console.log(
                "Crop donation loading error:",
                cropDonations.message
            );

            return;
        }

        if (cropDonations.length === 0) {

            farmerDonationArea.innerHTML = `
                <div class="crop-form">
                    <h3>🤝 My Crop Donations</h3>

                    <p>
                        You have not donated any crops yet.
                    </p>
                </div>
            `;

            return;
        }

        farmerDonationArea.innerHTML = `
            <div class="crop-form">

                <h3>🤝 My Crop Donations</h3>

                <div id="cropDonationList"></div>

            </div>
        `;

        const cropDonationList =
            document.getElementById(
                "cropDonationList"
            );

        cropDonations.forEach(function(donation) {

            const donationCard =
                document.createElement("div");

            donationCard.className =
                "crop-card";

            donationCard.innerHTML = `
                <h4>
                    🌾 ${donation.cropName}
                </h4>

                <p>
                    <strong>Quantity:</strong>
                    ${donation.quantity}
                    ${donation.unit}
                </p>

                <p>
                    <strong>📍 Pickup:</strong>
                    ${donation.location}
                </p>

                <p>
                    <strong>📅 Date:</strong>
                    ${donation.date}
                </p>

                <p>
                    <strong>Status:</strong>
                    ${donation.status}
                </p>

                ${
                    donation.description
                    ?
                    `<p>
                        <strong>Description:</strong>
                        ${donation.description}
                    </p>`
                    :
                    ""
                }
            `;

            cropDonationList.appendChild(
                donationCard
            );

        });

    } catch (error) {

        console.log(
            "Crop donation loading error:",
            error
        );

    }
}
async function displayNGOFoodDonations() {

    const ngoDonationArea =
        document.getElementById("ngoDonationArea");

    if (!ngoDonationArea) return;

    try {

        const response =
            await fetch(
                "https://zerowaste-umw9.onrender.com/api/donations"
            );

        const donations =
            await response.json();

        if (!response.ok) {

            console.log(
                "NGO donation loading error:",
                donations.message
            );

            return;
        }

        if (donations.length === 0) {

            ngoDonationArea.innerHTML = `
                <div class="crop-form">

                    <h3>🤝 Available Food Donations</h3>

                    <p>
                        No food donations are currently available.
                    </p>

                </div>
            `;

            return;
        }

        let donationHTML = `
            <div class="crop-form">

                <h3>🤝 Available Food Donations</h3>

                <div id="ngoFoodDonationList">
        `;

        donations.forEach(function(donation) {

            donationHTML += `
                <div class="crop-card">

                    <h4>
                        🍎 ${donation.foodName}
                    </h4>

                    <p>
                        <strong>Quantity:</strong>
                        ${donation.quantity}
                        ${donation.unit}
                    </p>

                    <p>
                        <strong>📍 Pickup:</strong>
                        ${donation.location}
                    </p>

                    <p>
                        <strong>📅 Date:</strong>
                        ${donation.date}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        ${donation.status}
                    </p>

                    ${
                        donation.description
                        ?
                        `<p>
                            <strong>Description:</strong>
                            ${donation.description}
                        </p>`
                        :
                        ""
                    }

                </div>
            `;

        });

        donationHTML += `
                </div>
            </div>
        `;

        ngoDonationArea.innerHTML = donationHTML;

    } catch (error) {

        console.log(
            "NGO food donation error:",
            error
        );

    }
}
async function displayNGOCropDonations() {

    const ngoFeatures =
        document.getElementById("ngoFeatures");

    if (!ngoFeatures) return;

    try {

        const response =
            await fetch(
                "https://zerowaste-umw9.onrender.com/api/crop-donations"
            );

        const cropDonations =
            await response.json();

        if (!response.ok) {

            console.log(
                "NGO crop donation loading error:",
                cropDonations.message
            );

            return;
        }

        if (cropDonations.length === 0) {

            ngoFeatures.innerHTML += `
                <div class="crop-form">
                    <h3>🌾 Available Crop Donations</h3>

                    <p>
                        No crop donations are currently available.
                    </p>
                </div>
            `;

            return;
        }

        let cropHTML = `
            <div class="crop-form">

                <h3>🌾 Available Crop Donations</h3>

                <div id="ngoCropDonationList">
        `;

        cropDonations.forEach(function(donation) {

            cropHTML += `
                <div class="crop-card">

                    <h4>
                        🌾 ${donation.cropName}
                    </h4>

                    <p>
                        <strong>Quantity:</strong>
                        ${donation.quantity}
                        ${donation.unit}
                    </p>

                    <p>
                        <strong>📍 Pickup:</strong>
                        ${donation.location}
                    </p>

                    <p>
                        <strong>📅 Date:</strong>
                        ${donation.date}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        ${donation.status}
                    </p>

                    ${
                        donation.description
                        ?
                        `<p>
                            <strong>Description:</strong>
                            ${donation.description}
                        </p>`
                        :
                        ""
                    }

                </div>
            `;

        });

        cropHTML += `
                </div>
            </div>
        `;

        ngoFeatures.innerHTML += cropHTML;

    } catch (error) {

        console.log(
            "NGO crop donation error:",
            error
        );

    }
}
if (
    window.location.pathname.includes(
        "dashboard.html"
    )
) {

    loadDashboard();

    requestNotificationPermission();

    displayFoodInventory();

    generateAISuggestion();

    displayExpiryAlerts();

    notifyOneDayBeforeExpiry();

    loadDonationFood();

    displayDonations();

    displayFarmerCrops();

    

}
function previewDonationPhoto() {

    const photoInput =
        document.getElementById("donationPhoto");

    const preview =
        document.getElementById(
            "donationPhotoPreview"
        );

    if (!photoInput || !preview) {
        return;
    }

    const file =
        photoInput.files[0];

    if (!file) {
        preview.innerHTML = "";
        return;
    }

    const reader =
        new FileReader();

    reader.onload = function(event) {

        preview.innerHTML = `
            <img
                src="${event.target.result}"
                alt="Food preview"
                class="donation-preview-image">
        `;

    };

    reader.readAsDataURL(file);
}
function previewDonationPhoto() {

    const photoInput =
        document.getElementById("donationPhoto");

    const preview =
        document.getElementById(
            "donationPhotoPreview"
        );

    if (!photoInput || !preview) {
        return;
    }

    const file =
        photoInput.files[0];

    if (!file) {
        preview.innerHTML = "";
        return;
    }

    const reader =
        new FileReader();

    reader.onload = function(event) {

        preview.innerHTML = `
            <img
                src="${event.target.result}"
                alt="Food preview"
                class="donation-preview-image">
        `;

    };

    reader.readAsDataURL(file);
}