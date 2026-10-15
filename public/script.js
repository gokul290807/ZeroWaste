/**
 * ZeroWaste - Main Application JavaScript
 * Comprehensive Donation Value, Acceptance, Collection, Privacy & Payment Workflow
 */

// Render Deployed Backend API Endpoint
const DEPLOYED_BACKEND_URL = "https://zerowaste-umw9.onrender.com";

// Determine local vs production environment
const isLocalhost = Boolean(
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "[::1]"
);

// Dynamic API Base URL: Uses local server during development, or deployed Render backend in production
const API_BASE = isLocalhost
    ? (window.location.port === "3000" ? window.location.origin : "http://localhost:3000")
    : (window.location.protocol === "file:" || window.location.origin === "null")
        ? "http://localhost:3000"
        : DEPLOYED_BACKEND_URL;

console.log(`🌱 ZeroWaste loaded. Host: ${window.location.origin} | API Base: ${API_BASE}`);

// Current application state
let currentDonorFilter = "all";
let currentNgoTab = "available-food";
let ngoSearchQuery = "";
let cachedDonations = [];
let cachedCropDonations = [];
let cachedFoods = [];
let lastBrowserNotifiedFingerprint = "";
let dismissedNotificationFingerprint = "";

/* ========================================================
   DYNAMIC FOOD & CROP IMAGE MATCHING ENGINE
======================================================== */

// Map of canonical image filenames to matching keywords, synonyms, and spellings
const FOOD_IMAGE_MAP = [
    // BREAD / BAKERY
    {
        file: "bread.svg",
        keywords: [
            "bread", "breads", "loaf", "loaves", "toast", "bun", "buns", "baguette", 
            "croissant", "pav", "roti", "chapati", "chapathi", "paratha", "naan", 
            "flatbread", "bakery", "sandwich bread"
        ]
    },
    // MILK / LIQUID DAIRY
    {
        file: "milk.svg",
        keywords: [
            "milk", "cow milk", "buffalo milk", "dairy milk", "fresh milk", "toned milk", 
            "skimmed milk", "soymilk", "soy milk", "almond milk", "paal", "doodh"
        ]
    },
    // RICE (COOKED / GRAIN)
    {
        file: "rice.svg",
        keywords: [
            "rice", "white rice", "brown rice", "basmati", "ponni", "sona masoori", 
            "chawal", "arisi", "raw rice", "boiled rice", "steamed rice", "cooked rice"
        ]
    },
    // PADDY (CROP)
    {
        file: "paddy.svg",
        keywords: [
            "paddy", "dhan", "nel", "unhusked rice", "rough rice", "paddy crop"
        ]
    },
    // WHEAT
    {
        file: "wheat.svg",
        keywords: [
            "wheat", "gehun", "gothumai", "durum", "whole wheat", "wheat grain", "wheat crop"
        ]
    },
    // FLOUR
    {
        file: "flour.svg",
        keywords: [
            "flour", "atta", "aata", "maida", "besan", "wheat flour", "rice flour", "cornflour", "corn flour"
        ]
    },
    // EGGS
    {
        file: "eggs.svg",
        keywords: [
            "egg", "eggs", "anda", "muttai", "chicken egg", "poultry egg", "boiled egg"
        ]
    },
    // APPLES
    {
        file: "apple.svg",
        keywords: [
            "apple", "apples", "seb", "green apple", "red apple", "kashmiri apple", "shimla apple"
        ]
    },
    // BANANAS
    {
        file: "banana.svg",
        keywords: [
            "banana", "bananas", "kela", "kele", "vazhaipazham", "plantain", "plantains", 
            "raw banana", "yelakki", "robusta"
        ]
    },
    // TOMATOES
    {
        file: "tomatoes.svg",
        keywords: [
            "tomato", "tomatoes", "tamatar", "thakkali", "cherry tomato", "cherry tomatoes"
        ]
    },
    // POTATOES
    {
        file: "potato.svg",
        keywords: [
            "potato", "potatoes", "aloo", "aaloo", "urulaikizhangu", "baby potato", "sweet potato"
        ]
    },
    // ONIONS
    {
        file: "onion.svg",
        keywords: [
            "onion", "onions", "pyaz", "vengayam", "shallot", "shallots", "red onion", "white onion", "sambar onion"
        ]
    },
    // CARROTS
    {
        file: "carrot.svg",
        keywords: [
            "carrot", "carrots", "gajar"
        ]
    },
    // CORN / MAIZE
    {
        file: "corn.svg",
        keywords: [
            "corn", "sweet corn", "sweetcorn", "maize", "makka", "makki", "cholam", "baby corn", "popcorn"
        ]
    },
    // COCONUT
    {
        file: "coconut.svg",
        keywords: [
            "coconut", "coconuts", "nariyal", "thengai", "tender coconut", "dry coconut", "copra"
        ]
    },
    // SUGARCANE
    {
        file: "sugarcane.svg",
        keywords: [
            "sugarcane", "sugar cane", "cane", "ganna", "karumbu"
        ]
    },
    // MANGO
    {
        file: "mango.svg",
        keywords: [
            "mango", "mangoes", "aam", "mampazham", "maangai", "alphonso", "kesar", "banganapalli", "totapuri"
        ]
    },
    // ORANGE / CITRUS
    {
        file: "orange.svg",
        keywords: [
            "orange", "oranges", "santra", "mosambi", "citrus", "mandarin", "tangerine", "sweet lime"
        ]
    },
    // CHILI / PEPPER
    {
        file: "chili.svg",
        keywords: [
            "chili", "chilis", "chilli", "chillies", "mirch", "mirchi", "milagai", 
            "green chili", "red chili", "capsicum", "bell pepper"
        ]
    },
    // GROUNDNUT / PEANUTS
    {
        file: "groundnut.svg",
        keywords: [
            "groundnut", "groundnuts", "peanut", "peanuts", "moongfali", "verkadalai"
        ]
    },
    // PULSES / LENTILS / DAL
    {
        file: "pulses.svg",
        keywords: [
            "pulse", "pulses", "dal", "dhal", "daal", "lentil", "lentils", "toor dal", 
            "moong dal", "urad dal", "chana dal", "chana", "rajma", "gram", "beans", 
            "soybean", "soya bean", "paruppu", "peas", "green peas"
        ]
    },
    // BIRYANI
    {
        file: "biryani.svg",
        keywords: [
            "biryani", "briyani", "biriyani", "veg biryani", "vegetable biryani", "chicken biryani", 
            "mutton biryani", "pulao", "pulav", "fried rice"
        ]
    },
    // SPINACH / GREENS
    {
        file: "spinach.svg",
        keywords: [
            "spinach", "palak", "keerai", "greens", "leafy green", "lettuce", "methi", "fenugreek leaves"
        ]
    },
    // COTTON
    {
        file: "cotton.svg",
        keywords: [
            "cotton", "raw cotton", "cotton crop", "kapas", "paruthi"
        ]
    },
    // SUNFLOWER
    {
        file: "sunflower.svg",
        keywords: [
            "sunflower", "sunflower seed", "sunflower crop", "surajmukhi"
        ]
    },
    // TEA
    {
        file: "tea.svg",
        keywords: [
            "tea", "tea leaf", "tea leaves", "chai", "green tea"
        ]
    },
    // COFFEE
    {
        file: "coffee.svg",
        keywords: [
            "coffee", "coffee bean", "coffee beans", "filter coffee"
        ]
    },
    // SPICES
    {
        file: "spices.svg",
        keywords: [
            "spice", "spices", "turmeric", "haldi", "ginger", "garlic", "cardamom", 
            "cinnamon", "clove", "pepper", "masala"
        ]
    },
    // DAIRY (CHEESE, PANEER, BUTTER)
    {
        file: "dairy.svg",
        keywords: [
            "cheese", "paneer", "butter", "ghee", "curd", "yogurt", "cream", "buttermilk", "dairy"
        ]
    },
    // COOKED FOOD (MEALS, CURRIES)
    {
        file: "cooked_food.svg",
        keywords: [
            "cooked", "meal", "meals", "curry", "sambar", "rasam", "sabzi", "gravy", 
            "korma", "khichdi", "pasta", "noodles", "pizza", "burger", "soup", 
            "idli", "dosa", "vada", "samosa", "casserole"
        ]
    },
    // VEGETABLES (GENERAL)
    {
        file: "vegetables.svg",
        keywords: [
            "vegetable", "vegetables", "veggie", "veggies", "cabbage", "cauliflower", 
            "broccoli", "brinjal", "eggplant", "aubergine", "cucumber", "gourd", 
            "bottle gourd", "bitter gourd", "okra", "bhindi", "ladies finger", 
            "beetroot", "radish", "turnip"
        ]
    },
    // FRUITS (GENERAL)
    {
        file: "fruits.svg",
        keywords: [
            "fruit", "fruits", "grape", "grapes", "watermelon", "melon", "papaya", 
            "guava", "pomegranate", "strawberry", "strawberries", "pineapple", "pear", 
            "peach", "plum", "lemon", "lime"
        ]
    },
    // FISH / SEAFOOD
    {
        file: "fish.svg",
        keywords: [
            "fish", "seafood", "prawn", "prawns", "shrimp", "meen", "machhli"
        ]
    },
    // POULTRY / MEAT
    {
        file: "poultry.svg",
        keywords: [
            "poultry", "chicken", "meat", "mutton"
        ]
    }
];

/**
 * Normalizes an item name string by stripping common decorative/agricultural adjectives,
 * removing punctuation, converting to lowercase, and trimming.
 */
function normalizeItemName(name) {
    if (!name || typeof name !== "string") return { fullOriginal: "", cleaned: "", words: [] };
    let str = name.toLowerCase().trim();
    // Remove punctuation
    str = str.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ");
    // Remove excess whitespace
    str = str.replace(/\s+/g, " ").trim();
    
    // Common descriptive prefixes/adjectives to strip for canonical matching
    const stripPrefixes = [
        "fresh", "organic", "farm", "local", "surplus", "raw", "pure", "ripe", 
        "sweet", "green", "red", "yellow", "white", "brown", "cooked", "hot", 
        "cold", "homemade", "packaged", "dry", "whole", "sliced", "chopped", 
        "boiled", "frozen", "unsold", "harvest", "harvested", "healthy"
    ];
    
    const words = str.split(" ").filter(w => w.length > 0);
    const cleanedWords = words.filter(w => !stripPrefixes.includes(w));
    
    return {
        fullOriginal: str,
        cleaned: cleanedWords.join(" "),
        words: cleanedWords.length > 0 ? cleanedWords : words
    };
}

/**
 * Returns singular and plural variations of an English word.
 */
function getWordVariants(word) {
    if (!word) return [];
    const variants = new Set([word]);
    // Plural to singular
    if (word.endsWith("ies") && word.length > 3) {
        variants.add(word.slice(0, -3) + "y");
    } else if (word.endsWith("es") && word.length > 3) {
        variants.add(word.slice(0, -2));
        variants.add(word.slice(0, -1)); // e.g. tomatoes -> tomato
    } else if (word.endsWith("s") && word.length > 2) {
        variants.add(word.slice(0, -1));
    }
    // Singular to plural
    if (word.endsWith("y") && word.length > 2) {
        variants.add(word.slice(0, -1) + "ies");
    } else if (word.endsWith("o") || word.endsWith("ch") || word.endsWith("sh") || word.endsWith("ss") || word.endsWith("x")) {
        variants.add(word + "es");
    } else {
        variants.add(word + "s");
    }
    return Array.from(variants);
}

/**
 * Returns category-based fallback image path for unknown items.
 */
function getCategoryFallbackImage(category, isCrop = false) {
    const cat = (category || "").toLowerCase();
    if (isCrop || cat.includes("crop") || cat.includes("harvest") || cat.includes("farm") || cat.includes("agriculture")) {
        return "images/food/category_crop.svg";
    }
    if (cat.includes("veg")) {
        return "images/food/category_vegetable.svg";
    }
    if (cat.includes("fruit")) {
        return "images/food/category_fruit.svg";
    }
    if (cat.includes("grain") || cat.includes("cereal") || cat.includes("pulse") || cat.includes("flour")) {
        return "images/food/category_grain.svg";
    }
    if (cat.includes("dairy") || cat.includes("milk")) {
        return "images/food/category_dairy.svg";
    }
    if (cat.includes("cooked") || cat.includes("meal") || cat.includes("prep")) {
        return "images/food/category_cooked.svg";
    }
    return isCrop ? "images/food/category_crop.svg" : "images/food/fallback.svg";
}

/**
 * Reusable dynamic image selection function.
 * Matches item name against food/crop dictionary with case variations, synonyms, and plurals.
 * Uses category fallback for unknown items rather than an unrelated food.
 *
 * @param {string} itemName - The food or crop item name
 * @param {string} category - The category string (e.g. Vegetables, Grains)
 * @param {boolean} isCrop - Whether this is a farmer crop
 * @param {string} customPhoto - Optional user photo URL/base64
 * @returns {string} Relative URL to matching image
 */
function getItemImage(itemName, category = "", isCrop = false, customPhoto = null) {
    // 1. If user provided a genuine user-uploaded base64 data URI (from file input), preserve it!
    if (customPhoto && typeof customPhoto === "string" && customPhoto.startsWith("data:image/")) {
        return customPhoto;
    }

    if (!itemName || typeof itemName !== "string" || !itemName.trim()) {
        return getCategoryFallbackImage(category, isCrop);
    }

    const { fullOriginal, cleaned, words } = normalizeItemName(itemName);

    // Phase 1: Exact match on cleaned or full original
    for (const entry of FOOD_IMAGE_MAP) {
        for (const kw of entry.keywords) {
            if (cleaned === kw || fullOriginal === kw) {
                return `images/food/${entry.file}`;
            }
        }
    }

    // Phase 2: Whole word boundary regex match
    for (const entry of FOOD_IMAGE_MAP) {
        for (const kw of entry.keywords) {
            const regex = new RegExp(`\\b${kw}\\b`, "i");
            if (regex.test(cleaned) || regex.test(fullOriginal)) {
                return `images/food/${entry.file}`;
            }
        }
    }

    // Phase 3: Word-by-word with singular/plural variations
    for (const word of words) {
        const variants = getWordVariants(word);
        for (const variant of variants) {
            for (const entry of FOOD_IMAGE_MAP) {
                if (entry.keywords.includes(variant)) {
                    return `images/food/${entry.file}`;
                }
            }
        }
    }

    // Phase 4: Word prefix / substring (length >= 4)
    for (const word of words) {
        for (const entry of FOOD_IMAGE_MAP) {
            for (const kw of entry.keywords) {
                if (word.length >= 4 && kw.length >= 4) {
                    if (word.startsWith(kw) || kw.startsWith(word)) {
                        return `images/food/${entry.file}`;
                    }
                }
            }
        }
    }

    // Phase 5: Category-based fallback for unknown items
    return getCategoryFallbackImage(category, isCrop);
}

/**
 * Safe image error handler to prevent broken card rendering.
 * Safely replaces failed images with category or universal fallback.
 */
function handleImageError(imgEl, category = "", isCrop = false) {
    if (!imgEl) return;
    imgEl.onerror = null; // Prevent recursion
    const fallback = getCategoryFallbackImage(category, isCrop);
    if (imgEl.src !== fallback && !imgEl.src.endsWith(fallback)) {
        imgEl.src = fallback;
    } else {
        imgEl.src = "images/food/fallback.svg";
    }
}

/* ========================================================
   LANDING PAGE ACTIONS
======================================================== */

function getStarted() {
    const user = getLoggedInUser();
    if (user) {
        window.location.href = "dashboard.html";
    } else {
        window.location.href = "login.html";
    }
}

function learnMore() {
    const aboutSec = document.getElementById("about") || document.getElementById("features");
    if (aboutSec) {
        aboutSec.scrollIntoView({ behavior: "smooth" });
    } else {
        window.location.href = "index.html#features";
    }
}

/* ========================================================
   AUTHENTICATION & SESSION MANAGEMENT
======================================================== */

function getAuthToken() {
    return localStorage.getItem("zeroWasteToken") || "";
}

function setAuthToken(token) {
    if (token) {
        localStorage.setItem("zeroWasteToken", token);
    } else {
        localStorage.removeItem("zeroWasteToken");
    }
}

function getLoggedInUser() {
    try {
        const stored = localStorage.getItem("zeroWasteUser") || localStorage.getItem("ecoMindUser");
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error("Error reading stored user:", e);
    }
    return null;
}

function setLoggedInUser(user, token = null) {
    if (user) {
        localStorage.setItem("zeroWasteUser", JSON.stringify(user));
        localStorage.setItem("ecoMindUser", JSON.stringify(user)); // backward compatibility
    } else {
        localStorage.removeItem("zeroWasteUser");
        localStorage.removeItem("ecoMindUser");
    }
    if (token) {
        setAuthToken(token);
    }
}

function authHeaders(extraHeaders = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...extraHeaders
    };
    const token = getAuthToken();
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
}

// Login
async function loginUser(event) {
    if (event) event.preventDefault();

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    if (!emailInput || !passwordInput) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    try {
        const response = await fetch(`${API_BASE}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (!response.ok) {
            alert("❌ " + (data.message || "Invalid credentials."));
            return;
        }

        setLoggedInUser(data.user, data.token);
        alert(`✅ Login successful!\nWelcome to ZeroWaste, ${data.user.name}`);
        window.location.href = "dashboard.html";
    } catch (error) {
        console.error("Login error:", error);
        alert("❌ Cannot connect to ZeroWaste backend server.");
    }
}

// Helper Login
async function quickLogin(email, password) {
    try {
        const response = await fetch(`${API_BASE}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (!response.ok) {
            alert("❌ " + (data.message || "Quick login failed."));
            return;
        }

        setLoggedInUser(data.user, data.token);
        window.location.href = "dashboard.html";
    } catch (error) {
        console.error("Quick login error:", error);
        alert("❌ Server connection error.");
    }
}

// Register
async function registerUser(event) {
    if (event) event.preventDefault();

    const name = document.getElementById("name")?.value.trim();
    const email = document.getElementById("registerEmail")?.value.trim();
    const password = document.getElementById("registerPassword")?.value.trim();
    const role = document.getElementById("role")?.value;
    const contactNumber = document.getElementById("registerContact")?.value.trim();
    const address = document.getElementById("registerAddress")?.value.trim();

    if (!name || !email || !password || !role) {
        alert("Please fill all required fields.");
        return;
    }

    if ((role === "household" || role === "farmer") && (!contactNumber || contactNumber.length < 7)) {
        alert("Please provide a valid contact phone number (at least 7 digits).");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, role, contactNumber, address })
        });

        const data = await response.json();
        if (!response.ok) {
            alert("❌ " + (data.message || "Registration failed."));
            return;
        }

        setLoggedInUser(data.user, data.token);
        alert("✅ Account created successfully!\nWelcome to ZeroWaste!");
        window.location.href = "dashboard.html";
    } catch (error) {
        console.error("Register error:", error);
        alert("❌ Server connection error.");
    }
}

function logoutUser() {
    localStorage.removeItem("zeroWasteUser");
    localStorage.removeItem("ecoMindUser");
    localStorage.removeItem("zeroWasteToken");
    cachedFoods = [];
    cachedAIRecipes = [];
    const notifContainer = document.getElementById("expiryNotificationContainer");
    if (notifContainer) {
        notifContainer.style.display = "none";
        notifContainer.innerHTML = "";
    }
    window.location.href = "login.html";
}

/* ========================================================
   DASHBOARD INITIALIZATION & ROLE-BASED UI
======================================================== */

document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("welcomeMessage")) {
        initDashboard();
    }
});

async function initDashboard() {
    let user = getLoggedInUser();
    let token = getAuthToken();

    // Reset caches on dashboard initialization to ensure recipes and foods are fresh
    cachedFoods = [];
    cachedAIRecipes = [];

    // Guard: Require valid user session to access dashboard
    if (!user || !token) {
        window.location.href = "login.html";
        return;
    }

    // Update Header & Welcome
    const welcomeEl = document.getElementById("welcomeMessage");
    const roleEl = document.getElementById("roleMessage");
    const nameEl = document.getElementById("headerUserName");
    const headerRoleEl = document.getElementById("headerUserRole");

    if (welcomeEl) welcomeEl.innerText = `Welcome, ${user.name}!`;
    if (roleEl) roleEl.innerText = `Logged in as ${user.role.toUpperCase()} (${user.email})`;
    if (nameEl) nameEl.innerText = user.name;
    if (headerRoleEl) headerRoleEl.innerText = user.role;

    // Prefill form details
    const donorNameInput = document.getElementById("donationDonorName");
    const donorContactInput = document.getElementById("donationDonorContact");
    const donorLocationInput = document.getElementById("donationLocation");

    if (donorNameInput && !donorNameInput.value) donorNameInput.value = user.name;
    if (donorContactInput && !donorContactInput.value) donorContactInput.value = user.contactNumber || "";
    if (donorLocationInput && !donorLocationInput.value) donorLocationInput.value = user.address || "Coimbatore";

    // Bind dynamic image preview listener to custom food name input
    const customFoodInput = document.getElementById("customFoodName");
    if (customFoodInput && !customFoodInput.dataset.boundImg) {
        customFoodInput.dataset.boundImg = "true";
        customFoodInput.addEventListener("input", function () {
            const val = this.value.trim();
            const photoInput = document.getElementById("donationPhotoUrl");
            const preview = document.getElementById("donationPhotoPreview");
            if (photoInput && (!photoInput.value || photoInput.value.includes("images.unsplash.com") || photoInput.value.startsWith("images/"))) {
                const matched = getItemImage(val, "Household Surplus", false);
                photoInput.value = matched;
                if (preview && (!photoInput.value.startsWith("data:image/"))) {
                    preview.innerHTML = `<img src="${matched}" onerror="handleImageError(this, 'Household Surplus', false)" style="width: 120px; height: 90px; object-fit: cover; border-radius: 8px; border: 2px solid #2e8b57;">`;
                }
            }
        });
    }

    // Toggle Role Sections
    const householdStats = document.getElementById("householdStatsSection");
    const householdFood = document.getElementById("householdFoodSection");
    const householdInv = document.getElementById("householdInventorySection");
    const householdAI = document.getElementById("householdAISection");
    const householdShortcuts = document.getElementById("householdShortcutsSection");
    const createDonationSec = document.getElementById("createDonationSection");
    const donorStatsSec = document.getElementById("donorStatsSection");
    const farmerFeatures = document.getElementById("farmerFeatures");
    const ngoFeatures = document.getElementById("ngoFeatures");

    if (user.role === "household") {
        if (householdStats) householdStats.style.display = "grid";
        if (householdFood) householdFood.style.display = "block";
        if (householdInv) householdInv.style.display = "block";
        if (householdAI) householdAI.style.display = "block";
        if (householdShortcuts) householdShortcuts.style.display = "grid";
        if (createDonationSec) createDonationSec.style.display = "block";
        if (donorStatsSec) donorStatsSec.style.display = "block";
        if (farmerFeatures) farmerFeatures.style.display = "none";
        if (ngoFeatures) ngoFeatures.style.display = "none";

        loadFoodInventory();
        loadMyDonations();
        loadDonorStats();
    } else if (user.role === "farmer") {
        if (householdStats) householdStats.style.display = "none";
        if (householdFood) householdFood.style.display = "none";
        if (householdInv) householdInv.style.display = "none";
        if (householdAI) householdAI.style.display = "none";
        if (householdShortcuts) householdShortcuts.style.display = "none";
        if (createDonationSec) createDonationSec.style.display = "none";
        if (donorStatsSec) donorStatsSec.style.display = "block";
        const notifContainer = document.getElementById("expiryNotificationContainer");
        if (notifContainer) { notifContainer.style.display = "none"; notifContainer.innerHTML = ""; }
        if (farmerFeatures) farmerFeatures.style.display = "block";
        if (ngoFeatures) ngoFeatures.style.display = "none";

        loadFarmerCrops();
        loadFarmerCropDonations();
        loadDonorStats();
    } else if (user.role === "ngo") {
        if (householdStats) householdStats.style.display = "none";
        if (householdFood) householdFood.style.display = "none";
        if (householdInv) householdInv.style.display = "none";
        if (householdAI) householdAI.style.display = "none";
        if (householdShortcuts) householdShortcuts.style.display = "none";
        if (createDonationSec) createDonationSec.style.display = "none";
        if (donorStatsSec) donorStatsSec.style.display = "none";
        const notifContainer = document.getElementById("expiryNotificationContainer");
        if (notifContainer) { notifContainer.style.display = "none"; notifContainer.innerHTML = ""; }
        if (farmerFeatures) farmerFeatures.style.display = "none";
        if (ngoFeatures) ngoFeatures.style.display = "block";

        loadNgoDashboard();
    }
}

/* ========================================================
   FOOD EXPIRY NOTIFICATIONS (Banner & Urgent Item Alerts)
======================================================== */

/* ========================================================
   FOOD EXPIRY NOTIFICATIONS (Banner & Urgent Item Alerts)
======================================================== */

// Request browser notification permission politely upon user interaction
async function requestBrowserNotificationPermission() {
    if (!("Notification" in window)) {
        alert("Desktop browser notifications are not supported by this browser.");
        return;
    }
    try {
        const perm = await Notification.requestPermission();
        if (perm === "granted") {
            checkAndSendBrowserNotifications(cachedFoods, true);
        }
        renderExpiryNotifications(cachedFoods);
    } catch (e) {
        console.warn("Could not request notification permission:", e);
    }
}

// Send browser notifications without duplicates
function checkAndSendBrowserNotifications(foods, force = false) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    if (!Array.isArray(foods) || foods.length === 0) return;

    // Filter strictly valid, unexpired items expiring today or tomorrow
    const urgentItems = [];
    foods.forEach(food => {
        const status = calculateExpiryStatus(food.expiryDate);
        if (status.isValid && !status.isExpired && (status.diffDays === 0 || status.diffDays === 1)) {
            urgentItems.push({ food, status });
        }
    });

    if (urgentItems.length === 0) return;

    // Avoid duplicate notifications using unique fingerprint of item IDs and status
    const fingerprint = urgentItems.map(u => `${u.food._id || u.food.name}-${u.food.expiryDate}-${u.status.diffDays}`).sort().join("|");
    if (!force && fingerprint === lastBrowserNotifiedFingerprint) {
        return;
    }
    lastBrowserNotifiedFingerprint = fingerprint;

    const tomorrowItems = urgentItems.filter(u => u.status.diffDays === 1);
    const todayItems = urgentItems.filter(u => u.status.diffDays === 0);

    let title = "ZeroWaste Expiry Notification";
    let body = "";

    if (tomorrowItems.length > 0 && todayItems.length === 0) {
        title = tomorrowItems.length === 1
            ? `⚠️ Expiry Alert: "${tomorrowItems[0].food.name}" expires tomorrow!`
            : `⚠️ Expiry Alert: ${tomorrowItems.length} food items expire tomorrow!`;
        body = tomorrowItems.map(u => `${u.food.name} (${u.food.quantity} ${u.food.unit})`).join(", ") + " expire tomorrow. Check healthy recipes or donate surplus!";
    } else if (todayItems.length > 0) {
        title = `🚨 Urgent Expiry Alert: ${urgentItems.length} item(s) expiring today & tomorrow!`;
        body = urgentItems.map(u => `${u.food.name} (${u.status.diffDays === 0 ? 'Expires today' : 'Expires tomorrow'})`).join(", ") + ". Please consume or donate immediately.";
    }

    try {
        new Notification(title, {
            body: body,
            icon: "/favicon.ico"
        });
    } catch (err) {
        console.warn("Browser notification creation failed:", err);
    }
}

// Scroll to and highlight the in-dashboard expiry notification container
function scrollToExpiryBanner() {
    const container = document.getElementById("expiryNotificationContainer");
    if (container && container.style.display !== "none") {
        container.scrollIntoView({ behavior: "smooth", block: "start" });
        container.classList.remove("highlight-pulse");
        void container.offsetWidth; // Force CSS reflow
        container.classList.add("highlight-pulse");
    }
}

// Render visible in-dashboard notifications for all foods expiring today and tomorrow
function renderExpiryNotifications(foods) {
    const container = document.getElementById("expiryNotificationContainer");
    if (!container) return;

    if (!Array.isArray(foods) || foods.length === 0) {
        container.style.display = "none";
        container.innerHTML = "";
        return;
    }

    // Check all food items belonging to the logged-in user; strictly exclude expired foods
    const todayItems = [];
    const tomorrowItems = [];

    foods.forEach(food => {
        const status = calculateExpiryStatus(food.expiryDate);
        // Exclude expired food (diffDays < 0 or isExpired = true)
        if (status.isValid && !status.isExpired) {
            if (status.diffDays === 0) {
                todayItems.push({ food, status });
            } else if (status.diffDays === 1) {
                tomorrowItems.push({ food, status });
            }
        }
    });

    const urgentItems = [...todayItems, ...tomorrowItems];

    if (urgentItems.length === 0) {
        container.style.display = "none";
        container.innerHTML = "";
        return;
    }

    // Check if browser notifications should be triggered (if permission granted and set changed)
    checkAndSendBrowserNotifications(foods, false);

    const totalCount = urgentItems.length;
    const tomorrowCount = tomorrowItems.length;
    const todayCount = todayItems.length;

    let headerTitle = "";
    if (tomorrowCount > 0 && todayCount === 0) {
        headerTitle = tomorrowCount === 1
            ? `⚠️ Expiry Notification: 1 Food Item Expiring Tomorrow!`
            : `⚠️ Expiry Notifications: All ${tomorrowCount} Food Items Expiring Tomorrow!`;
    } else if (todayCount > 0 && tomorrowCount === 0) {
        headerTitle = todayCount === 1
            ? `🚨 Urgent Expiry Notification: 1 Food Item Expiring Today!`
            : `🚨 Urgent Expiry Notifications: ${todayCount} Food Items Expiring Today!`;
    } else {
        headerTitle = `⚠️ Expiry Notifications: ${totalCount} Food Items Expiring Soon (${todayCount} Today, ${tomorrowCount} Tomorrow)!`;
    }

    // Browser notification status control pill/button
    let notifPermissionHtml = "";
    if ("Notification" in window) {
        if (Notification.permission === "default") {
            notifPermissionHtml = `
                <button class="btn-sm btn-outline" onclick="requestBrowserNotificationPermission()" style="background: #fff; border-color: #f59e0b; color: #b45309; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 6px; cursor: pointer;">
                    🔔 Enable Desktop Alerts
                </button>
            `;
        } else if (Notification.permission === "granted") {
            notifPermissionHtml = `
                <span style="background: #dcfce7; color: #166534; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px; border: 1px solid #bbf7d0;">
                    🔔 Desktop Alerts Active
                </span>
            `;
        }
    }

    // Render EVERY urgent item (showing ALL items expiring tomorrow and today)
    const itemsHtml = urgentItems.map(({ food, status }) => {
        const isToday = status.diffDays === 0;
        const icon = isToday ? "🚨" : "⏳";
        const badgeColor = isToday ? "#dc2626" : "#d97706";
        const badgeBg = isToday ? "#fee2e2" : "#fef3c7";
        const daysRemainingText = isToday ? "0 days remaining" : "1 day remaining";
        const statusLabel = isToday ? "Expires today" : "Expires tomorrow";
        const foodImg = getItemImage(food.name, food.category, false);

        return `
            <div class="expiry-notification-item" id="notif-item-${food._id}">
                <div style="display: flex; align-items: center; gap: 14px; flex: 1; min-width: 220px;">
                    <img src="${foodImg}" alt="${escapeHtml(food.name)}" onerror="handleImageError(this, '${escapeHtml(food.category || '')}', false)" style="width: 44px; height: 44px; object-fit: cover; border-radius: 8px; flex-shrink: 0; border: 1px solid #fde68a; background: #fffbeb;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <strong style="color: #173b2a; font-size: 15px;">${escapeHtml(food.name)}</strong>
                            <span style="font-size: 13px; color: #436251; font-weight: 600;">
                                (${food.quantity} ${escapeHtml(food.unit)})
                            </span>
                            <span style="background: ${badgeBg}; color: ${badgeColor}; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 12px; border: 1px solid ${isToday ? '#fca5a5' : '#fde68a'};">
                                ${icon} ${statusLabel} (${daysRemainingText})
                            </span>
                        </div>
                        <div style="font-size: 12px; color: #78350f; margin-top: 4px;">
                            📅 Expiry Date: <strong>${escapeHtml(food.expiryDate)}</strong>
                            ${food.category ? ` &bull; <span>${escapeHtml(food.category)}</span>` : ""}
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                    <button class="btn-sm btn-primary" onclick="quickDonateFood('${food._id}', '${escapeHtml(food.name)}', ${food.quantity}, '${escapeHtml(food.unit)}')">
                        🤝 Donate Now
                    </button>
                    <button class="btn-sm btn-outline" onclick="viewRecipesForFood('${escapeHtml(food.name)}')">
                        👨‍🍳 View AI Recipes
                    </button>
                    <button class="btn-sm btn-outline" onclick="openEditFoodModal('${food._id}', '${escapeHtml(food.name)}', ${food.quantity}, '${escapeHtml(food.unit)}', '${escapeHtml(food.expiryDate)}', '${escapeHtml(food.category || '')}')">
                        ✏️ Edit
                    </button>
                </div>
            </div>
        `;
    }).join("");

    container.innerHTML = `
        <div class="expiry-notification-card">
            <div class="expiry-notification-header" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
                <div class="expiry-notification-title" style="flex: 1; min-width: 250px;">
                    <span style="font-size: 26px; line-height: 1;">⚠️</span>
                    <div>
                        <h4 style="margin: 0 0 4px; color: #92400e; font-size: 16px; font-weight: 700;">
                            ${headerTitle}
                        </h4>
                        <p style="margin: 0; color: #b45309; font-size: 13px;">
                            The food items below will expire today or tomorrow. Please prepare healthy zero-waste meals or donate surplus portions to local NGOs to prevent food waste.
                        </p>
                    </div>
                </div>
                <div>
                    ${notifPermissionHtml}
                </div>
            </div>
            <div class="expiry-notification-list">
                ${itemsHtml}
            </div>
        </div>
    `;

    container.style.display = "block";
}

/* ========================================================
   FOOD INVENTORY (Household)
======================================================== */

async function loadFoodInventory() {
    const user = getLoggedInUser();
    if (!user) return;

    try {
        const res = await fetch(`${API_BASE}/api/foods/${encodeURIComponent(user.email)}`, {
            headers: authHeaders()
        });

        if (res.status === 401 || res.status === 403) {
            console.warn("Session expired loading inventory, redirecting to login...");
            logoutUser();
            return;
        }

        let foods = [];
        if (res.ok) {
            const data = await res.json();
            foods = Array.isArray(data) ? data : [];
        } else {
            console.error(`Failed to load food inventory (HTTP ${res.status})`);
            foods = [];
        }

        cachedFoods = foods;

        const tbody = document.getElementById("foodInventory");
        const emptyEl = document.getElementById("emptyInventory");
        const foodCountEl = document.getElementById("foodCount");
        const expiryCountEl = document.getElementById("expiryCount");

        if (foodCountEl) foodCountEl.innerText = foods.length || 0;

        if (!tbody) return;
        tbody.innerHTML = "";

        if (!Array.isArray(foods) || foods.length === 0) {
            if (emptyEl) emptyEl.style.display = "block";
            cachedFoods = [];
            cachedAIRecipes = [];
            updateFoodDropdown([]);
            await updateAISuggestions([], 0);
            renderExpiryNotifications([]);
            return;
        }

        if (emptyEl) emptyEl.style.display = "none";

        let expiringCount = 0;

        foods.forEach(food => {
            const status = calculateExpiryStatus(food.expiryDate);
            if (status.isExpired || status.isExpiringSoon) {
                expiringCount++;
            }

            const foodImg = getItemImage(food.name, food.category, false);

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${foodImg}" alt="${escapeHtml(food.name)}" onerror="handleImageError(this, '${escapeHtml(food.category || '')}', false)" style="width: 38px; height: 38px; object-fit: cover; border-radius: 8px; flex-shrink: 0; border: 1px solid #d1fae5; background: #f0fdf4;">
                        <div>
                            <strong style="color: #173b2a;">${escapeHtml(food.name)}</strong>
                            ${food.category ? `<br><small style="color: #5a7567; font-size: 11px;">${escapeHtml(food.category)}</small>` : ''}
                        </div>
                    </div>
                </td>
                <td>${food.quantity} ${escapeHtml(food.unit)}</td>
                <td>${escapeHtml(food.expiryDate)}</td>
                <td><span style="color: ${status.statusColor}; font-weight: 700;">${status.statusText}</span></td>
                <td>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        <button class="btn-sm btn-outline" onclick="openEditFoodModal('${food._id}', '${escapeHtml(food.name)}', ${food.quantity}, '${escapeHtml(food.unit)}', '${escapeHtml(food.expiryDate)}', '${escapeHtml(food.category || '')}')">
                            ✏️ Edit
                        </button>
                        ${!status.isExpired ? `
                            <button class="btn-sm btn-primary" onclick="quickDonateFood('${food._id}', '${escapeHtml(food.name)}', ${food.quantity}, '${escapeHtml(food.unit)}')">
                                🤝 Donate
                            </button>
                        ` : `
                            <span style="font-size: 11px; color: #b91c1c; font-weight: 600; padding: 4px;">Expired</span>
                        `}
                        <button class="btn-sm btn-danger-outline" onclick="deleteFoodItem('${food._id}')">
                            🗑️
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        if (expiryCountEl) expiryCountEl.innerText = expiringCount;

        updateFoodDropdown(foods);
        await updateAISuggestions(foods, expiringCount);
        renderExpiryNotifications(foods);
    } catch (e) {
        console.error("Error loading inventory:", e);
    }
}

// Clear in-dashboard toast alert when food is added with urgent expiry
function showFoodAddedExpiryToast(name, quantity, unit, urgency = "tomorrow") {
    const oldToast = document.getElementById("expiryToastAlert");
    if (oldToast) oldToast.remove();

    const isTomorrow = urgency === "tomorrow";
    const title = isTomorrow ? "⚠️ Food Added: Expiring Tomorrow!" : "🚨 Food Added: Expiring Today!";
    const msg = isTomorrow
        ? `<strong>${escapeHtml(name)}</strong> (${quantity} ${escapeHtml(unit)}) was added to your inventory and <strong>expires tomorrow (1 day away)</strong>. Please prepare an AI recipe or donate surplus portions before it goes to waste!`
        : `<strong>${escapeHtml(name)}</strong> (${quantity} ${escapeHtml(unit)}) was added and <strong>expires today</strong>! Please consume or donate immediately.`;

    const toast = document.createElement("div");
    toast.id = "expiryToastAlert";
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #ffffff;
        border-left: 6px solid ${isTomorrow ? '#f59e0b' : '#dc2626'};
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.25), 0 8px 10px -6px rgba(0,0,0,0.1);
        border-radius: 10px;
        padding: 16px 20px;
        max-width: 440px;
        z-index: 99999;
        display: flex;
        gap: 14px;
        align-items: flex-start;
        border-top: 1px solid #f1f5f9;
        border-right: 1px solid #f1f5f9;
        border-bottom: 1px solid #f1f5f9;
    `;

    toast.innerHTML = `
        <span style="font-size: 28px; line-height: 1;">${isTomorrow ? '⏳' : '🚨'}</span>
        <div style="flex: 1;">
            <h4 style="margin: 0 0 6px; color: ${isTomorrow ? '#b45309' : '#b91c1c'}; font-size: 15px; font-weight: 700;">${title}</h4>
            <p style="margin: 0 0 10px; color: #374151; font-size: 13px; line-height: 1.45;">${msg}</p>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="btn-sm btn-primary" onclick="scrollToExpiryBanner(); document.getElementById('expiryToastAlert')?.remove();">
                    View Notifications
                </button>
                <button class="btn-sm btn-outline" onclick="viewRecipesForFood('${escapeHtml(name)}'); document.getElementById('expiryToastAlert')?.remove();">
                    👨‍🍳 View AI Recipes
                </button>
                <button class="btn-sm btn-outline" onclick="document.getElementById('expiryToastAlert')?.remove();">
                    Dismiss
                </button>
            </div>
        </div>
        <button onclick="document.getElementById('expiryToastAlert')?.remove();" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #9ca3af; line-height: 1; padding: 0 4px;">&times;</button>
    `;

    document.body.appendChild(toast);

    // Smoothly scroll to and pulse the in-dashboard expiry notification container
    scrollToExpiryBanner();

    // Trigger browser notification if permission granted
    if ("Notification" in window && Notification.permission === "granted") {
        try {
            new Notification(title, {
                body: `${name} (${quantity} ${unit}) expires ${urgency}! Check healthy recipe ideas or donate to prevent food waste.`,
                icon: "/favicon.ico"
            });
        } catch (e) {
            console.warn("Browser notification error:", e);
        }
    }

    // Auto-dismiss toast after 10 seconds
    setTimeout(() => {
        if (toast && toast.parentNode) {
            toast.remove();
        }
    }, 10000);
}

async function saveFood(event) {
    if (event) event.preventDefault();
    const user = getLoggedInUser();
    if (!user) return;

    const name = document.getElementById("foodName")?.value.trim();
    const quantity = document.getElementById("foodQuantity")?.value;
    const unit = document.getElementById("foodUnit")?.value;
    const expiryDate = document.getElementById("foodExpiry")?.value;

    if (!name || !quantity || !unit || !expiryDate) {
        alert("Please fill in all food details (name, quantity, unit, expiry date).");
        return;
    }

    if (!parseCalendarDate(expiryDate)) {
        alert("Please enter a valid expiry date (YYYY-MM-DD).");
        return;
    }

    if (Number(quantity) <= 0) {
        alert("Please enter a valid quantity greater than zero.");
        return;
    }

    // Calculate expiry status using calendar days
    const status = calculateExpiryStatus(expiryDate);

    try {
        const res = await fetch(`${API_BASE}/api/foods`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
                name,
                quantity: Number(quantity),
                unit,
                expiryDate,
                category: "Household Stock"
            })
        });

        const data = await res.json();
        if (!res.ok) {
            alert("❌ " + (data.message || "Failed to save food."));
            return;
        }

        document.getElementById("foodName").value = "";
        document.getElementById("foodQuantity").value = "";
        document.getElementById("foodUnit").value = "";
        document.getElementById("foodExpiry").value = "";

        // Reload inventory immediately to reflect new item in dashboard, counters, notifications, and AI recipes
        await loadFoodInventory();

        // When a user adds food with an expiry date exactly one day away, show a clear notification on the dashboard
        if (status.diffDays === 1) {
            showFoodAddedExpiryToast(name, quantity, unit, "tomorrow");
        } else if (status.diffDays === 0) {
            showFoodAddedExpiryToast(name, quantity, unit, "today");
        } else {
            alert("✅ Food item added to inventory!");
        }
    } catch (e) {
        alert("❌ Error saving food item.");
    }
}

function openEditFoodModal(id, name, quantity, unit, expiryDate, category) {
    const container = document.getElementById("workflowModalContainer");
    if (!container) return;

    container.innerHTML = `
        <div class="custom-modal-backdrop" onclick="if(event.target === this) closeWorkflowModal()">
            <div class="custom-modal-card">
                <div class="custom-modal-header">
                    <h3>✏️ Edit Food Inventory Item</h3>
                    <button class="custom-modal-close" onclick="closeWorkflowModal()">&times;</button>
                </div>
                <div class="custom-modal-body">
                    <form onsubmit="saveFoodEdit(event, '${id}')">
                        <div style="margin-bottom: 12px;">
                            <label style="font-weight: 700; font-size: 13px; display: block; margin-bottom: 4px;">Food Name</label>
                            <input type="text" id="editFoodName" value="${escapeHtml(name)}" required style="width: 100%; padding: 10px; border: 1px solid #c2decb; border-radius: 6px;">
                        </div>
                        <div style="display: flex; gap: 10px; margin-bottom: 12px;">
                            <div style="flex: 1;">
                                <label style="font-weight: 700; font-size: 13px; display: block; margin-bottom: 4px;">Quantity</label>
                                <input type="number" id="editFoodQuantity" value="${quantity}" min="0.1" step="0.1" required style="width: 100%; padding: 10px; border: 1px solid #c2decb; border-radius: 6px;">
                            </div>
                            <div style="flex: 1;">
                                <label style="font-weight: 700; font-size: 13px; display: block; margin-bottom: 4px;">Unit</label>
                                <input type="text" id="editFoodUnit" value="${escapeHtml(unit)}" required style="width: 100%; padding: 10px; border: 1px solid #c2decb; border-radius: 6px;">
                            </div>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="font-weight: 700; font-size: 13px; display: block; margin-bottom: 4px;">Expiry Date</label>
                            <input type="date" id="editFoodExpiry" value="${expiryDate}" required style="width: 100%; padding: 10px; border: 1px solid #c2decb; border-radius: 6px;">
                        </div>
                        <div class="custom-modal-footer" style="padding: 10px 0 0;">
                            <button type="button" class="btn-sm btn-outline" onclick="closeWorkflowModal()">Cancel</button>
                            <button type="submit" class="btn-sm btn-primary">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

async function saveFoodEdit(event, id) {
    if (event) event.preventDefault();
    const name = document.getElementById("editFoodName")?.value.trim();
    const quantity = document.getElementById("editFoodQuantity")?.value;
    const unit = document.getElementById("editFoodUnit")?.value.trim();
    const expiryDate = document.getElementById("editFoodExpiry")?.value;

    if (!name || quantity === undefined || !unit || !expiryDate) {
        alert("Please fill in all food details.");
        return;
    }

    if (!parseCalendarDate(expiryDate)) {
        alert("Please enter a valid expiry date (YYYY-MM-DD).");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/foods/${id}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ name, quantity: Number(quantity), unit, expiryDate })
        });
        const data = await res.json();
        if (res.ok) {
            closeWorkflowModal();
            alert("✅ Food item updated successfully!");
            await loadFoodInventory();
        } else {
            alert("❌ " + (data.message || "Failed to update food."));
        }
    } catch (e) {
        alert("❌ Error updating food item.");
    }
}

async function deleteFoodItem(id) {
    if (!confirm("Are you sure you want to remove this food item from your inventory?")) return;
    try {
        const res = await fetch(`${API_BASE}/api/foods/${id}`, {
            method: "DELETE",
            headers: authHeaders()
        });
        if (res.ok) {
            await loadFoodInventory();
        } else {
            const data = await res.json();
            alert("❌ " + (data.message || "Could not delete food."));
        }
    } catch (e) {
        console.error("Error deleting food item:", e);
        alert("❌ Error deleting food item.");
    }
}

function updateFoodDropdown(foods) {
    const sel = document.getElementById("donationFood");
    if (!sel) return;

    sel.innerHTML = '<option value="">Choose food from your inventory or custom</option>';
    if (foods && foods.length > 0) {
        foods.forEach(f => {
            const status = calculateExpiryStatus(f.expiryDate);
            const isExpired = status.isValid && status.isExpired;

            const opt = document.createElement("option");
            opt.value = f._id;
            opt.dataset.name = f.name;
            opt.dataset.qty = f.quantity;
            opt.dataset.unit = f.unit;
            opt.dataset.expired = isExpired ? "true" : "false";
            opt.innerText = `${f.name} (${f.quantity} ${f.unit})${isExpired ? ' - ⚠️ Expired (Cannot Donate)' : ''}`;
            if (isExpired) {
                opt.disabled = true;
            }
            sel.appendChild(opt);
        });
    }
    const customOpt = document.createElement("option");
    customOpt.value = "CUSTOM";
    customOpt.innerText = "+ Add Custom Fresh Surplus Item Not In Inventory";
    sel.appendChild(customOpt);
}

function onSelectDonationFood(selectEl) {
    const customGroup = document.getElementById("customFoodNameGroup");
    const qtyInput = document.getElementById("donationQuantity");
    const unitSelect = document.getElementById("donationUnit");
    const photoPreview = document.getElementById("donationPhotoPreview");
    const photoInput = document.getElementById("donationPhotoUrl");

    if (selectEl.value === "CUSTOM") {
        if (customGroup) customGroup.style.display = "block";
    } else {
        if (customGroup) customGroup.style.display = "none";
        const selected = selectEl.options[selectEl.selectedIndex];
        if (selected && selected.dataset.qty) {
            if (qtyInput) qtyInput.value = selected.dataset.qty;
            if (unitSelect) unitSelect.value = selected.dataset.unit;
        }
        if (selected && selected.dataset.name) {
            const matchedImg = getItemImage(selected.dataset.name, "Household Stock", false);
            if (photoInput && (!photoInput.value || photoInput.value.includes("images.unsplash.com") || photoInput.value.startsWith("images/"))) {
                photoInput.value = matchedImg;
            }
            if (photoPreview && (!photoInput || !photoInput.value.startsWith("data:image/"))) {
                photoPreview.innerHTML = `<img src="${matchedImg}" onerror="handleImageError(this, 'Household Stock', false)" style="width: 120px; height: 90px; object-fit: cover; border-radius: 8px; border: 2px solid #2e8b57;">`;
            }
        }
    }
}

function quickDonateFood(foodId, name, qty, unit) {
    const sel = document.getElementById("donationFood");
    const qtyInput = document.getElementById("donationQuantity");
    const unitSelect = document.getElementById("donationUnit");
    const photoPreview = document.getElementById("donationPhotoPreview");
    const photoInput = document.getElementById("donationPhotoUrl");

    if (sel) sel.value = foodId;
    if (qtyInput) qtyInput.value = qty;
    if (unitSelect) unitSelect.value = unit;

    const matchedImg = getItemImage(name, "Household Stock", false);
    if (photoInput && (!photoInput.value || photoInput.value.includes("images.unsplash.com") || photoInput.value.startsWith("images/"))) {
        photoInput.value = matchedImg;
    }
    if (photoPreview && (!photoInput || !photoInput.value.startsWith("data:image/"))) {
        photoPreview.innerHTML = `<img src="${matchedImg}" onerror="handleImageError(this, 'Household Stock', false)" style="width: 120px; height: 90px; object-fit: cover; border-radius: 8px; border: 2px solid #2e8b57;">`;
    }

    scrollToDonationForm();
}

function scrollToDonationForm() {
    const formSec = document.getElementById("createDonationSection");
    if (formSec) {
        formSec.scrollIntoView({ behavior: "smooth" });
    }
}

/* ========================================================
   HEALTHY AI RECIPE SUGGESTIONS & NUTRITION ENGINE
======================================================== */

let cachedAIRecipes = [];

// Client-side healthy recipe database for instant zero-waste cooking
const CLIENT_RECIPE_KB = [
    // --- MILK / DAIRY ---
    {
        id: "recipe_golden_milk",
        keywords: ["milk", "dairy", "toned milk", "cow milk", "buffalo milk", "fresh milk"],
        name: "Golden Turmeric Spiced Milk (Haldi Doodh)",
        prepTime: "2 mins",
        cookTime: "5 mins",
        totalTime: "7 mins",
        isVegetarian: true,
        dietaryTags: ["🥦 100% Vegetarian", "🌱 Immunity Booster", "☕ Warming Drink"],
        matchIngredient: "milk",
        defaultQty: "250 - 500 ml",
        optionalPantryAdditions: [
            "1/4 tsp ground turmeric powder (pantry staple)",
            "Pinch of freshly ground black pepper (enhances turmeric absorption)",
            "1 tsp honey or jaggery (optional natural sweetener)",
            "Pinch of ground cinnamon or cardamom (optional aromatic)"
        ],
        steps: [
            "Pour your inventory milk into a small saucepan over medium-low heat.",
            "Whisk in the turmeric powder and a pinch of black pepper until smoothly combined.",
            "Warm gently until steaming (do not boil over), then turn off the stove.",
            "Stir in honey or jaggery to taste, pour into a mug, and sip warm."
        ],
        healthBenefit: "Rich in bioavailable calcium for strong bones and Curcumin from turmeric; provides powerful anti-inflammatory and antioxidant support to soothe digestion and promote restorative sleep.",
        vegetarianAlternative: "Plant-Based Alternative: Works seamlessly with soy, almond, oat, or coconut milk for a 100% lactose-free vegan option."
    },
    {
        id: "recipe_homemade_paneer",
        keywords: ["milk", "dairy", "whole milk"],
        name: "Fresh Homemade Soft Paneer (Cottage Cheese)",
        prepTime: "5 mins",
        cookTime: "10 mins",
        totalTime: "15 mins",
        isVegetarian: true,
        dietaryTags: ["🥦 100% Vegetarian", "💪 High Protein", "🥗 Fresh Dairy"],
        matchIngredient: "milk",
        defaultQty: "1 - 2 litres",
        optionalPantryAdditions: [
            "1-2 tbsp fresh lemon juice or white vinegar (acid to curdle)",
            "Pinch of salt (optional seasoning)",
            "Cold water for rinsing"
        ],
        steps: [
            "Bring your inventory milk to a gentle rolling boil in a deep pot, stirring occasionally so it doesn't scorch.",
            "Turn off the heat and slowly drizzle in lemon juice 1 tbsp at a time while stirring gently until green whey separates from white curds.",
            "Line a colander with a clean cotton cloth or fine sieve, pour the curds through, and rinse under cold tap water to wash away lemon acidity.",
            "Gather the cloth edges, squeeze out excess liquid, and press with a flat weight for 15 minutes to firm into fresh paneer ready for salads or curries!"
        ],
        healthBenefit: "Concentrated source of high-quality casein protein and phosphorus; supports muscle repair, satiety, and metabolic strength without preservatives.",
        vegetarianAlternative: "Vegan Alternative: If dairy-free, press firm tofu with a dash of nutritional yeast and olive oil as a direct substitute."
    },

    // --- BREAD / BAKERY ---
    {
        id: "recipe_bread_upma",
        keywords: ["bread", "loaf", "toast", "bun", "pav", "roti", "bakery"],
        name: "Healthy Savory Vegetable Bread Upma",
        prepTime: "5 mins",
        cookTime: "8 mins",
        totalTime: "13 mins",
        isVegetarian: true,
        dietaryTags: ["🥦 100% Vegetarian", "⚡ Quick Energizer", "🍳 Stovetop Classic"],
        matchIngredient: "bread",
        defaultQty: "3 - 5 slices",
        optionalPantryAdditions: [
            "1 tsp cooking oil or ghee",
            "1/2 tsp mustard seeds & pinch of cumin seeds",
            "Pinch of turmeric powder & salt to taste",
            "1/4 cup water to moisten bread cubes",
            "Optional: Any diced onions, green chilies, or peas from your kitchen"
        ],
        steps: [
            "Cut or tear your inventory bread slices into bite-sized 1-inch squares; lightly sprinkle with 2 tablespoons of water so they stay soft.",
            "Heat 1 tsp oil in a skillet over medium flame. Add mustard and cumin seeds until they pop, then sauté any available chopped vegetables for 2 mins.",
            "Sprinkle in turmeric powder and salt, then gently fold in the bread cubes.",
            "Toss on low heat for 3-4 minutes until the bread absorbs the spices and turns golden with slightly crisp edges. Serve hot!"
        ],
        healthBenefit: "Provides easily digestible complex carbohydrates and B vitamins for sustained daytime vitality; light on the stomach and zero oil wastage.",
        vegetarianAlternative: "Vegan & Gluten-Free: Works wonderfully with gluten-free bread, millet bread, or torn leftover rotis."
    },
    {
        id: "recipe_bruschetta",
        keywords: ["bread", "toast", "loaf", "bun"],
        name: "Crispy Garlic Tomato Herb Bruschetta",
        prepTime: "4 mins",
        cookTime: "5 mins",
        totalTime: "9 mins",
        isVegetarian: true,
        dietaryTags: ["🥦 100% Vegetarian", "🌱 Mediterranean Style", "🍞 Crisp & Light"],
        matchIngredient: "bread",
        defaultQty: "2 - 4 slices",
        optionalPantryAdditions: [
            "1 clove garlic (peeled and cut in half)",
            "1 tsp olive oil or vegetable oil",
            "Pinch of salt, black pepper, and dried oregano/herbs"
        ],
        steps: [
            "Toast your inventory bread slices in a dry pan or toaster until golden and crusty.",
            "While the toast is hot, gently rub the cut side of a garlic clove across the surface for a light, aromatic garlic crust.",
            "Drizzle with a few drops of olive oil, sprinkle with salt and dried herbs, and top with diced tomatoes if available.",
            "Serve immediately while warm and delightfully crunchy."
        ],
        healthBenefit: "Garlic contains active allicin that promotes healthy blood circulation and natural antimicrobial resistance.",
        vegetarianAlternative: "Naturally 100% vegan. Suitable for any dietary preference."
    },

    // --- TOMATOES ---
    {
        id: "recipe_tomato_rasam",
        keywords: ["tomato", "tomatoes", "cherry tomato", "tamatar"],
        name: "Comforting Spiced Fresh Tomato Rasam / Soup",
        prepTime: "4 mins",
        cookTime: "10 mins",
        totalTime: "14 mins",
        isVegetarian: true,
        dietaryTags: ["🥦 100% Vegetarian", "🌱 Gut Cleansing", "🥣 Comfort Broth"],
        matchIngredient: "tomato",
        defaultQty: "2 - 3 ripe tomatoes",
        optionalPantryAdditions: [
            "2 cups drinking water",
            "1/2 tsp cumin seeds & 1/2 tsp black pepper",
            "1-2 crushed garlic cloves",
            "Pinch of turmeric powder and salt to taste",
            "1/2 tsp cooking oil or ghee for tempering"
        ],
        steps: [
            "Roughly chop your inventory tomatoes and mash them in a small pot with 2 cups of water (or blend smoothly).",
            "Bring to a gentle boil with salt, crushed garlic, and a pinch of turmeric for 6-7 minutes until tomatoes are thoroughly cooked.",
            "In a small ladle or spoon, heat 1/2 tsp oil, crackle cumin seeds and black pepper, and pour into the simmering soup.",
            "Garnish with fresh coriander if available. Enjoy as a warming digestive broth or with steamed rice!"
        ],
        healthBenefit: "Packed with powerful Lycopene and Vitamin C; aids digestion, cleanses the gut, and strengthens immune defenses against seasonal colds.",
        vegetarianAlternative: "Naturally 100% plant-based and vegan. Add cooked yellow lentils (dal) to increase plant protein."
    },
    {
        id: "recipe_tomato_chutney",
        keywords: ["tomato", "tomatoes", "tamatar"],
        name: "Quick Homestyle Tomato & Onion Skillet Chutney",
        prepTime: "5 mins",
        cookTime: "8 mins",
        totalTime: "13 mins",
        isVegetarian: true,
        dietaryTags: ["🥦 100% Vegetarian", "🌶️ Tangy & Zesty", "🥘 Versatile Side"],
        matchIngredient: "tomato",
        defaultQty: "2 - 4 ripe tomatoes",
        optionalPantryAdditions: [
            "1 tsp cooking oil",
            "1/2 tsp mustard seeds",
            "Pinch of chili powder, salt, and turmeric",
            "1 small onion or garlic clove (optional)"
        ],
        steps: [
            "Finely dice your inventory tomatoes (and onion if on hand).",
            "Heat 1 tsp oil in a pan, crackle mustard seeds, and sauté onions for 2 minutes until translucent.",
            "Add chopped tomatoes, salt, turmeric, and chili powder. Cook over medium heat for 6-7 minutes until soft, jammy, and glossy.",
            "Serve as a vibrant side for rotis, rice, idlis, dosas, or as a savory sandwich spread."
        ],
        healthBenefit: "Cooked tomatoes release concentrated bioavailable Lycopene, a potent antioxidant that supports cardiovascular health.",
        vegetarianAlternative: "Naturally 100% vegan, gluten-free, and nut-free."
    },

    // --- POTATOES ---
    {
        id: "recipe_roasted_potatoes",
        keywords: ["potato", "potatoes", "aloo", "sweet potato"],
        name: "Simple Herb Spiced Golden Roasted Potatoes",
        prepTime: "5 mins",
        cookTime: "15 mins",
        totalTime: "20 mins",
        isVegetarian: true,
        dietaryTags: ["🥦 100% Vegetarian", "🥔 Wholesome Carb", "🔥 Crisp & Tender"],
        matchIngredient: "potato",
        defaultQty: "2 - 4 medium potatoes",
        optionalPantryAdditions: [
            "1-2 tsp cooking oil",
            "1/2 tsp cumin powder or crushed cumin seeds",
            "1/2 tsp turmeric powder & salt to taste",
            "Pinch of black pepper or chili flakes"
        ],
        steps: [
            "Scrub and dice your inventory potatoes into small 1/2-inch cubes (peeling is optional).",
            "Heat 1-2 tsp oil in a heavy-bottomed skillet over medium heat.",
            "Add the potato cubes, season with turmeric, cumin, and salt, and stir to coat evenly.",
            "Cover with a lid and cook on medium-low for 10 minutes, then uncover and fry for 4-5 minutes until golden and crisp on the edges."
        ],
        healthBenefit: "Naturally potassium-rich and a great source of Vitamin B6; provides clean sustained cellular energy without saturated fats.",
        vegetarianAlternative: "Naturally 100% vegan and gluten-free. Sweet potatoes can be cooked identically with extra Vitamin A."
    },

    // --- RICE ---
    {
        id: "recipe_lemon_rice",
        keywords: ["rice", "cooked rice", "basmati", "white rice", "brown rice", "chawal"],
        name: "Fragrant Zesty Homestyle Lemon Rice",
        prepTime: "3 mins",
        cookTime: "6 mins",
        totalTime: "9 mins",
        isVegetarian: true,
        dietaryTags: ["🥦 100% Vegetarian", "🍋 Vitamin C Rich", "⚡ Fast One-Pot"],
        matchIngredient: "rice",
        defaultQty: "1 - 2 cups cooked rice",
        optionalPantryAdditions: [
            "1-2 tbsp fresh lemon juice",
            "1 tsp cooking oil",
            "1/2 tsp mustard seeds & pinch of turmeric powder",
            "Salt to taste",
            "Optional: Handful of peanuts or green chili"
        ],
        steps: [
            "Fluff your inventory cooked rice gently with a fork so grains separate cleanly.",
            "Heat 1 tsp oil in a pan, add mustard seeds (and peanuts/chili if on hand) until aromatic.",
            "Stir in turmeric powder and salt, turn off heat, and immediately drizzle in fresh lemon juice.",
            "Pour the warm tempering over the rice and fold gently until every grain turns a cheerful sunny yellow. Enjoy warm!"
        ],
        healthBenefit: "Combines energizing complex carbohydrates with citric acid and Vitamin C, which improves iron absorption from plant foods.",
        vegetarianAlternative: "Naturally 100% vegan and gluten-free. For extra protein, toss in boiled chickpeas or green peas."
    },

    // --- EGGS ---
    {
        id: "recipe_veggie_omelet",
        keywords: ["egg", "eggs", "anda", "muttai"],
        name: "Fluffy Garden Vegetable Skillet Omelet",
        prepTime: "3 mins",
        cookTime: "5 mins",
        totalTime: "8 mins",
        isVegetarian: false,
        dietaryTags: ["🥚 Eggetarian", "💪 High Complete Protein", "🍳 Quick Breakfast"],
        matchIngredient: "egg",
        defaultQty: "2 eggs",
        optionalPantryAdditions: [
            "1 tsp cooking oil or butter",
            "Pinch of salt and black pepper",
            "Optional: Diced onion, tomato, or herbs from your fridge"
        ],
        steps: [
            "Crack your inventory eggs into a bowl, season with salt and black pepper, and beat briskly with a fork for 30 seconds until frothy.",
            "Heat 1 tsp oil in a small non-stick pan over medium flame.",
            "Pour the beaten eggs in, allowing them to spread across the pan. Sauté any chopped veggies if desired.",
            "Cook for 2-3 minutes until bottom is set, fold in half, and slide onto your plate."
        ],
        healthBenefit: "Offers all 9 essential amino acids, choline for cognitive health, and Vitamin D for metabolic vitality.",
        vegetarianAlternative: "Strict Vegetarian / Vegan Option: Swap eggs for 4 tbsp besan (chickpea flour) whisked with water to make a golden high-protein vegetable cheela!"
    },

    // --- WHEAT / FLOUR ---
    {
        id: "recipe_wheat_phulka",
        keywords: ["wheat", "flour", "atta", "maida", "whole wheat"],
        name: "Fresh Whole Wheat Homestyle Soft Phulka Rotis",
        prepTime: "6 mins",
        cookTime: "6 mins",
        totalTime: "12 mins",
        isVegetarian: true,
        dietaryTags: ["🥦 100% Vegetarian", "🌾 Whole Grain Fiber", "🥞 Traditional Staple"],
        matchIngredient: "flour",
        defaultQty: "1 - 2 cups",
        optionalPantryAdditions: [
            "Warm water to knead (approx 1/2 cup)",
            "Pinch of salt (optional)",
            "1/2 tsp ghee or oil (optional for soft finish)"
        ],
        steps: [
            "In a wide bowl, mix your inventory whole wheat flour with a pinch of salt. Gradually add warm water and knead for 3-4 minutes into a pliable, smooth dough.",
            "Divide into lemon-sized balls, dust lightly with dry flour, and roll out with a rolling pin into thin, even circles.",
            "Place on a hot tawa/skillet for 30 seconds until bubbles appear, flip, and cook the other side.",
            "Puff over the open flame or press gently with a clean cloth until ballooned. Serve warm!"
        ],
        healthBenefit: "Whole wheat flour is abundant in dietary insoluble fiber to nourish gut microbiome, regulate bowel movement, and balance blood sugar levels.",
        vegetarianAlternative: "Naturally 100% vegan. If avoiding gluten, swap whole wheat with jowar (sorghum) or bajra (millet) flour."
    },

    // --- FRUITS / APPLES ---
    {
        id: "recipe_cinnamon_apples",
        keywords: ["apple", "apples", "banana", "fruit", "fruits", "seb"],
        name: "Warm Cinnamon Stewed Spiced Fruit",
        prepTime: "3 mins",
        cookTime: "6 mins",
        totalTime: "9 mins",
        isVegetarian: true,
        dietaryTags: ["🥦 100% Vegetarian", "🍎 Gentle on Digestion", "🍯 Naturally Sweet"],
        matchIngredient: "fruit",
        defaultQty: "1 - 2 fruits",
        optionalPantryAdditions: [
            "2-3 tbsp water",
            "Pinch of ground cinnamon powder",
            "1 tsp honey, maple syrup, or jaggery (optional)"
        ],
        steps: [
            "Core and dice your inventory fruit into bite-sized pieces.",
            "Add to a small saucepan with 2-3 tablespoons of water and a pinch of ground cinnamon.",
            "Simmer over low heat for 5-6 minutes until soft, tender, and fragrant.",
            "Enjoy warm as a comforting gut-friendly snack, oatmeal topping, or healthy dessert."
        ],
        healthBenefit: "Cooking activates pectin, a prebiotic soluble fiber that strengthens the gut mucosal barrier and eases digestion.",
        vegetarianAlternative: "Naturally 100% plant-based, vegan, and gluten-free."
    }
];

// Synthesize dynamic beginner-friendly recipes for unique / custom inventory items
function synthesizeDynamicClientRecipe(foodItem) {
    const name = foodItem.name || "Produce";
    const qty = `${foodItem.quantity || 1} ${foodItem.unit || 'unit'}`;
    const status = calculateExpiryStatus(foodItem.expiryDate);
    const isUrgent = status.diffDays === 0 || status.diffDays === 1;
    const expiryLabel = status.diffDays === 0 ? "Expires today!" : (status.diffDays === 1 ? "Expires tomorrow!" : "");

    return {
        id: `custom_${String(foodItem._id || name).replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: `Healthy Homestyle Sautéed ${name}`,
        prepTime: "3 mins",
        cookTime: "7 mins",
        totalTime: "10 mins",
        isVegetarian: true,
        dietaryTags: ["🥦 100% Vegetarian", "🌱 Fresh & Wholesome", "⚡ Beginner Friendly"],
        matchIngredient: name,
        inventoryIngredients: [
            {
                name: name,
                quantity: qty,
                isExpiringSoon: isUrgent,
                expiryText: expiryLabel
            }
        ],
        optionalPantryAdditions: [
            "1 tsp cooking oil or olive oil",
            "1/2 tsp cumin seeds or mustard seeds (pantry staple)",
            "Pinch of salt, black pepper, and turmeric powder to taste",
            "2-3 tbsp water (to steam if needed)"
        ],
        steps: [
            `Rinse and chop your inventory ${name} into uniform, bite-sized pieces for even cooking.`,
            "Warm 1 tsp of cooking oil in a skillet over medium flame, then add cumin or mustard seeds until aromatic.",
            `Add the prepared ${name}, sprinkle lightly with salt and turmeric, and sauté for 3-4 minutes.`,
            "Add 2 tablespoons of water, cover with a lid on low heat, and steam for 5-6 minutes until tender and flavorful. Serve warm!"
        ],
        healthBenefit: `Provides clean, unrefined dietary fiber, essential micronutrients, and hydration straight from fresh ${name} without heavy fats or artificial seasonings.`,
        vegetarianAlternative: "Naturally 100% plant-based and vegan. Pairs wonderfully with steamed rice, flatbreads, or as a warm grain bowl topping.",
        donationOption: {
            message: `Have extra ${name} (${qty}) that you won't finish today? You can also list it for NGO donation to help feed those in need.`,
            foodId: foodItem._id || "",
            foodName: name,
            quantity: foodItem.quantity,
            unit: foodItem.unit
        }
    };
}

// Generate client-side AI recipes from inventory
function generateClientAIRecipes(validFoods) {
    if (!validFoods || validFoods.length === 0) {
        return [];
    }

    // Sort valid foods by urgency: expiring today (0) or tomorrow (1) first
    const sorted = [...validFoods].sort((a, b) => {
        const statA = calculateExpiryStatus(a.expiryDate);
        const statB = calculateExpiryStatus(b.expiryDate);
        return (statA.diffDays || 99) - (statB.diffDays || 99);
    });

    const matchedRecipes = [];
    const usedRecipeIds = new Set();

    for (const food of sorted) {
        const foodNameLower = (food.name || "").toLowerCase().trim();
        const foodCategoryLower = (food.category || "").toLowerCase().trim();
        const status = calculateExpiryStatus(food.expiryDate);
        const isExpiringSoon = status.diffDays === 0 || status.diffDays === 1;
        const expiryLabel = status.diffDays === 0 ? "Expires today!" : (status.diffDays === 1 ? "Expires tomorrow!" : "");

        const candidateKbs = CLIENT_RECIPE_KB.filter(kb => {
            if (usedRecipeIds.has(kb.id)) return false;
            return kb.keywords.some(kw => foodNameLower.includes(kw) || foodCategoryLower.includes(kw));
        });

        for (const kb of candidateKbs) {
            usedRecipeIds.add(kb.id);

            const recipe = {
                id: kb.id,
                name: kb.name,
                prepTime: kb.prepTime,
                cookTime: kb.cookTime,
                totalTime: kb.totalTime,
                isVegetarian: kb.isVegetarian,
                dietaryTags: [...kb.dietaryTags],
                matchIngredient: food.name,
                inventoryIngredients: [
                    {
                        name: food.name,
                        quantity: `${food.quantity} ${food.unit}`,
                        isExpiringSoon: isExpiringSoon,
                        expiryText: expiryLabel
                    }
                ],
                optionalPantryAdditions: kb.optionalPantryAdditions,
                steps: kb.steps,
                healthBenefit: kb.healthBenefit,
                vegetarianAlternative: kb.vegetarianAlternative,
                donationOption: {
                    message: `Have extra ${food.name} (${food.quantity} ${food.unit}) that you won't finish today? You can also list it for NGO donation to help feed those in need.`,
                    foodId: food._id || "",
                    foodName: food.name,
                    quantity: food.quantity,
                    unit: food.unit
                }
            };

            matchedRecipes.push(recipe);
            if (matchedRecipes.length >= 4) break;
        }

        if (matchedRecipes.length >= 4) break;
    }

    // Dynamic synthesis if items didn't match knowledge base
    if (matchedRecipes.length < 2) {
        for (const food of sorted) {
            const alreadyUsed = matchedRecipes.some(r => r.inventoryIngredients.some(i => i.name === food.name));
            if (!alreadyUsed) {
                matchedRecipes.push(synthesizeDynamicClientRecipe(food));
                if (matchedRecipes.length >= 3) break;
            }
        }
    }

    return matchedRecipes;
}

// Master AI Suggestions & Healthy Recipes Renderer
async function updateAISuggestions(foods, expiringCount) {
    const box = document.getElementById("aiSuggestionBox");
    const alerts = document.getElementById("expiryAlerts");

    if (!box) return;

    // Immediately clear cached recipes so stale suggestions never persist
    cachedAIRecipes = [];

    const user = getLoggedInUser();

    // Strictly filter out expired foods: NEVER recommend expired food for cooking or consumption!
    const validFoods = (Array.isArray(foods) ? foods : []).filter(f => {
        const status = calculateExpiryStatus(f.expiryDate);
        return status.isValid && !status.isExpired;
    });

    // When the inventory is empty, clear old recipe suggestions and show the empty message
    if (validFoods.length === 0) {
        cachedAIRecipes = [];
        box.innerHTML = `
            <div class="empty-ai-suggestion-box" style="text-align: center; padding: 28px 16px; color: #436251; background: #f0fdf4; border: 1px dashed #bbf7d0; border-radius: 12px; margin: 10px 0;">
                <div style="font-size: 36px; margin-bottom: 8px;">🥗</div>
                <h3 style="margin: 0 0 6px; color: #173b2a; font-size: 16px; font-weight: 700;">Your inventory is empty</h3>
                <p style="margin: 0; color: #5a7567; font-size: 13px;">Your inventory is empty. Add food items to get recipe suggestions.</p>
            </div>
        `;

        if (alerts) {
            alerts.innerHTML = '<p style="font-size: 13px; color: #5a7567; margin: 5px 0;">No items expiring. Your inventory is empty.</p>';
        }
        return;
    }

    let recipes = [];

    try {
        // Fetch recipes strictly for the currently logged-in user's inventory
        const endpoint = user && user.email
            ? `${API_BASE}/api/ai/recipes/${encodeURIComponent(user.email)}`
            : `${API_BASE}/api/ai/recipes`;

        const res = await fetch(endpoint, {
            method: user && user.email ? "GET" : "POST",
            headers: authHeaders({ "Content-Type": "application/json" }),
            body: user && user.email ? undefined : JSON.stringify({ foods: validFoods })
        });

        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.recipes)) {
                recipes = data.recipes;
            }
        } else {
            console.warn(`AI Recipe endpoint returned HTTP ${res.status}`);
        }
    } catch (e) {
        console.warn("Could not fetch remote recipes, synthesizing suggestions from current inventory:", e);
    }

    // Handle API failures without displaying outdated recipes: synthesize ONLY from current validFoods
    if (!recipes || recipes.length === 0) {
        recipes = generateClientAIRecipes(validFoods);
    }

    // Strict validation: Ensure suggestions use only the user's current validFoods
    recipes = (Array.isArray(recipes) ? recipes : []).filter(r => {
        return r.inventoryIngredients && r.inventoryIngredients.some(ing => {
            return validFoods.some(vf => (vf.name || "").toLowerCase().trim() === (ing.name || "").toLowerCase().trim());
        });
    });

    cachedAIRecipes = recipes;

    // Render healthy recipes in the AI Suggestion Box
    if (recipes.length > 0) {
        const recipeCardsHtml = recipes.map(recipe => {
            const inventoryTags = (recipe.inventoryIngredients || []).map(ing => {
                const badge = ing.isExpiringSoon
                    ? `<span style="background: #fef3c7; color: #b45309; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: 700; border: 1px solid #fde68a; margin-left: 4px;">⏳ ${escapeHtml(ing.expiryText || 'Expires soon')}</span>`
                    : '';
                return `
                    <span class="recipe-ingredient-tag">
                        🛒 ${escapeHtml(ing.name)} (${escapeHtml(ing.quantity)})${badge}
                    </span>
                `;
            }).join("");

            const pantryList = (recipe.optionalPantryAdditions || []).map(opt => `&bull; ${escapeHtml(opt)}`).join("<br>");
            const optionalPantryHtml = pantryList ? `
                <div class="recipe-optional-box" style="margin-bottom: 10px;">
                    <strong style="color: #475569;">🧂 Optional Pantry Additions:</strong><br>
                    ${pantryList}
                </div>
            ` : '';

            const stepsHtml = (recipe.steps || []).map(step => `<li>${escapeHtml(step)}</li>`).join("");

            const donationBtnHtml = recipe.donationOption && recipe.donationOption.foodName ? `
                <button class="btn-sm btn-outline" onclick="quickDonateFood('${recipe.donationOption.foodId}', '${escapeHtml(recipe.donationOption.foodName)}', '${recipe.donationOption.quantity || 1}', '${escapeHtml(recipe.donationOption.unit || 'portion')}')" style="border-color: #2e8b57; color: #2e8b57; font-weight: 600;">
                    🤝 Donate Extra (${escapeHtml(recipe.donationOption.foodName)})
                </button>
            ` : '';

            return `
                <div class="ai-recipe-card" id="recipe-${recipe.id}">
                    <div class="ai-recipe-header">
                        <div>
                            <h4 class="ai-recipe-title">${escapeHtml(recipe.name)}</h4>
                            <div class="ai-recipe-meta">
                                <span>⏱️ Prep: ${escapeHtml(recipe.prepTime)} &bull; Cook: ${escapeHtml(recipe.cookTime)}</span>
                                <span class="recipe-badge-veg">${recipe.isVegetarian ? '🥦 100% Vegetarian' : '🥗 Fresh'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="ai-recipe-body">
                        <div class="recipe-section-label">🛒 From Your Inventory:</div>
                        <div class="recipe-ingredients-list">
                            ${inventoryTags}
                        </div>
                        ${optionalPantryHtml}
                        <div class="recipe-section-label" style="margin-top: 10px;">👩‍🍳 Simple Steps:</div>
                        <ol class="recipe-steps-list">
                            ${stepsHtml}
                        </ol>
                        <div class="recipe-benefit-callout">
                            <strong>💚 Health Benefit:</strong> ${escapeHtml(recipe.healthBenefit)}
                        </div>
                        ${recipe.vegetarianAlternative ? `
                            <div class="recipe-alt-callout">
                                <strong>🌱 Vegetarian Alternative:</strong> ${escapeHtml(recipe.vegetarianAlternative)}
                            </div>
                        ` : ''}
                        <div class="recipe-actions">
                            <button class="btn-sm btn-primary" onclick="openAiRecipeModal('${recipe.id}')">
                                👨‍🍳 Cook / View Full Recipe
                            </button>
                            ${donationBtnHtml}
                        </div>
                    </div>
                </div>
            `;
        }).join("");

        const urgentNotice = expiringCount > 0
            ? `<div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; color: #92400e; font-size: 13px;">
                <span style="font-size: 20px;">⚡</span>
                <div>
                    <strong>Action Priority:</strong> ${expiringCount} item(s) are nearing their expiry date. The recipes below prioritize your urgent food so nothing goes to waste!
                </div>
               </div>`
            : '';

        box.innerHTML = `
            ${urgentNotice}
            <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                <h3 style="margin: 0; color: #173b2a; font-size: 17px; font-weight: 700;">
                    🤖 Smart AI Recipes Tailored To Your Inventory
                </h3>
                <span style="font-size: 12px; color: #5a7567; font-weight: 600;">
                    ${recipes.length} healthy zero-waste ideas generated
                </span>
            </div>
            <div class="ai-recipe-grid">
                ${recipeCardsHtml}
            </div>
        `;
    } else {
        box.innerHTML = `
            <div class="empty-ai-suggestion-box" style="text-align: center; padding: 28px 16px; color: #436251; background: #f0fdf4; border: 1px dashed #bbf7d0; border-radius: 12px; margin: 10px 0;">
                <div style="font-size: 36px; margin-bottom: 8px;">🥗</div>
                <h3 style="margin: 0 0 6px; color: #173b2a; font-size: 16px; font-weight: 700;">Your inventory is empty</h3>
                <p style="margin: 0; color: #5a7567; font-size: 13px;">Your inventory is empty. Add food items to get recipe suggestions.</p>
            </div>
        `;
    }

    // Update Expiry Alerts list in the assistant section
    if (alerts) {
        alerts.innerHTML = "";

        const criticalItems = (Array.isArray(foods) ? foods : []).filter(f => {
            const status = calculateExpiryStatus(f.expiryDate);
            return status.isValid && (status.diffDays <= 5 || status.isExpired);
        });

        if (criticalItems.length > 0) {
            criticalItems.forEach(f => {
                const status = calculateExpiryStatus(f.expiryDate);
                const item = document.createElement("div");
                item.className = "ai-food-item" + (status.isExpired ? " expired-item" : "");

                let alertBadge = "";
                if (status.isExpired) {
                    alertBadge = `❌ ${status.statusText} (${escapeHtml(f.expiryDate)}) - Do Not Consume`;
                } else if (status.diffDays === 0) {
                    alertBadge = `⏰ ${status.statusText}! (0 days remaining)`;
                } else if (status.diffDays === 1) {
                    alertBadge = `⏳ ${status.statusText}! (1 day remaining)`;
                } else {
                    alertBadge = `⏳ ${status.statusText}`;
                }

                item.innerHTML = `
                    <div style="flex: 1;">
                        <strong>${escapeHtml(f.name)}</strong> (${f.quantity} ${escapeHtml(f.unit)})
                        <div style="font-size: 12px; font-weight: 600; color: ${status.isExpired ? '#b91c1c' : (status.diffDays <= 1 ? '#dc2626' : '#b45309')}; margin-top: 2px;">
                            ${alertBadge}
                        </div>
                    </div>
                    ${!status.isExpired ? `
                        <div style="display: flex; gap: 6px;">
                            <button class="btn-sm btn-outline" onclick="viewRecipesForFood('${escapeHtml(f.name)}')">
                                👨‍🍳 Recipes
                            </button>
                            <button class="btn-sm btn-primary" onclick="quickDonateFood('${f._id}', '${escapeHtml(f.name)}', ${f.quantity}, '${escapeHtml(f.unit)}')">
                                🤝 Donate
                            </button>
                        </div>
                    ` : '<span style="font-size: 11px; color: #991b1b; font-weight: 700; padding: 4px;">Expired (Discard/Compost)</span>'}
                `;
                alerts.appendChild(item);
            });
        } else {
            alerts.innerHTML = '<p style="font-size: 13px; color: #5a7567; margin: 5px 0;">No items expiring in the next 5 days. All inventory is fresh.</p>';
        }
    }
}

// Focus / Filter recipes for a specific food item
function viewRecipesForFood(foodName) {
    const sec = document.getElementById("householdAISection");
    if (sec) {
        sec.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const box = document.getElementById("aiSuggestionBox");
    if (box) {
        box.classList.remove("highlight-pulse");
        void box.offsetWidth;
        box.classList.add("highlight-pulse");
    }

    // Try finding matching recipe in cache
    const lower = (foodName || "").toLowerCase();
    const match = cachedAIRecipes.find(r =>
        (r.name && r.name.toLowerCase().includes(lower)) ||
        (r.matchIngredient && r.matchIngredient.toLowerCase().includes(lower)) ||
        (r.inventoryIngredients && r.inventoryIngredients.some(i => i.name.toLowerCase().includes(lower)))
    );

    if (match) {
        openAiRecipeModal(match.id);
    }
}

// Open comprehensive cooking modal with full steps and donation option
function openAiRecipeModal(recipeId) {
    const container = document.getElementById("workflowModalContainer");
    if (!container) return;

    const recipe = cachedAIRecipes.find(r => r.id === recipeId) || cachedAIRecipes[0];
    if (!recipe) return;

    const inventoryItemsHtml = (recipe.inventoryIngredients || []).map(ing => `
        <li style="margin-bottom: 4px;">
            <strong>${escapeHtml(ing.name)}</strong>: ${escapeHtml(ing.quantity)}
            ${ing.expiryText ? `<span style="background: #fef3c7; color: #b45309; padding: 2px 6px; border-radius: 10px; font-size: 11px; font-weight: 700; margin-left: 6px;">${escapeHtml(ing.expiryText)}</span>` : ''}
        </li>
    `).join("");

    const pantryItemsHtml = (recipe.optionalPantryAdditions || []).map(p => `
        <li style="margin-bottom: 4px; color: #64748b;">${escapeHtml(p)}</li>
    `).join("");

    const stepsHtml = (recipe.steps || []).map(s => `
        <li style="margin-bottom: 10px; line-height: 1.6; color: #334155;">${escapeHtml(s)}</li>
    `).join("");

    const donationMsg = recipe.donationOption ? `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-top: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px;">
                <h5 style="margin: 0 0 4px; color: #166534; font-size: 14px; font-weight: 700;">🤝 Surplus Redistribution Option</h5>
                <p style="margin: 0; color: #15803d; font-size: 12px;">${escapeHtml(recipe.donationOption.message)}</p>
            </div>
            ${recipe.donationOption.foodName ? `
                <button class="btn-sm btn-primary" onclick="closeWorkflowModal(); quickDonateFood('${recipe.donationOption.foodId}', '${escapeHtml(recipe.donationOption.foodName)}', '${recipe.donationOption.quantity || 1}', '${escapeHtml(recipe.donationOption.unit || 'portion')}');">
                    Donate Surplus Now
                </button>
            ` : ''}
        </div>
    ` : '';

    container.innerHTML = `
        <div class="custom-modal-backdrop" onclick="if(event.target === this) closeWorkflowModal()">
            <div class="custom-modal-card" style="max-width: 650px;">
                <div class="custom-modal-header" style="background: #f0fdf4; border-bottom: 1px solid #dcfce7; padding: 16px 20px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <span class="recipe-badge-veg">${recipe.isVegetarian ? '🥦 100% Vegetarian' : '🥗 Fresh'}</span>
                            <span style="font-size: 12px; color: #15803d; font-weight: 600;">⏱️ Prep: ${escapeHtml(recipe.prepTime)} &bull; Total: ${escapeHtml(recipe.totalTime || recipe.cookTime)}</span>
                        </div>
                        <h3 style="margin: 0; color: #173b2a; font-size: 18px;">👨‍🍳 ${escapeHtml(recipe.name)}</h3>
                    </div>
                    <button class="custom-modal-close" onclick="closeWorkflowModal()">&times;</button>
                </div>
                <div class="custom-modal-body" style="padding: 20px; max-height: 75vh; overflow-y: auto;">
                    <div style="margin-bottom: 16px;">
                        <h4 style="margin: 0 0 8px; color: #173b2a; font-size: 14px; font-weight: 700;">🛒 Ingredients From Your Inventory</h4>
                        <ul style="padding-left: 20px; margin: 0; font-size: 13px; color: #1f2937;">
                            ${inventoryItemsHtml}
                        </ul>
                    </div>

                    ${pantryItemsHtml ? `
                        <div style="margin-bottom: 16px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px 16px;">
                            <h4 style="margin: 0 0 6px; color: #475569; font-size: 13px; font-weight: 700;">🧂 Optional Pantry Additions (Use whatever you have)</h4>
                            <ul style="padding-left: 20px; margin: 0; font-size: 12px;">
                                ${pantryItemsHtml}
                            </ul>
                        </div>
                    ` : ''}

                    <div style="margin-bottom: 16px;">
                        <h4 style="margin: 0 0 8px; color: #173b2a; font-size: 14px; font-weight: 700;">👩‍🍳 Step-by-Step Cooking Instructions</h4>
                        <ol style="padding-left: 20px; margin: 0; font-size: 13px;">
                            ${stepsHtml}
                        </ol>
                    </div>

                    <div class="recipe-benefit-callout" style="margin-bottom: 12px;">
                        <strong>💚 Health & Wellness Benefit:</strong> ${escapeHtml(recipe.healthBenefit)}
                    </div>

                    ${recipe.vegetarianAlternative ? `
                        <div class="recipe-alt-callout" style="margin-bottom: 12px;">
                            <strong>🌱 Vegetarian / Dietary Alternative:</strong> ${escapeHtml(recipe.vegetarianAlternative)}
                        </div>
                    ` : ''}

                    ${donationMsg}
                </div>
                <div class="custom-modal-footer" style="padding: 12px 20px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                    <button class="btn-sm btn-outline" onclick="closeWorkflowModal()">Close</button>
                    <button class="btn-sm btn-primary" onclick="closeWorkflowModal(); alert('🎉 Happy Cooking! Enjoy your healthy zero-waste meal.');">
                        ✅ Cook This Meal
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Interactive assistant shortcut action
function showAISuggestion() {
    const sec = document.getElementById("householdAISection");
    if (sec) {
        sec.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const box = document.getElementById("aiSuggestionBox");
    if (box) {
        box.classList.remove("highlight-pulse");
        void box.offsetWidth;
        box.classList.add("highlight-pulse");
    }

    if (cachedAIRecipes && cachedAIRecipes.length > 0) {
        openAiRecipeModal(cachedAIRecipes[0].id);
    } else {
        alert("🥗 Your inventory is empty. Add food items to get recipe suggestions.");
    }
}

function showFoodTip() {
    alert("♻️ ZeroWaste Food Preservation Tip:\n\nStore ripe tomatoes at room temperature away from direct sunlight to preserve flavor and juiciness. For long storage, puree and freeze into meal portions!");
}

/* ========================================================
   DONATION CREATION (Requirements 1 & 2)
======================================================== */

function selectDonationType(type) {
    const typeInput = document.getElementById("donationType");
    const freeCard = document.getElementById("typeCardFree");
    const valueCard = document.getElementById("typeCardValue");
    const expectedGroup = document.getElementById("expectedValueGroup");

    if (typeInput) typeInput.value = type;

    if (type === "value_based") {
        if (valueCard) valueCard.classList.add("selected");
        if (freeCard) freeCard.classList.remove("selected");
        if (expectedGroup) expectedGroup.style.display = "block";
        const expAmount = document.getElementById("donationExpectedAmount");
        if (expAmount) expAmount.required = true;
    } else {
        if (freeCard) freeCard.classList.add("selected");
        if (valueCard) valueCard.classList.remove("selected");
        if (expectedGroup) expectedGroup.style.display = "none";
        const expAmount = document.getElementById("donationExpectedAmount");
        if (expAmount) {
            expAmount.required = false;
            expAmount.value = "";
        }
    }
}

function setQuickPhoto(sampleType) {
    const photos = {
        tomatoes: "images/food/tomatoes.svg",
        biryani: "images/food/biryani.svg",
        vegetables: "images/food/vegetables.svg",
        fruits: "images/food/fruits.svg"
    };

    const url = photos[sampleType] || photos.tomatoes;
    const hiddenUrlInput = document.getElementById("donationPhotoUrl");
    const preview = document.getElementById("donationPhotoPreview");

    if (hiddenUrlInput) hiddenUrlInput.value = url;
    if (preview) {
        preview.innerHTML = `<img src="${url}" onerror="handleImageError(this, '', false)" style="width: 120px; height: 90px; object-fit: cover; border-radius: 8px; border: 2px solid #2e8b57;">`;
    }
}

function previewSelectedPhoto(fileInput) {
    const preview = document.getElementById("donationPhotoPreview");
    const hiddenUrlInput = document.getElementById("donationPhotoUrl");
    if (!fileInput.files || !fileInput.files[0]) return;

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        if (hiddenUrlInput) hiddenUrlInput.value = e.target.result;
        if (preview) {
            preview.innerHTML = `<img src="${e.target.result}" onerror="handleImageError(this, '', false)" style="width: 120px; height: 90px; object-fit: cover; border-radius: 8px; border: 2px solid #2e8b57;">`;
        }
    };
    reader.readAsDataURL(file);
}

// Publish Food Donation
let isSubmittingFoodDonation = false;
async function submitDonation(event) {
    if (event) event.preventDefault();
    if (isSubmittingFoodDonation) return;

    const user = getLoggedInUser();
    if (!user) {
        alert("Please log in first.");
        return;
    }

    const type = document.getElementById("donationType")?.value || "free";
    const expectedAmount = type === "value_based"
        ? Number(document.getElementById("donationExpectedAmount")?.value || 0)
        : 0;

    const foodSelect = document.getElementById("donationFood");
    let foodId = foodSelect?.value || "";
    let foodName = "";

    if (foodId === "CUSTOM") {
        foodName = document.getElementById("customFoodName")?.value.trim();
        foodId = "custom_" + Date.now();
    } else if (foodSelect && foodSelect.selectedIndex > 0) {
        const selOpt = foodSelect.options[foodSelect.selectedIndex];
        if (selOpt.dataset.expired === "true") {
            alert("⚠️ Cannot donate expired food. Please select fresh food items.");
            return;
        }
        foodName = selOpt.dataset.name || selOpt.text;
    }

    if (!foodName) {
        foodName = document.getElementById("customFoodName")?.value.trim() || "Surplus Food";
    }

    const quantity = document.getElementById("donationQuantity")?.value;
    const unit = document.getElementById("donationUnit")?.value;
    const donorName = document.getElementById("donationDonorName")?.value.trim() || user.name || "Registered Donor";
    const donorContact = document.getElementById("donationDonorContact")?.value.trim() || user.contactNumber || "";
    const donorLocation = document.getElementById("donationLocation")?.value.trim() || user.address || "Coimbatore";
    const description = document.getElementById("donationDescription")?.value.trim() || "";
    let photo = document.getElementById("donationPhotoUrl")?.value;
    if (!photo || photo.includes("images.unsplash.com")) {
        photo = getItemImage(foodName, "Household Surplus", false);
    }

    if (!foodName || !quantity || !unit || !donorLocation) {
        alert("Please fill all required donation details.");
        return;
    }

    if (Number(quantity) <= 0) {
        alert("Please enter a valid quantity greater than zero.");
        return;
    }

    const submitBtn = document.getElementById("submitDonationBtn");
    const originalBtnText = submitBtn ? submitBtn.innerText : "";

    try {
        isSubmittingFoodDonation = true;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = "Publishing Food Donation...";
        }

        const payload = {
            foodId: foodId,
            foodName: foodName,
            quantity: Number(quantity),
            unit: unit,
            category: "Household Surplus",
            donorName: donorName,
            donorContact: donorContact,
            donorAddress: user.address || donorLocation,
            location: donorLocation,
            pickupLocation: donorLocation,
            description: description,
            photo: photo,
            donationType: type,
            expectedAmount: expectedAmount
        };

        const res = await fetch(`${API_BASE}/api/donations`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
            alert("❌ " + (data.message || "Failed to create donation."));
            return;
        }

        alert(`🤝 Food Donation Created Successfully!\n\nType: ${type === 'value_based' ? 'Value-Based (₹' + expectedAmount + ')' : 'Free Community Donation (₹0)'}\nStatus: Available for NGO pickup.`);

        // Clear form
        document.getElementById("donationQuantity").value = "";
        document.getElementById("donationDescription").value = "";
        document.getElementById("donationPhotoUrl").value = "";
        const preview = document.getElementById("donationPhotoPreview");
        if (preview) preview.innerHTML = "";

        // Reload views
        loadMyDonations();
        loadDonorStats();
    } catch (e) {
        console.error("Donation creation error:", e);
        alert("❌ Error publishing donation.");
    } finally {
        isSubmittingFoodDonation = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = originalBtnText || "🤝 Publish Food Donation";
        }
    }
}

/* ========================================================
   DONOR "MY DONATIONS" & TRANSACTION WORKFLOW
======================================================== */

async function loadMyDonations() {
    const user = getLoggedInUser();
    if (!user) return;

    try {
        const res = await fetch(`${API_BASE}/api/donations/user/${encodeURIComponent(user.email)}`, {
            headers: authHeaders()
        });

        if (res.status === 401 || res.status === 403) {
            console.warn("Session expired loading donations, redirecting to login...");
            logoutUser();
            return;
        }

        if (res.ok) {
            const data = await res.json();
            cachedDonations = Array.isArray(data) ? data : [];
        } else {
            cachedDonations = [];
        }
        renderDonorDonations();

        const activeDonationsCount = (cachedDonations || []).filter(d =>
            !["completed", "cancelled"].includes((d.donationStatus || d.status || "").toLowerCase())
        ).length;
        const donationCountEl = document.getElementById("donationCount");
        if (donationCountEl) donationCountEl.innerText = activeDonationsCount;
    } catch (e) {
        console.error("Error loading donations:", e);
    }
}

function filterDonorDonations(filter, tabEl) {
    currentDonorFilter = filter;
    document.querySelectorAll(".status-filter-tabs .filter-tab").forEach(t => t.classList.remove("active"));
    if (tabEl) tabEl.classList.add("active");
    renderDonorDonations();
}

function renderDonorDonations() {
    const container = document.getElementById("donationList");
    if (!container) return;

    let items = cachedDonations || [];
    if (currentDonorFilter !== "all") {
        items = items.filter(d => (d.donationStatus || d.status || "").toLowerCase() === currentDonorFilter.toLowerCase());
    }

    if (items.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: white; border-radius: 12px; border: 1px dashed #c0d8cb;">
                <p style="font-size: 16px; color: #5a7567; margin-bottom: 10px;">No donations match the '${currentDonorFilter}' filter.</p>
                <button class="btn-sm btn-primary" onclick="scrollToDonationForm()">+ Create New Donation</button>
            </div>
        `;
        return;
    }

    container.innerHTML = items.map(d => generateDonorDonationCardHtml(d)).join("");
}

function generateDonorDonationCardHtml(d) {
    const isCrop = !!d.cropName;
    const itemName = d.cropName || d.foodName || "Surplus Item";
    const status = (d.donationStatus || d.status || "available").toLowerCase();
    const isValueBased = d.donationType === "value_based";
    const expectedVal = d.expectedAmount || 0;
    const agreedVal = d.agreedAmount || expectedVal || 0;
    const paymentStatus = d.paymentStatus || "not_applicable";
    const photo = getItemImage(itemName, d.category, isCrop, d.photo);

    const statusSteps = ["available", "requested", "accepted", "collection_scheduled", "collected", "completed"];
    const currentStepIdx = statusSteps.indexOf(status);

    return `
        <div class="donation-order-card" id="card-${d._id}">
            <div class="card-top-banner">
                <img src="${photo}" alt="${escapeHtml(itemName)}" onerror="handleImageError(this, '${escapeHtml(d.category || '')}', ${isCrop})">
                <div class="card-badge-overlay">
                    <span class="status-badge badge-${status}">
                        ● ${formatStatusLabel(status)}
                    </span>
                </div>
                <div class="card-type-tag">
                    ${isValueBased ? '💰 Value-Based' : '💚 Free Donation'}
                </div>
            </div>

            <div class="donation-order-body">
                <div class="donation-order-title">
                    <span>${isCrop ? '🌾' : '🍎'} ${escapeHtml(itemName)}</span>
                    <span class="donation-order-qty">${d.quantity} ${escapeHtml(d.unit)}</span>
                </div>

                <!-- Financial Valuation Display -->
                <div class="donation-value-box">
                    <div>
                        <div class="donation-value-main">
                            ${isValueBased
            ? (agreedVal && status !== 'available' && status !== 'requested'
                ? `₹${agreedVal} <span style="font-size:12px;font-weight:normal;color:#6b8577;">(Agreed)</span>`
                : `₹${expectedVal} <span style="font-size:12px;font-weight:normal;color:#6b8577;">(Expected)</span>`)
            : '<span style="color:#2e8b57;">💚 Free Donation</span>'}
                        </div>
                        <div class="donation-value-sub">
                            ${isValueBased ? 'Fair value cost recovery' : 'Complimentary community redistribution'}
                        </div>
                    </div>
                    <div>
                        ${generatePaymentBadgeHtml(paymentStatus, isValueBased, agreedVal)}
                    </div>
                </div>

                <!-- Details Rows -->
                <div class="info-row">
                    <span>📍</span>
                    <span><strong>Pickup Location:</strong> ${escapeHtml(d.pickupLocation || d.location || 'Coimbatore')}</span>
                </div>

                <div class="info-row">
                    <span>📞</span>
                    <span><strong>Registered Contact:</strong> ${escapeHtml(d.donorContact || '[Contact on File]')}</span>
                </div>

                <!-- NGO Details Box if requested/accepted -->
                ${d.ngoName ? `
                    <div class="ngo-partner-box">
                        <strong>🤝 Assigned NGO:</strong> ${escapeHtml(d.ngoName)}<br>
                        ${d.ngoContact ? `📞 Contact: <a href="tel:${escapeHtml(d.ngoContact)}">${escapeHtml(d.ngoContact)}</a> | ` : ''}
                        📧 ${escapeHtml(d.ngoEmail || '')}
                    </div>
                ` : ''}

                <!-- Scheduled Pickup Box -->
                ${(status === 'collection_scheduled' || d.pickupDate) ? `
                    <div class="pickup-schedule-box">
                        <strong>📅 Collection Scheduled:</strong><br>
                        📅 ${escapeHtml(d.pickupDate || '')} at ⏰ ${escapeHtml(d.pickupTime || '')}<br>
                        📍 ${escapeHtml(d.pickupLocation || d.location || '')}
                    </div>
                ` : ''}

                <!-- 6-Step Visual Progress Stepper -->
                <div class="donation-stepper">
                    <div class="step-node ${currentStepIdx >= 0 ? (currentStepIdx === 0 ? 'active' : 'completed') : ''}">
                        <div class="step-circle">${currentStepIdx > 0 ? '✓' : '1'}</div>
                        <span>Listed</span>
                    </div>
                    <div class="step-node ${currentStepIdx >= 1 ? (currentStepIdx === 1 ? 'active' : 'completed') : ''}">
                        <div class="step-circle">${currentStepIdx > 1 ? '✓' : '2'}</div>
                        <span>Request</span>
                    </div>
                    <div class="step-node ${currentStepIdx >= 2 ? (currentStepIdx === 2 ? 'active' : 'completed') : ''}">
                        <div class="step-circle">${currentStepIdx > 2 ? '✓' : '3'}</div>
                        <span>Accept</span>
                    </div>
                    <div class="step-node ${currentStepIdx >= 3 ? (currentStepIdx === 3 ? 'active' : 'completed') : ''}">
                        <div class="step-circle">${currentStepIdx > 3 ? '✓' : '4'}</div>
                        <span>Pickup</span>
                    </div>
                    <div class="step-node ${currentStepIdx >= 4 ? (currentStepIdx === 4 ? 'active' : 'completed') : ''}">
                        <div class="step-circle">${currentStepIdx > 4 ? '✓' : '5'}</div>
                        <span>Collected</span>
                    </div>
                    <div class="step-node ${currentStepIdx >= 5 ? 'completed active' : ''}">
                        <div class="step-circle">${currentStepIdx >= 5 ? '✓' : '6'}</div>
                        <span>Complete</span>
                    </div>
                </div>

                <!-- STATE SPECIFIC ACTIONS FOR DONOR -->
                <div class="card-action-bar">
                    ${status === 'requested' ? `
                        <div style="width: 100%; margin-bottom: 8px;">
                            ${isValueBased ? `
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; background: #fff9e6; padding: 8px; border-radius: 6px; font-size: 13px;">
                                    <label style="font-weight: 700; color: #b45309;">Agreed Amount (₹):</label>
                                    <input type="number" id="agreedInput-${d._id}" value="${expectedVal}" style="width: 100px; padding: 6px; font-weight: bold; border: 1px solid #d97706; border-radius: 4px;">
                                    <span style="font-size: 11px; color: #78350f;">(Expected: ₹${expectedVal})</span>
                                </div>
                            ` : ''}
                            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                <button class="btn-sm btn-primary" onclick="donorAcceptRequest('${d._id}', ${isCrop}, ${isValueBased})">
                                    ✅ Accept Request
                                </button>
                                <button class="btn-sm btn-danger-outline" onclick="donorRejectRequest('${d._id}', ${isCrop})">
                                    ❌ Decline
                                </button>
                            </div>
                        </div>
                    ` : ''}

                    ${status === 'accepted' ? `
                        <button class="btn-sm btn-blue" onclick="openScheduleModal('${d._id}', ${isCrop}, '${escapeHtml(d.pickupLocation || d.location || '')}')">
                            📅 Schedule Pickup
                        </button>
                    ` : ''}

                    ${status === 'collection_scheduled' ? `
                        <a class="btn-sm btn-directions" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(d.pickupLocation || d.location || 'Coimbatore')}" target="_blank">
                            🚗 Directions
                        </a>
                        <button class="btn-sm btn-outline" onclick="openScheduleModal('${d._id}', ${isCrop}, '${escapeHtml(d.pickupLocation || d.location || '')}')">
                            ✏️ Reschedule
                        </button>
                    ` : ''}

                    ${status === 'collected' ? `
                        <div style="width: 100%; margin-bottom: 8px; font-size: 13px; color: #166534; background: #f0fdf4; padding: 8px; border-radius: 6px;">
                            🎉 Donation successfully collected by <strong>${escapeHtml(d.ngoName || 'NGO')}</strong>.
                        </div>
                        ${isValueBased && paymentStatus !== 'paid' ? `
                            <button class="btn-sm btn-amber" onclick="openPaymentModal('${d._id}', ${isCrop}, ${agreedVal})">
                                💰 Mark Payment Received
                            </button>
                        ` : ''}
                        <button class="btn-sm btn-primary" onclick="donorCompleteDonation('${d._id}', ${isCrop})">
                            🏁 Mark as Completed
                        </button>
                    ` : ''}

                    ${status === 'completed' ? `
                        <button class="btn-sm btn-primary" onclick="openReceiptModal('${d._id}', ${isCrop})">
                            🧾 View Receipt
                        </button>
                    ` : ''}

                    <!-- Donor Cancellation / Withdrawal action for available or requested listings -->
                    ${(status === 'available' || status === 'requested') ? `
                        <button class="btn-sm btn-danger-outline" onclick="donorCancelDonation('${d._id}', ${isCrop})">
                            🚫 Withdraw Listing
                        </button>
                    ` : ''}

                    <!-- Full Timeline Audit Drawer Trigger -->
                    <button class="btn-sm btn-outline" onclick="toggleTimelineDrawer('${d._id}')">
                        📜 Timeline
                    </button>
                </div>

                <!-- Collapsible Timeline Drawer -->
                <div id="timeline-${d._id}" style="display: none; margin-top: 15px; border-top: 1px dashed #d0dfd6; padding-top: 10px;">
                    <h5 style="font-size: 13px; color: #173b2a; margin-bottom: 8px;">Audit History & Verification:</h5>
                    <ul class="audit-timeline">
                        ${(d.timeline && d.timeline.length > 0)
            ? d.timeline.map(t => `
                                <li class="audit-timeline-item">
                                    <div class="audit-timeline-title">${escapeHtml(t.event)}</div>
                                    <div class="audit-timeline-meta">${formatDate(t.timestamp)} • ${escapeHtml(t.actor || 'System')}</div>
                                    <div class="audit-timeline-details">${escapeHtml(t.details || '')}</div>
                                </li>
                            `).join("")
            : '<li class="audit-timeline-item">Donation Created</li>'
        }
                    </ul>
                </div>
            </div>
        </div>
    `;
}

function formatStatusLabel(status) {
    const map = {
        available: "Available",
        requested: "Requested",
        accepted: "Accepted",
        collection_scheduled: "Collection Scheduled",
        collected: "Collected",
        completed: "Completed",
        cancelled: "Cancelled"
    };
    return map[status] || status.toUpperCase();
}

function generatePaymentBadgeHtml(paymentStatus, isValueBased, amount) {
    if (!isValueBased) {
        return '<span class="payment-badge payment-free">💚 Free (₹0)</span>';
    }
    if (paymentStatus === "paid") {
        return `<span class="payment-badge payment-paid">✅ Paid (₹${amount})</span>`;
    }
    return `<span class="payment-badge payment-pending">⏳ Due: ₹${amount}</span>`;
}

function toggleTimelineDrawer(id) {
    const el = document.getElementById(`timeline-${id}`);
    if (el) {
        el.style.display = el.style.display === "none" ? "block" : "none";
    }
}

/* ========================================================
   DONOR STATE ACTION HANDLERS
======================================================== */

async function donorAcceptRequest(id, isCrop, isValueBased) {
    let agreedAmount = 0;

    if (isValueBased) {
        const input = document.getElementById(`agreedInput-${id}`);
        agreedAmount = input ? Number(input.value) : 0;
        if (agreedAmount < 0) {
            alert("Agreed amount cannot be negative.");
            return;
        }
    }

    try {
        const endpoint = isCrop ? `/api/crop-donations/${id}/accept` : `/api/donations/${id}/accept`;
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ agreedAmount: agreedAmount })
        });

        const data = await res.json();
        if (!res.ok) {
            alert("❌ " + (data.message || "Failed to accept request."));
            return;
        }

        alert(`✅ Request Accepted!\nAgreed Amount: ₹${agreedAmount}\nStatus is now ACCEPTED. The NGO can now see your contact details to schedule collection.`);
        if (isCrop) {
            loadFarmerCropDonations();
        } else {
            loadMyDonations();
        }
        loadDonorStats();
    } catch (e) {
        alert("❌ Error accepting request.");
    }
}

async function donorRejectRequest(id, isCrop) {
    if (!confirm("Decline this NGO's request? The donation will return to 'Available' status for other NGOs.")) return;

    try {
        const endpoint = isCrop ? `/api/crop-donations/${id}/reject` : `/api/donations/${id}/reject`;
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ reason: "Declined by donor." })
        });

        if (res.ok) {
            alert("Request declined. Listing returned to Available marketplace.");
            if (isCrop) {
                loadFarmerCropDonations();
            } else {
                loadMyDonations();
            }
            loadDonorStats();
        }
    } catch (e) {
        alert("❌ Error declining request.");
    }
}

async function donorCompleteDonation(id, isCrop) {
    try {
        const endpoint = isCrop ? `/api/crop-donations/${id}/complete` : `/api/donations/${id}/complete`;
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: "PUT",
            headers: authHeaders()
        });

        const data = await res.json();
        if (!res.ok) {
            alert("❌ " + (data.message || "Failed to complete donation."));
            return;
        }

        alert(`🎉 Donation Completed Successfully!\nReceipt ID: ${data.donation.receiptId}\nClick 'View Receipt' to print or review the official transaction record.`);
        if (isCrop) {
            loadFarmerCropDonations();
        } else {
            loadMyDonations();
        }
        loadDonorStats();
    } catch (e) {
        alert("❌ Error completing donation.");
    }
}

async function donorCancelDonation(id, isCrop) {
    if (!confirm("Are you sure you want to withdraw this donation listing? It will no longer be available to NGOs.")) {
        return;
    }

    try {
        const endpoint = isCrop ? `/api/crop-donations/${id}/cancel` : `/api/donations/${id}/cancel`;
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ reason: "Withdrawn by donor." })
        });

        const data = await res.json();
        if (res.ok) {
            alert("✅ " + data.message);
            if (isCrop) {
                loadFarmerCropDonations();
            } else {
                loadMyDonations();
            }
            loadDonorStats();
        } else {
            alert("❌ " + (data.message || "Could not cancel donation."));
        }
    } catch (e) {
        alert("❌ Error cancelling donation.");
    }
}

async function ngoCancelRequest(id, isCrop) {
    if (!confirm("Are you sure you want to cancel your collection request for this donation?")) {
        return;
    }

    try {
        const endpoint = isCrop ? `/api/crop-donations/${id}/cancel` : `/api/donations/${id}/cancel`;
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ reason: "Request withdrawn by NGO." })
        });

        const data = await res.json();
        if (res.ok) {
            alert("✅ " + data.message);
            renderNgoTabContent();
            loadNgoStats();
        } else {
            alert("❌ " + (data.message || "Could not cancel request."));
        }
    } catch (e) {
        alert("❌ Error cancelling request.");
    }
}

/* ========================================================
   NGO DASHBOARD & BROWSE
======================================================== */

async function loadNgoDashboard() {
    loadNgoStats();
    switchNgoTab(currentNgoTab);
}

function onNgoSearchInput(val) {
    ngoSearchQuery = (val || "").toLowerCase().trim();
    renderNgoTabContent();
}

async function loadNgoStats() {
    const user = getLoggedInUser();
    if (!user) return;

    try {
        const res = await fetch(`${API_BASE}/api/stats/ngo/${encodeURIComponent(user.email)}`, {
            headers: authHeaders()
        });

        if (res.status === 401 || res.status === 403) {
            console.warn("Session expired loading NGO stats, redirecting to login...");
            logoutUser();
            return;
        }

        if (res.ok) {
            const stats = await res.json();
            const map = {
                ngoStatRequested: stats.donationsRequested || 0,
                ngoStatAccepted: stats.donationsAccepted || 0,
                ngoStatCollected: stats.donationsCollected || 0,
                ngoStatCompleted: stats.donationsCompleted || 0,
                ngoStatFoodKg: (stats.totalFoodReceivedKg || 0) + " kg",
                ngoStatCropKg: (stats.totalCropReceivedKg || 0) + " kg",
                ngoStatTotalValue: "₹" + (stats.totalValue || 0)
            };

            for (const [id, val] of Object.entries(map)) {
                const el = document.getElementById(id);
                if (el) el.innerText = val;
            }
        }
    } catch (e) {
        console.error("NGO stats error:", e);
    }
}

async function loadDonorStats() {
    const user = getLoggedInUser();
    if (!user) return;

    try {
        const res = await fetch(`${API_BASE}/api/stats/donor/${encodeURIComponent(user.email)}`, {
            headers: authHeaders()
        });

        if (res.status === 401 || res.status === 403) {
            console.warn("Session expired loading donor stats, redirecting to login...");
            logoutUser();
            return;
        }

        if (res.ok) {
            const stats = await res.json();
            const map = {
                statTotalDonations: stats.totalDonations || 0,
                statFoodDonated: (stats.foodDonatedKg || 0) + " kg",
                statCropDonated: (stats.cropDonatedKg || 0) + " kg",
                statTotalValue: "₹" + (stats.totalDonationValue || 0),
                statCompleted: stats.completedDonations || 0,
                statPendingPayment: "₹" + (stats.pendingPayments || 0),
                donationCount: stats.activeDonations !== undefined ? stats.activeDonations : (stats.totalDonations || 0),
                foodSavedCount: (stats.foodDonatedKg || 0) + " kg"
            };

            for (const [id, val] of Object.entries(map)) {
                const el = document.getElementById(id);
                if (el) el.innerText = val;
            }
        }
    } catch (e) {
        console.error("Donor stats error:", e);
    }
}

function switchNgoTab(tab, tabBtn) {
    currentNgoTab = tab;
    document.querySelectorAll("#ngoFeatures .filter-tab").forEach(b => b.classList.remove("active"));
    if (tabBtn) {
        tabBtn.classList.add("active");
    } else {
        const btnIdMap = {
            "available-food": "ngoTabBtnFood",
            "available-crops": "ngoTabBtnCrop",
            "my-requests": "ngoTabBtnRequests",
            "accepted": "ngoTabBtnAccepted",
            "schedule": "ngoTabBtnSchedule",
            "completed": "ngoTabBtnCompleted"
        };
        const activeBtn = document.getElementById(btnIdMap[tab]);
        if (activeBtn) activeBtn.classList.add("active");
    }

    renderNgoTabContent();
}

async function renderNgoTabContent() {
    const area = document.getElementById("ngoDonationArea");
    if (!area) return;

    area.innerHTML = '<p style="padding: 20px; text-align: center; color: #5a7567;">Loading marketplace listings...</p>';
    const user = getLoggedInUser();

    try {
        if (currentNgoTab === "available-food") {
            const res = await fetch(`${API_BASE}/api/donations?status=available`, { headers: authHeaders() });
            const donations = await res.json();
            renderNgoAvailableItems(donations, false);
        } else if (currentNgoTab === "available-crops") {
            const res = await fetch(`${API_BASE}/api/crop-donations?status=available`, { headers: authHeaders() });
            const cropDonations = await res.json();
            renderNgoAvailableItems(cropDonations, true);
        } else if (currentNgoTab === "my-requests") {
            const resF = await fetch(`${API_BASE}/api/donations/ngo/${encodeURIComponent(user.email)}`, { headers: authHeaders() });
            const foodD = await resF.json();
            const resC = await fetch(`${API_BASE}/api/crop-donations/ngo/${encodeURIComponent(user.email)}`, { headers: authHeaders() });
            const cropD = await resC.json();
            const allReq = [...foodD, ...cropD].filter(d => (d.donationStatus || d.status || "").toLowerCase() === "requested");
            renderNgoAssignedItems(allReq, "requested");
        } else if (currentNgoTab === "accepted") {
            const resF = await fetch(`${API_BASE}/api/donations/ngo/${encodeURIComponent(user.email)}`, { headers: authHeaders() });
            const foodD = await resF.json();
            const resC = await fetch(`${API_BASE}/api/crop-donations/ngo/${encodeURIComponent(user.email)}`, { headers: authHeaders() });
            const cropD = await resC.json();
            const allAcc = [...foodD, ...cropD].filter(d => (d.donationStatus || d.status || "").toLowerCase() === "accepted");
            renderNgoAssignedItems(allAcc, "accepted");
        } else if (currentNgoTab === "schedule") {
            const resF = await fetch(`${API_BASE}/api/donations/ngo/${encodeURIComponent(user.email)}`, { headers: authHeaders() });
            const foodD = await resF.json();
            const resC = await fetch(`${API_BASE}/api/crop-donations/ngo/${encodeURIComponent(user.email)}`, { headers: authHeaders() });
            const cropD = await resC.json();
            const allSched = [...foodD, ...cropD].filter(d => ["collection_scheduled", "accepted"].includes((d.donationStatus || d.status || "").toLowerCase()));
            renderNgoAssignedItems(allSched, "schedule");
        } else if (currentNgoTab === "completed") {
            const resF = await fetch(`${API_BASE}/api/donations/ngo/${encodeURIComponent(user.email)}`, { headers: authHeaders() });
            const foodD = await resF.json();
            const resC = await fetch(`${API_BASE}/api/crop-donations/ngo/${encodeURIComponent(user.email)}`, { headers: authHeaders() });
            const cropD = await resC.json();
            const allComp = [...foodD, ...cropD].filter(d => (d.donationStatus || d.status || "").toLowerCase() === "completed");
            renderNgoAssignedItems(allComp, "completed");
        }
    } catch (e) {
        console.error("Render NGO tab error:", e);
        area.innerHTML = '<p style="color: red; padding: 20px;">Failed to load listings.</p>';
    }
}

// Render Available Donations for NGO Browse (Contact Privacy Protected)
function renderNgoAvailableItems(items, isCrop) {
    const area = document.getElementById("ngoDonationArea");
    if (!area) return;

    // Deduplicate items so each donation listing is displayed once
    const uniqueItems = [];
    const seenIds = new Set();
    const seenFoodIds = new Set();
    (items || []).forEach(d => {
        if (!d || !d._id || seenIds.has(String(d._id))) return;
        if (!isCrop && d.foodId && !d.foodId.startsWith("custom_")) {
            if (seenFoodIds.has(d.foodId)) return;
            seenFoodIds.add(d.foodId);
        }
        seenIds.add(String(d._id));
        uniqueItems.push(d);
    });

    if (!uniqueItems || uniqueItems.length === 0) {
        area.innerHTML = `
            <div style="text-align: center; padding: 40px; background: white; border-radius: 12px; border: 1px dashed #c0d8cb;">
                <p style="font-size: 16px; color: #5a7567;">No ${isCrop ? 'crop' : 'food'} donations currently available.</p>
                <p style="font-size: 13px; color: #789988;">New listings from households and farmers will appear here automatically.</p>
            </div>
        `;
        return;
    }

    // Apply active search query if present
    let filteredItems = uniqueItems;
    if (ngoSearchQuery) {
        filteredItems = uniqueItems.filter(d => {
            const name = (d.cropName || d.foodName || "").toLowerCase();
            const loc = (d.donorAddress || d.pickupLocation || d.location || "").toLowerCase();
            const donor = (d.donorName || "").toLowerCase();
            const cat = (d.category || "").toLowerCase();
            return name.includes(ngoSearchQuery) || loc.includes(ngoSearchQuery) || donor.includes(ngoSearchQuery) || cat.includes(ngoSearchQuery);
        });
    }

    if (filteredItems.length === 0) {
        area.innerHTML = `
            <div style="text-align: center; padding: 30px; background: white; border-radius: 12px; border: 1px dashed #c0d8cb;">
                <p style="font-size: 15px; color: #5a7567;">No listings match search query "${escapeHtml(ngoSearchQuery)}".</p>
            </div>
        `;
        return;
    }

    let html = `
        <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
            <p style="font-size: 14px; color: #436251;">Showing <strong>${filteredItems.length}</strong> available donation(s) ready for NGO pickup.</p>
        </div>
        <div class="donation-grid">
    `;

    filteredItems.forEach(d => {
        const itemName = d.cropName || d.foodName || "Surplus";
        const isValueBased = d.donationType === "value_based";
        const valText = isValueBased ? `₹${d.expectedAmount || 0}` : "💚 Free Donation";
        const photo = getItemImage(itemName, d.category, isCrop, d.photo);
        const donorName = d.donorName || "Registered Donor";
        const donorAddress = d.donorAddress || d.pickupLocation || d.location || "Coimbatore";

        html += `
            <div class="donation-order-card">
                <div class="card-top-banner">
                    <img src="${photo}" alt="${escapeHtml(itemName)}" onerror="handleImageError(this, '${escapeHtml(d.category || '')}', ${isCrop})">
                    <div class="card-badge-overlay">
                        <span class="status-badge badge-available">● Available</span>
                    </div>
                    <div class="card-type-tag">
                        ${isValueBased ? '💰 Value-Based' : '💚 Free Donation'}
                    </div>
                </div>

                <div class="donation-order-body">
                    <div class="donation-order-title">
                        <span>${isCrop ? '🌾' : '🍅'} ${escapeHtml(itemName)}</span>
                        <span class="donation-order-qty">${d.quantity} ${escapeHtml(d.unit)}</span>
                    </div>

                    <div class="donation-value-box">
                        <div>
                            <div class="donation-value-main" style="color: ${isValueBased ? '#173b2a' : '#2e8b57'};">
                                ${valText}
                            </div>
                            <div class="donation-value-sub">
                                Type: ${isValueBased ? 'Value-Based Cost Recovery' : '100% Free Community Donation'}
                            </div>
                        </div>
                    </div>

                    <div class="info-row">
                        <span>📍</span>
                        <span><strong>General Pickup:</strong> ${escapeHtml(donorAddress)}</span>
                    </div>

                    <div class="info-row">
                        <span>👤</span>
                        <span><strong>Donor:</strong> ${escapeHtml(donorName)}</span>
                    </div>

                    <!-- Contact Privacy: Hidden prior to request acceptance -->
                    <div class="info-row">
                        <span>🔒</span>
                        <span style="color: #4b6b58; font-size: 12px;"><strong>Contact Details:</strong> Revealed upon donor request acceptance</span>
                    </div>

                    ${d.description ? `
                        <p style="font-size: 13px; color: #526f60; margin: 8px 0;">
                            <em>${escapeHtml(d.description)}</em>
                        </p>
                    ` : ''}

                    <div class="card-action-bar">
                        <a class="btn-sm btn-directions" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(donorAddress)}" target="_blank">
                            🚗 View Map
                        </a>
                        <button class="btn-sm btn-primary" onclick="openRequestModal('${d._id}', ${isCrop}, '${escapeHtml(itemName)}', '${escapeHtml(donorName)}', '${valText}', '${escapeHtml(donorAddress)}', '${d.quantity} ${escapeHtml(d.unit)}')">
                            🤝 Request Donation
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    area.innerHTML = html;
}

// Render Assigned Items for NGO Tabs
function renderNgoAssignedItems(items, tabType) {
    const area = document.getElementById("ngoDonationArea");
    if (!area) return;

    if (!items || items.length === 0) {
        area.innerHTML = `
            <div style="text-align: center; padding: 40px; background: white; border-radius: 12px; border: 1px dashed #c0d8cb;">
                <p style="font-size: 16px; color: #5a7567;">No donations in the '${tabType}' category.</p>
            </div>
        `;
        return;
    }

    let html = `<div class="donation-grid">`;
    items.forEach(d => {
        const isCrop = !!d.cropName;
        const itemName = d.cropName || d.foodName || "Surplus";
        const status = (d.donationStatus || d.status || "").toLowerCase();
        const isValueBased = d.donationType === "value_based";
        const agreedVal = d.agreedAmount || d.expectedAmount || 0;
        const photo = getItemImage(itemName, d.category, isCrop, d.photo);
        const hasRealContact = d.donorContact && !d.donorContact.includes("[");

        html += `
            <div class="donation-order-card">
                <div class="card-top-banner">
                    <img src="${photo}" alt="${escapeHtml(itemName)}" onerror="handleImageError(this, '${escapeHtml(d.category || '')}', ${isCrop})">
                    <div class="card-badge-overlay">
                        <span class="status-badge badge-${status}">● ${formatStatusLabel(status)}</span>
                    </div>
                    <div class="card-type-tag">
                        ${isValueBased ? `💰 ₹${agreedVal}` : '💚 Free Donation'}
                    </div>
                </div>

                <div class="donation-order-body">
                    <div class="donation-order-title">
                        <span>${isCrop ? '🌾' : '🍎'} ${escapeHtml(itemName)}</span>
                        <span class="donation-order-qty">${d.quantity} ${escapeHtml(d.unit)}</span>
                    </div>

                    <div class="info-row">
                        <span>👤</span>
                        <span><strong>Donor:</strong> ${escapeHtml(d.donorName || 'Donor')}</span>
                    </div>

                    <!-- Contact details revealed securely if accepted -->
                    <div class="info-row">
                        <span>📞</span>
                        <span>
                            <strong>Phone:</strong> ${hasRealContact
                ? `<a href="tel:${escapeHtml(d.donorContact)}">${escapeHtml(d.donorContact)}</a>`
                : '<span style="color:#718096;font-size:12px;">🔒 Visible once donor accepts</span>'}
                        </span>
                    </div>

                    <div class="info-row">
                        <span>📍</span>
                        <span><strong>Pickup:</strong> ${escapeHtml(d.pickupLocation || d.location || '')}</span>
                    </div>

                    ${d.pickupDate ? `
                        <div class="pickup-schedule-box">
                            <strong>📅 Scheduled Pickup:</strong><br>
                            ${escapeHtml(d.pickupDate)} at ${escapeHtml(d.pickupTime || '')}
                        </div>
                    ` : ''}

                    <div class="card-action-bar">
                        ${hasRealContact ? `
                            <a class="btn-sm btn-outline" href="tel:${escapeHtml(d.donorContact)}">
                                📞 Call Donor
                            </a>
                        ` : ''}

                        <a class="btn-sm btn-directions" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(d.pickupLocation || d.location || '')}" target="_blank">
                            🚗 Directions
                        </a>

                        ${(status === 'requested') ? `
                            <button class="btn-sm btn-danger-outline" onclick="ngoCancelRequest('${d._id}', ${isCrop})">
                                ❌ Cancel Request
                            </button>
                        ` : ''}

                        ${(status === 'accepted' || status === 'collection_scheduled') ? `
                            <button class="btn-sm btn-amber" onclick="openCollectionModal('${d._id}', ${isCrop}, '${escapeHtml(itemName)}', '${escapeHtml(d.donorName || 'Donor')}', '${isValueBased ? '₹' + agreedVal : 'Free (₹0)'}', '${d.quantity} ${escapeHtml(d.unit)}')">
                                ✅ Confirm Collection
                            </button>
                        ` : ''}

                        ${status === 'accepted' ? `
                            <button class="btn-sm btn-blue" onclick="openScheduleModal('${d._id}', ${isCrop}, '${escapeHtml(d.pickupLocation || d.location || '')}')">
                                📅 Schedule
                            </button>
                        ` : ''}

                        ${status === 'completed' ? `
                            <button class="btn-sm btn-primary" onclick="openReceiptModal('${d._id}', ${isCrop})">
                                🧾 View Receipt
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    area.innerHTML = html;
}

/* ========================================================
   FARMER MANAGEMENT
======================================================== */

async function loadFarmerCrops() {
    const user = getLoggedInUser();
    if (!user) return;

    try {
        const res = await fetch(`${API_BASE}/api/crops/${encodeURIComponent(user.email)}`, {
            headers: authHeaders()
        });

        if (res.status === 401 || res.status === 403) {
            console.warn("Session expired loading crops, redirecting to login...");
            logoutUser();
            return;
        }

        let crops = [];
        if (res.ok) {
            const data = await res.json();
            crops = Array.isArray(data) ? data : [];
        } else {
            crops = [];
        }
        const list = document.getElementById("farmerCropList");
        const select = document.getElementById("farmerCropSelect");

        if (select) {
            select.innerHTML = '<option value="">Select crop from stock</option>';
            crops.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c._id;
                opt.dataset.name = c.name;
                opt.dataset.qty = c.quantity;
                opt.dataset.unit = c.unit;
                opt.dataset.loc = c.location;
                opt.innerText = `${c.name} (${c.quantity} ${c.unit}) - ${c.location}`;
                select.appendChild(opt);
            });
        }

        if (!list) return;
        if (!crops || crops.length === 0) {
            list.innerHTML = "<p style='color: #5a7567; padding: 20px; text-align: center;'>No unsold crop listings added yet. Click 'Add Unsold Crop' above.</p>";
            return;
        }

        list.innerHTML = crops.map(c => {
            const cropImg = getItemImage(c.name, "Crop", true);
            return `
                <div class="crop-card" style="background: white; padding: 16px; border-radius: 12px; margin-bottom: 12px; border: 1px solid #d8e6de; display: flex; gap: 16px; align-items: flex-start;">
                    <img src="${cropImg}" alt="${escapeHtml(c.name)}" onerror="handleImageError(this, 'Crop', true)" style="width: 72px; height: 72px; object-fit: cover; border-radius: 10px; border: 1px solid #d8e6de; flex-shrink: 0; background: #f0fdf4;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 6px 0; color: #173b2a; font-size: 16px;">🌾 ${escapeHtml(c.name)}</h4>
                        <p style="margin: 2px 0;"><strong>Quantity:</strong> ${c.quantity} ${escapeHtml(c.unit)}</p>
                        <p style="margin: 2px 0;"><strong>Available Until:</strong> ${c.date}</p>
                        <p style="margin: 2px 0;"><strong>Location:</strong> ${escapeHtml(c.location)}</p>
                        ${c.description ? `<p style="font-size: 13px; color: #5a7567; margin-top: 4px;"><em>${escapeHtml(c.description)}</em></p>` : ''}
                        <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                            <button class="btn-sm btn-outline" onclick="openEditCropModal('${c._id}', '${escapeHtml(c.name)}', ${c.quantity}, '${escapeHtml(c.unit)}', '${c.date}', '${escapeHtml(c.location)}', '${escapeHtml(c.description || '')}')">
                                ✏️ Edit
                            </button>
                            <button class="btn-sm btn-primary" onclick="quickDonateCrop('${c._id}')">
                                🤝 Donate This Crop
                            </button>
                            <button class="btn-sm btn-danger-outline" onclick="deleteFarmerCrop('${c._id}')">
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    } catch (e) {
        console.error("Error loading farmer crops:", e);
    }
}

function openEditCropModal(id, name, quantity, unit, date, location, description) {
    const container = document.getElementById("workflowModalContainer");
    if (!container) return;

    container.innerHTML = `
        <div class="custom-modal-backdrop" onclick="if(event.target === this) closeWorkflowModal()">
            <div class="custom-modal-card">
                <div class="custom-modal-header">
                    <h3>🌾 Edit Unsold Crop Listing</h3>
                    <button class="custom-modal-close" onclick="closeWorkflowModal()">&times;</button>
                </div>
                <div class="custom-modal-body">
                    <form onsubmit="saveCropEdit(event, '${id}')">
                        <div style="margin-bottom: 12px;">
                            <label style="font-weight: 700; font-size: 13px; display: block; margin-bottom: 4px;">Crop Name</label>
                            <input type="text" id="editCropName" value="${escapeHtml(name)}" required style="width: 100%; padding: 10px; border: 1px solid #c2decb; border-radius: 6px;">
                        </div>
                        <div style="display: flex; gap: 10px; margin-bottom: 12px;">
                            <div style="flex: 1;">
                                <label style="font-weight: 700; font-size: 13px; display: block; margin-bottom: 4px;">Quantity</label>
                                <input type="number" id="editCropQuantity" value="${quantity}" min="0.1" step="0.1" required style="width: 100%; padding: 10px; border: 1px solid #c2decb; border-radius: 6px;">
                            </div>
                            <div style="flex: 1;">
                                <label style="font-weight: 700; font-size: 13px; display: block; margin-bottom: 4px;">Unit</label>
                                <input type="text" id="editCropUnit" value="${escapeHtml(unit)}" required style="width: 100%; padding: 10px; border: 1px solid #c2decb; border-radius: 6px;">
                            </div>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <label style="font-weight: 700; font-size: 13px; display: block; margin-bottom: 4px;">Available Until</label>
                            <input type="date" id="editCropDate" value="${date}" required style="width: 100%; padding: 10px; border: 1px solid #c2decb; border-radius: 6px;">
                        </div>
                        <div style="margin-bottom: 12px;">
                            <label style="font-weight: 700; font-size: 13px; display: block; margin-bottom: 4px;">Farm Pickup Location</label>
                            <input type="text" id="editCropLocation" value="${escapeHtml(location)}" required style="width: 100%; padding: 10px; border: 1px solid #c2decb; border-radius: 6px;">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="font-weight: 700; font-size: 13px; display: block; margin-bottom: 4px;">Description</label>
                            <textarea id="editCropDescription" rows="2" style="width: 100%; padding: 10px; border: 1px solid #c2decb; border-radius: 6px;">${escapeHtml(description)}</textarea>
                        </div>
                        <div class="custom-modal-footer" style="padding: 10px 0 0;">
                            <button type="button" class="btn-sm btn-outline" onclick="closeWorkflowModal()">Cancel</button>
                            <button type="submit" class="btn-sm btn-primary">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

async function saveCropEdit(event, id) {
    if (event) event.preventDefault();
    const name = document.getElementById("editCropName")?.value.trim();
    const quantity = document.getElementById("editCropQuantity")?.value;
    const unit = document.getElementById("editCropUnit")?.value.trim();
    const date = document.getElementById("editCropDate")?.value;
    const location = document.getElementById("editCropLocation")?.value.trim();
    const description = document.getElementById("editCropDescription")?.value.trim();

    if (!name || quantity === undefined || !unit || !date || !location) return;

    try {
        const res = await fetch(`${API_BASE}/api/crops/${id}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ name, quantity: Number(quantity), unit, date, location, description })
        });
        const data = await res.json();
        if (res.ok) {
            closeWorkflowModal();
            alert("🌾 Crop listing updated successfully!");
            loadFarmerCrops();
        } else {
            alert("❌ " + (data.message || "Failed to update crop."));
        }
    } catch (e) {
        alert("❌ Error updating crop.");
    }
}

async function deleteFarmerCrop(id) {
    if (!confirm("Are you sure you want to remove this crop from your farm listings?")) return;
    try {
        const res = await fetch(`${API_BASE}/api/crops/${id}`, {
            method: "DELETE",
            headers: authHeaders()
        });
        if (res.ok) {
            loadFarmerCrops();
        } else {
            const data = await res.json();
            alert("❌ " + (data.message || "Could not delete crop."));
        }
    } catch (e) {
        console.error(e);
    }
}

async function loadFarmerCropDonations() {
    const user = getLoggedInUser();
    if (!user) return;

    try {
        const res = await fetch(`${API_BASE}/api/crop-donations/user/${encodeURIComponent(user.email)}`, {
            headers: authHeaders()
        });

        if (res.status === 401 || res.status === 403) {
            console.warn("Session expired loading crop donations, redirecting to login...");
            logoutUser();
            return;
        }

        if (res.ok) {
            cachedCropDonations = await res.json();
            const container = document.getElementById("farmerCropDonationList");
            if (!container) return;

            if (!cachedCropDonations || cachedCropDonations.length === 0) {
                container.innerHTML = "<p style='color: #5a7567; padding: 20px; text-align: center;'>No crop donations listed yet. Click 'Donate Crop' to start.</p>";
                return;
            }

            container.innerHTML = cachedCropDonations.map(d => generateDonorDonationCardHtml(d)).join("");
        }
    } catch (e) {
        console.error(e);
    }
}

function showFarmerSectionTab(tab) {
    const addArea = document.getElementById("farmerAddCropArea");
    const listArea = document.getElementById("farmerCropListArea");
    const donateArea = document.getElementById("farmerDonateCropArea");
    const myDonationsArea = document.getElementById("farmerMyDonationsArea");

    if (addArea) addArea.style.display = tab === "addCrop" ? "block" : "none";
    if (listArea) listArea.style.display = tab === "myCrops" ? "block" : "none";
    if (donateArea) donateArea.style.display = tab === "donateCrop" ? "block" : "none";
    if (myDonationsArea) myDonationsArea.style.display = tab === "myCropDonations" ? "block" : "none";

    if (tab === "myCropDonations") loadFarmerCropDonations();
    if (tab === "myCrops") loadFarmerCrops();
}

function selectCropDonationType(type) {
    const input = document.getElementById("cropDonationType");
    const freeCard = document.getElementById("cropTypeCardFree");
    const valCard = document.getElementById("cropTypeCardValue");
    const expGroup = document.getElementById("cropExpectedValueGroup");

    if (input) input.value = type;
    if (type === "value_based") {
        if (valCard) valCard.classList.add("selected");
        if (freeCard) freeCard.classList.remove("selected");
        if (expGroup) expGroup.style.display = "block";
    } else {
        if (freeCard) freeCard.classList.add("selected");
        if (valCard) valCard.classList.remove("selected");
        if (expGroup) expGroup.style.display = "none";
    }
}

function onSelectFarmerCrop(sel) {
    const opt = sel.options[sel.selectedIndex];
    if (!opt) return;

    const qty = document.getElementById("cropDonationQuantity");
    const unit = document.getElementById("cropDonationUnit");
    const loc = document.getElementById("cropDonationLocation");

    if (qty && opt.dataset.qty) qty.value = opt.dataset.qty;
    if (unit && opt.dataset.unit) unit.value = opt.dataset.unit;
    if (loc && opt.dataset.loc) loc.value = opt.dataset.loc;
}

function quickDonateCrop(cropId) {
    showFarmerSectionTab("donateCrop");
    const sel = document.getElementById("farmerCropSelect");
    if (sel) {
        sel.value = cropId;
        onSelectFarmerCrop(sel);
    }
}

async function saveFarmerCrop(event) {
    if (event) event.preventDefault();
    const user = getLoggedInUser();
    if (!user) return;

    const name = document.getElementById("cropName")?.value.trim();
    const quantity = document.getElementById("cropQuantity")?.value;
    const unit = document.getElementById("cropUnit")?.value;
    const date = document.getElementById("cropDate")?.value;
    const location = document.getElementById("cropLocation")?.value.trim();
    const description = document.getElementById("cropDescription")?.value.trim();

    if (!name || !quantity || !unit || !date || !location) return;

    if (Number(quantity) <= 0) {
        alert("Please enter a valid crop quantity greater than zero.");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/crops`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
                name,
                quantity: Number(quantity),
                unit,
                date,
                location,
                description
            })
        });

        const data = await res.json();
        if (res.ok) {
            alert("🌾 Crop produce listing successfully saved!");
            showFarmerSectionTab("myCrops");
        } else {
            alert("❌ " + (data.message || "Failed to save crop produce."));
        }
    } catch (e) {
        alert("❌ Error saving crop produce.");
    }
}

async function submitCropDonation(event) {
    if (event) event.preventDefault();
    const user = getLoggedInUser();
    if (!user) return;

    const cropSelect = document.getElementById("farmerCropSelect");
    const cropId = cropSelect?.value;
    const cropName = cropSelect?.options[cropSelect.selectedIndex]?.dataset.name || "Harvest Crop";
    const quantity = document.getElementById("cropDonationQuantity")?.value;
    const unit = document.getElementById("cropDonationUnit")?.value;
    const location = document.getElementById("cropDonationLocation")?.value.trim() || user.address || "Coimbatore";
    const description = document.getElementById("cropDonationDescription")?.value.trim();
    const type = document.getElementById("cropDonationType")?.value || "free";
    const expectedAmount = type === "value_based" ? Number(document.getElementById("cropExpectedAmount")?.value || 0) : 0;

    if (!cropName || !quantity || !unit || !location) {
        alert("Please fill all required crop donation details.");
        return;
    }

    if (Number(quantity) <= 0) {
        alert("Please enter a valid crop quantity greater than zero.");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/crop-donations`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
                cropId: cropId,
                cropName: cropName,
                quantity: Number(quantity),
                unit: unit,
                category: "Surplus Harvest",
                location: location,
                pickupLocation: location,
                description: description,
                photo: getItemImage(cropName, "Surplus Harvest", true),
                donationType: type,
                expectedAmount: expectedAmount
            })
        });

        const data = await res.json();
        if (res.ok) {
            alert("🌾 Crop donation published successfully!");
            showFarmerSectionTab("myCropDonations");
            loadDonorStats();
        } else {
            alert("❌ " + (data.message || "Failed to publish crop donation."));
        }
    } catch (e) {
        alert("❌ Error creating crop donation.");
    }
}

/* ========================================================
   MODALS: REQUEST, SCHEDULE, COLLECT, PAYMENT, RECEIPT
======================================================= */

function closeWorkflowModal() {
    const container = document.getElementById("workflowModalContainer");
    if (container) container.innerHTML = "";
}

function openRequestModal(id, isCrop, foodName, donorName, expectedValue, location, qty) {
    const container = document.getElementById("workflowModalContainer");
    if (!container) return;

    container.innerHTML = `
        <div class="custom-modal-backdrop" onclick="if(event.target === this) closeWorkflowModal()">
            <div class="custom-modal-card">
                <div class="custom-modal-header">
                    <h3>🤝 Request This Donation?</h3>
                    <button class="custom-modal-close" onclick="closeWorkflowModal()">&times;</button>
                </div>
                <div class="custom-modal-body">
                    <p style="font-size: 14px; color: #436251; margin-bottom: 12px;">
                        Submitting your request notifies the donor immediately. Once accepted, you can coordinate pickup and access verified contact info.
                    </p>

                    <div class="dialog-summary-card">
                        <div class="dialog-summary-row">
                            <strong>Item:</strong>
                            <span>${escapeHtml(qty)} ${escapeHtml(foodName)}</span>
                        </div>
                        <div class="dialog-summary-row">
                            <strong>Donor:</strong>
                            <span>${escapeHtml(donorName)}</span>
                        </div>
                        <div class="dialog-summary-row">
                            <strong>Valuation:</strong>
                            <span style="font-weight: 800; color: #173b2a;">${escapeHtml(expectedValue)}</span>
                        </div>
                        <div class="dialog-summary-row">
                            <strong>General Pickup:</strong>
                            <span>📍 ${escapeHtml(location)}</span>
                        </div>
                    </div>

                    <label style="font-size: 13px; font-weight: 600; display: block; margin-top: 10px;">
                        Message / Collection Note to Donor (Optional):
                    </label>
                    <textarea id="modalRequestNotes" rows="2" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #c2decb;" placeholder="We can collect today evening with our community transport vehicle..."></textarea>
                </div>
                <div class="custom-modal-footer">
                    <button class="btn-sm btn-outline" onclick="closeWorkflowModal()">Cancel</button>
                    <button class="btn-sm btn-primary" onclick="confirmDonationRequest('${id}', ${isCrop})">
                        Confirm Request
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function confirmDonationRequest(id, isCrop) {
    const notes = document.getElementById("modalRequestNotes")?.value || "";

    try {
        const endpoint = isCrop ? `/api/crop-donations/${id}/request` : `/api/donations/${id}/request`;
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ notes: notes })
        });

        const data = await res.json();
        if (!res.ok) {
            alert("❌ " + (data.message || "Failed to request donation."));
            return;
        }

        closeWorkflowModal();
        alert("🤝 Donation Requested Successfully!\n\nThe donor has been notified of your request.\nOnce accepted by the donor, you will be able to schedule pickup and contact them directly.");
        switchNgoTab("my-requests");
        loadNgoStats();
    } catch (e) {
        alert("❌ Error sending request.");
    }
}

function openScheduleModal(id, isCrop, location) {
    const container = document.getElementById("workflowModalContainer");
    if (!container) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    container.innerHTML = `
        <div class="custom-modal-backdrop" onclick="if(event.target === this) closeWorkflowModal()">
            <div class="custom-modal-card">
                <div class="custom-modal-header">
                    <h3>📅 Schedule Collection Pickup</h3>
                    <button class="custom-modal-close" onclick="closeWorkflowModal()">&times;</button>
                </div>
                <div class="custom-modal-body">
                    <p style="font-size: 14px; color: #436251; margin-bottom: 15px;">
                        Specify pickup date, time, and address for logistics coordination.
                    </p>

                    <div style="display: flex; flex-direction: column; gap: 14px;">
                        <div>
                            <label style="font-weight: 700; font-size: 13px; display: block; margin-bottom: 4px;">📅 Pickup Date</label>
                            <input type="date" id="modalPickupDate" value="${dateStr}" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px;">
                        </div>

                        <div>
                            <label style="font-weight: 700; font-size: 13px; display: block; margin-bottom: 4px;">⏰ Pickup Time</label>
                            <input type="text" id="modalPickupTime" value="5:00 PM" placeholder="Example: 5:00 PM" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px;">
                        </div>

                        <div>
                            <label style="font-weight: 700; font-size: 13px; display: block; margin-bottom: 4px;">📍 Pickup Location Address</label>
                            <input type="text" id="modalPickupLoc" value="${escapeHtml(location || 'Coimbatore')}" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px;">
                        </div>
                    </div>
                </div>
                <div class="custom-modal-footer">
                    <button class="btn-sm btn-outline" onclick="closeWorkflowModal()">Cancel</button>
                    <button class="btn-sm btn-primary" onclick="confirmSchedulePickup('${id}', ${isCrop})">
                        Save Schedule
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function confirmSchedulePickup(id, isCrop) {
    const pickupDate = document.getElementById("modalPickupDate")?.value;
    const pickupTime = document.getElementById("modalPickupTime")?.value;
    const pickupLocation = document.getElementById("modalPickupLoc")?.value;

    if (!pickupDate || !pickupTime) {
        alert("Please provide both pickup date and time.");
        return;
    }

    try {
        const endpoint = isCrop ? `/api/crop-donations/${id}/schedule` : `/api/donations/${id}/schedule`;
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ pickupDate, pickupTime, pickupLocation })
        });

        if (res.ok) {
            closeWorkflowModal();
            alert(`📅 Collection Scheduled!\n\n📅 Date: ${pickupDate}\n⏰ Time: ${pickupTime}\n📍 Address: ${pickupLocation}`);
            const user = getLoggedInUser();
            if (user.role === "ngo") {
                switchNgoTab("schedule");
                loadNgoStats();
            } else {
                if (isCrop) loadFarmerCropDonations();
                else loadMyDonations();
                loadDonorStats();
            }
        } else {
            const data = await res.json();
            alert("❌ " + (data.message || "Failed to schedule pickup."));
        }
    } catch (e) {
        alert("❌ Error saving schedule.");
    }
}

function openCollectionModal(id, isCrop, foodName, donorName, agreedAmount, qty) {
    const container = document.getElementById("workflowModalContainer");
    if (!container) return;

    container.innerHTML = `
        <div class="custom-modal-backdrop" onclick="if(event.target === this) closeWorkflowModal()">
            <div class="custom-modal-card">
                <div class="custom-modal-header">
                    <h3>✅ Confirm Food Collection</h3>
                    <button class="custom-modal-close" onclick="closeWorkflowModal()">&times;</button>
                </div>
                <div class="custom-modal-body">
                    <p style="font-size: 15px; font-weight: 700; color: #173b2a; margin-bottom: 12px;">
                        "Have you received this donation in person?"
                    </p>

                    <div class="dialog-summary-card">
                        <div class="dialog-summary-row">
                            <strong>Item:</strong>
                            <span>${escapeHtml(foodName)} – ${escapeHtml(qty)}</span>
                        </div>
                        <div class="dialog-summary-row">
                            <strong>Donor:</strong>
                            <span>${escapeHtml(donorName)}</span>
                        </div>
                        <div class="dialog-summary-row">
                            <strong>Agreed Value:</strong>
                            <span style="font-weight: 800; color: #173b2a;">${escapeHtml(agreedAmount)}</span>
                        </div>
                    </div>

                    <p style="font-size: 13px; color: #5a7567;">
                        Confirming collection updates the status to <strong>COLLECTED</strong> and logs verification in the audit trail.
                    </p>
                </div>
                <div class="custom-modal-footer">
                    <button class="btn-sm btn-outline" onclick="closeWorkflowModal()">Cancel</button>
                    <button class="btn-sm btn-primary" onclick="confirmDonationCollection('${id}', ${isCrop})">
                        Confirm Received
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function confirmDonationCollection(id, isCrop) {
    try {
        const endpoint = isCrop ? `/api/crop-donations/${id}/collect` : `/api/donations/${id}/collect`;
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: "PUT",
            headers: authHeaders()
        });

        if (res.ok) {
            closeWorkflowModal();
            alert("✅ Collection Confirmed!\n\nStatus is now COLLECTED. Donor has been notified that items were safely received.");
            switchNgoTab("schedule");
            loadNgoStats();
        } else {
            const data = await res.json();
            alert("❌ " + (data.message || "Failed to confirm collection."));
        }
    } catch (e) {
        alert("❌ Error confirming collection.");
    }
}

function openPaymentModal(id, isCrop, amount) {
    const container = document.getElementById("workflowModalContainer");
    if (!container) return;

    container.innerHTML = `
        <div class="custom-modal-backdrop" onclick="if(event.target === this) closeWorkflowModal()">
            <div class="custom-modal-card">
                <div class="custom-modal-header">
                    <h3>💰 Record Payment / Reimbursement</h3>
                    <button class="custom-modal-close" onclick="closeWorkflowModal()">&times;</button>
                </div>
                <div class="custom-modal-body">
                    <div style="text-align: center; padding: 15px; background: #eef7f2; border-radius: 10px; margin-bottom: 15px;">
                        <span style="font-size: 13px; color: #375344; font-weight: 600;">AMOUNT DUE:</span>
                        <div style="font-size: 32px; font-weight: 900; color: #173b2a; margin: 4px 0;">₹${amount}</div>
                        <span class="payment-badge payment-pending">Status: Pending</span>
                    </div>

                    <div style="margin-bottom: 14px;">
                        <label style="font-size: 13px; font-weight: 700; display: block; margin-bottom: 4px;">Payment Method:</label>
                        <select id="modalPaymentMethod" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #ccc;">
                            <option value="Direct Cash Reimbursement on Pickup">Direct Cash Reimbursement on Pickup</option>
                            <option value="UPI Transfer (Google Pay / PhonePe / Paytm)">UPI Transfer (Google Pay / PhonePe / Paytm)</option>
                            <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option>
                        </select>
                    </div>

                    <div style="background: #eef7f2; padding: 10px; border-radius: 6px; font-size: 12px; color: #173b2a; border: 1px solid #c2decb;">
                        ℹ️ <strong>Payment Audit Note:</strong> This records the agreed reimbursement in the transaction timeline. Receipt status will be marked as <strong>"Payment Recorded"</strong>.
                    </div>
                </div>
                <div class="custom-modal-footer">
                    <button class="btn-sm btn-outline" onclick="closeWorkflowModal()">Cancel</button>
                    <button class="btn-sm btn-primary" onclick="confirmPaymentRecorded('${id}', ${isCrop})">
                        Mark Payment as Received
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function confirmPaymentRecorded(id, isCrop) {
    const method = document.getElementById("modalPaymentMethod")?.value || "Cash";

    try {
        const endpoint = isCrop ? `/api/crop-donations/${id}/payment` : `/api/donations/${id}/payment`;
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ method: method })
        });

        const data = await res.json();
        if (res.ok) {
            closeWorkflowModal();
            alert(`✅ Payment Recorded Successfully!\n\nAmount: ₹${data.donation.agreedAmount || data.donation.expectedAmount}\nMethod: ${method}\nRef: ${data.paymentResult.transactionId}`);
            if (isCrop) loadFarmerCropDonations();
            else loadMyDonations();
            loadDonorStats();
        } else {
            alert("❌ " + (data.message || "Failed to record payment."));
        }
    } catch (e) {
        alert("❌ Error recording payment.");
    }
}

async function openReceiptModal(id, isCrop) {
    const container = document.getElementById("workflowModalContainer");
    if (!container) return;

    container.innerHTML = `
        <div class="custom-modal-backdrop">
            <div class="custom-modal-card">
                <p style="padding: 30px; text-align: center;">Loading official receipt...</p>
            </div>
        </div>
    `;

    try {
        const endpoint = isCrop ? `/api/crop-donations/item/${id}` : `/api/donations/item/${id}`;
        const res = await fetch(`${API_BASE}${endpoint}`, { headers: authHeaders() });
        const d = await res.json();

        const itemName = d.cropName || d.foodName || "Surplus";
        const receiptId = d.receiptId || `ZW-2026-${d._id.slice(-6).toUpperCase()}`;
        const isValueBased = d.donationType === "value_based";
        const agreedAmount = isValueBased ? (d.agreedAmount || d.expectedAmount || 0) : 0;
        const compDate = d.completedAt ? new Date(d.completedAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString("en-IN");

        container.innerHTML = `
            <div class="custom-modal-backdrop" onclick="if(event.target === this) closeWorkflowModal()">
                <div class="custom-modal-card" style="max-width: 650px;">
                    <div class="custom-modal-header">
                        <h3>🧾 Official Donation Receipt</h3>
                        <button class="custom-modal-close" onclick="closeWorkflowModal()">&times;</button>
                    </div>

                    <div class="custom-modal-body">
                        <div class="receipt-container" id="printableReceipt">
                            <div class="receipt-watermark">VERIFIED REDISTRIBUTION</div>

                            <div class="receipt-header">
                                <h2>ZERO WASTE</h2>
                                <p style="font-size: 13px; color: #2e8b57; font-weight: 700; letter-spacing: 0.5px;">
                                    SURPLUS FOOD MANAGEMENT & REDISTRIBUTION NETWORK
                                </p>
                                <span class="receipt-id-tag">RECEIPT ID: ${receiptId}</span>
                            </div>

                            <div class="receipt-grid">
                                <div class="receipt-party">
                                    <h4>👤 DONOR (DISPATCHER)</h4>
                                    <strong>${escapeHtml(d.donorName || 'Rahul Sharma')}</strong><br>
                                    <span style="font-size: 12px; color: #5a7567;">Email: ${escapeHtml(d.donorEmail || d.userEmail || '')}</span><br>
                                    <span style="font-size: 12px; color: #5a7567;">Phone: ${escapeHtml(d.donorContact || '[On File]')}</span><br>
                                    <span style="font-size: 12px; color: #5a7567;">📍 Pickup: ${escapeHtml(d.pickupLocation || d.location || 'Coimbatore')}</span>
                                </div>

                                <div class="receipt-party">
                                    <h4>🤝 RECIPIENT (VERIFIED NGO)</h4>
                                    <strong>${escapeHtml(d.ngoName || 'Helping Hands NGO')}</strong><br>
                                    <span style="font-size: 12px; color: #5a7567;">Email: ${escapeHtml(d.ngoEmail || 'ngo@helpinghands.org')}</span><br>
                                    <span style="font-size: 12px; color: #5a7567;">Phone: ${escapeHtml(d.ngoContact || '+91 91234 56789')}</span><br>
                                    <span style="font-size: 12px; color: #5a7567;">Status: Authorized Food Collection Partner</span>
                                </div>
                            </div>

                            <table class="receipt-table">
                                <thead>
                                    <tr>
                                        <th>Description</th>
                                        <th>Category</th>
                                        <th>Quantity</th>
                                        <th>Type</th>
                                        <th style="text-align: right;">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>${escapeHtml(itemName)}</strong></td>
                                        <td>${escapeHtml(d.category || 'Surplus')}</td>
                                        <td>${d.quantity} ${escapeHtml(d.unit)}</td>
                                        <td>${isValueBased ? 'Value-Based' : 'Free Donation'}</td>
                                        <td style="text-align: right; font-weight: 700;">
                                            ${isValueBased ? '₹' + agreedAmount : '₹0'}
                                        </td>
                                    </tr>
                                    <tr class="receipt-total-row">
                                        <td colspan="4"><strong>Final Settlement Value:</strong></td>
                                        <td style="text-align: right; color: #173b2a;">
                                            ${isValueBased ? '₹' + agreedAmount : '₹0 (Free)'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <div style="background: #f7faf8; border-radius: 8px; padding: 12px; font-size: 13px; margin: 15px 0;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                    <strong>Payment Status:</strong>
                                    <span style="font-weight: 700; color: ${d.paymentStatus === 'paid' ? '#15803d' : '#047857'};">
                                        ${isValueBased ? (d.paymentStatus === 'paid' ? 'PAID / RECORDED' : 'PENDING') : 'NOT APPLICABLE (FREE)'}
                                    </span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                    <strong>Donation Status:</strong>
                                    <span style="font-weight: 700; color: #15803d;">COMPLETED</span>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <strong>Completion Date:</strong>
                                    <span>${compDate}</span>
                                </div>
                            </div>

                            <div class="receipt-footer">
                                <p>🌱 Thank you for choosing ZeroWaste. This record certifies the ethical recovery and redistribution of surplus food into the community.</p>
                                <p style="font-size: 11px; margin-top: 4px;">Generated electronically by ZeroWaste Platform • Verified Donation Record</p>
                            </div>
                        </div>
                    </div>

                    <div class="custom-modal-footer">
                        <button class="btn-sm btn-outline" onclick="closeWorkflowModal()">Close</button>
                        <button class="btn-sm btn-primary" onclick="window.print()">
                            🖨️ Print / Save as PDF
                        </button>
                    </div>
                </div>
            </div>
        `;
    } catch (e) {
        alert("Error generating receipt.");
        closeWorkflowModal();
    }
}

/* ========================================================
   UTILITY HELPERS
======================================================== */

function formatDate(dateStr) {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch (e) {
        return String(dateStr);
    }
}

function escapeHtml(text) {
    if (!text) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}