const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const db = require("./db");
const {
    initDatabase,
    User,
    Food,
    Crop,
    Donation,
    CropDonation
} = db;

const paymentService = require("./services/paymentService");
const aiRecipeService = require("./services/aiRecipeService");
const { parseCalendarDate, calculateExpiryStatus } = require("./dateUtils");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "zerowaste_jwt_secure_secret_key_2026";

// Middleware
app.use(express.json({ limit: "15mb" }));
// Cross-Origin Resource Sharing (explicitly allow deployed frontend and local dev)
const allowedOrigins = [
    "https://zerowaste-1-o562.onrender.com",
    "https://zerowaste-umw9.onrender.com"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (
            allowedOrigins.includes(origin) ||
            origin.endsWith(".onrender.com") ||
            origin.includes("localhost") ||
            origin.includes("127.0.0.1")
        ) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
}));

// Serve ZeroWaste frontend
app.use(express.static(path.join(__dirname, "../public")));

// Initialize database (Mongoose Atlas with auto-local persistence fallback)
initDatabase();

/* ========================================================
   AUTHENTICATION & AUTHORIZATION HELPERS
======================================================== */

function generateToken(user) {
    return jwt.sign(
        {
            userId: user._id,
            email: user.email.toLowerCase().trim(),
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: "7d" }
    );
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({
            message: "Authentication required. Please log in to continue."
        });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({
                message: "Session expired or invalid. Please log in again."
            });
        }
        req.user = decoded;
        next();
    });
}

function optionalAuth(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (!err) {
            req.user = decoded;
        } else {
            req.user = null;
        }
        next();
    });
}

/**
 * Sanitizes donation objects to protect donor contact privacy before acceptance.
 * Only the donor themselves, or the assigned NGO AFTER acceptance, can see real phone details.
 */
function sanitizeDonationForViewer(donation, requestingUser) {
    if (!donation) return null;
    const doc = donation.toObject ? donation.toObject() : JSON.parse(JSON.stringify(donation));

    const donorEmail = (doc.userEmail || doc.donorEmail || "").toLowerCase().trim();
    const ngoEmail = (doc.requestedBy || doc.ngoEmail || "").toLowerCase().trim();
    const userEmail = (requestingUser && requestingUser.email ? requestingUser.email : "").toLowerCase().trim();

    const isDonor = userEmail && userEmail === donorEmail;
    const isAssignedNgo = userEmail && userEmail === ngoEmail;
    const status = (doc.donationStatus || doc.status || "").toLowerCase();
    const isAcceptedOrBeyond = ["accepted", "collection_scheduled", "collected", "completed"].includes(status);

    // If viewer is the donor, full access
    if (isDonor) {
        return doc;
    }

    // If viewer is the assigned NGO and donation is accepted or later, grant contact details
    if (isAssignedNgo && isAcceptedOrBeyond) {
        return doc;
    }

    // Otherwise (marketplace browser, unassigned NGO, or prior to acceptance), mask contact details
    doc.donorContact = "[Contact details revealed once request is accepted by donor]";
    return doc;
}

/* ========================================================
   AUTHENTICATION & USER APIS
======================================================== */

// Register new user
app.post("/api/register", async function (req, res) {
    try {
        const { name, email, password, role, contactNumber, address } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                message: "Please fill all required fields (name, email, password, role)."
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({
                message: "Please enter a valid email address format."
            });
        }

        const cleanRole = role.toLowerCase().trim();
        if (!["household", "farmer", "ngo"].includes(cleanRole)) {
            return res.status(400).json({
                message: "Invalid role selected. Allowed roles are household, farmer, or ngo."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long."
            });
        }

        const cleanContact = contactNumber ? contactNumber.trim() : "";
        if ((cleanRole === "household" || cleanRole === "farmer") && cleanContact.length < 7) {
            return res.status(400).json({
                message: "A valid contact phone number (at least 7 digits) is required for registration."
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(400).json({
                message: "An account with this email address is already registered."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: cleanRole,
            contactNumber: cleanContact,
            address: address ? address.trim() : ""
        });

        await newUser.save();
        const token = generateToken(newUser);

        res.status(201).json({
            message: "Account created successfully!",
            token: token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                contactNumber: newUser.contactNumber || "",
                address: newUser.address || ""
            }
        });
    } catch (error) {
        console.error("Registration error:", error.message);
        res.status(500).json({ message: "Server error while registering account." });
    }
});

// Login user
app.post("/api/login", async function (req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Please enter your email and password."
            });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const token = generateToken(user);

        res.status(200).json({
            message: "Login successful!",
            token: token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                contactNumber: user.contactNumber || "",
                address: user.address || ""
            }
        });
    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({ message: "Server error while logging in." });
    }
});

// Health check / Demo status
app.get("/api/test", function (req, res) {
    res.json({
        message: "ZeroWaste API is fully operational!",
        storageEngine: db.isUsingLocalDb ? "Local High-Reliability Store" : "MongoDB Atlas Cluster",
        mongoConnected: !db.isUsingLocalDb,
        paymentProvider: paymentService.provider,
        timestamp: new Date().toISOString()
    });
});

/* ========================================================
   FOOD INVENTORY APIS (Household)
======================================================== */

// Add food item
app.post("/api/foods", authenticateToken, async function (req, res) {
    try {
        const { name, quantity, unit, expiryDate, category } = req.body;

        if (!name || quantity === undefined || !unit || !expiryDate) {
            return res.status(400).json({ message: "Please fill all food details (name, quantity, unit, expiryDate)." });
        }

        if (!parseCalendarDate(expiryDate)) {
            return res.status(400).json({ message: "Invalid expiry date format. Please select a valid date (YYYY-MM-DD)." });
        }

        const numQty = Number(quantity);
        if (isNaN(numQty) || numQty <= 0) {
            return res.status(400).json({ message: "Food quantity must be a positive number greater than 0." });
        }

        const newFood = new Food({
            userEmail: req.user.email,
            name: name.trim(),
            quantity: numQty,
            unit: unit.trim(),
            expiryDate: expiryDate,
            category: category ? category.trim() : "Household Stock"
        });

        await newFood.save();
        res.status(201).json({ message: "Food added successfully!", food: newFood });
    } catch (error) {
        console.error("Food saving error:", error.message);
        res.status(500).json({ message: "Server error while saving food." });
    }
});

// Get user food inventory (only own inventory)
app.get("/api/foods/:email", authenticateToken, async function (req, res) {
    try {
        const requestedEmail = req.params.email.toLowerCase().trim();
        if (req.user.email !== requestedEmail) {
            return res.status(403).json({ message: "Unauthorized: You can only view your own food inventory." });
        }

        const foods = await Food.find({ userEmail: requestedEmail }).sort({ createdAt: -1 });
        res.status(200).json(Array.isArray(foods) ? foods : []);
    } catch (error) {
        console.error("Food loading error:", error.message);
        res.status(500).json({ message: "Server error while loading food inventory." });
    }
});

// Edit food item
app.put("/api/foods/:id", authenticateToken, async function (req, res) {
    try {
        const food = await Food.findById(req.params.id);
        if (!food) {
            return res.status(404).json({ message: "Food item not found." });
        }

        if (food.userEmail.toLowerCase() !== req.user.email) {
            return res.status(403).json({ message: "Unauthorized: You can only edit your own food items." });
        }

        const { name, quantity, unit, expiryDate, category } = req.body;
        if (name) food.name = name.trim();
        if (quantity !== undefined) {
            const numQty = Number(quantity);
            if (isNaN(numQty) || numQty <= 0) {
                return res.status(400).json({ message: "Quantity must be a positive number." });
            }
            food.quantity = numQty;
        }
        if (unit) food.unit = unit.trim();
        if (expiryDate) {
            if (!parseCalendarDate(expiryDate)) {
                return res.status(400).json({ message: "Invalid expiry date format. Please select a valid date (YYYY-MM-DD)." });
            }
            food.expiryDate = expiryDate;
        }
        if (category) food.category = category.trim();

        await food.save();
        res.status(200).json({ message: "Food item updated successfully!", food: food });
    } catch (error) {
        console.error("Food update error:", error.message);
        res.status(500).json({ message: "Server error while updating food item." });
    }
});

// Delete food item
app.delete("/api/foods/:id", authenticateToken, async function (req, res) {
    try {
        const food = await Food.findById(req.params.id);
        if (!food) {
            return res.status(404).json({ message: "Food item not found." });
        }

        if (food.userEmail.toLowerCase() !== req.user.email) {
            return res.status(403).json({ message: "Unauthorized: You can only delete your own food items." });
        }

        const foodIdStr = String(food._id || req.params.id);
        const foodName = (food.name || "").trim();
        const userEmail = req.user.email.toLowerCase().trim();

        // Synchronize active donations linked to this food item to 'Removed by User'
        const activeStatuses = ["available", "requested"];
        const allUserDonations = await Donation.find({
            $or: [
                { foodId: foodIdStr },
                { userEmail: userEmail }
            ]
        });

        const activeLinkedDonations = (allUserDonations || []).filter(d => {
            const matchesId = d.foodId && String(d.foodId) === foodIdStr;
            const matchesName = d.foodName && foodName && d.foodName.toLowerCase().trim() === foodName.toLowerCase().trim();
            const matchesUser = (d.userEmail || "").toLowerCase().trim() === userEmail;
            const isMatch = matchesId || (matchesName && matchesUser);
            const st = (d.donationStatus || d.status || "").toLowerCase();
            return isMatch && activeStatuses.includes(st);
        });

        for (const d of activeLinkedDonations) {
            d.donationStatus = "removed_by_user";
            d.status = "Removed by User";
            d.removedAt = new Date();
            d.removedBy = userEmail;

            if (!Array.isArray(d.timeline)) d.timeline = [];
            d.timeline.push({
                event: "Removed by User",
                timestamp: new Date(),
                details: `Linked food inventory item "${foodName}" was deleted by the user. Donation listing marked Not Available.`,
                actor: d.donorName || req.user.name || "User"
            });

            await d.save();
        }

        await Food.findByIdAndDelete(req.params.id);
        res.status(200).json({
            message: "Food deleted successfully!",
            synchronizedDonations: activeLinkedDonations.length
        });
    } catch (error) {
        console.error("Food deletion error:", error.message);
        res.status(500).json({ message: "Server error while deleting food." });
    }
});

/* ========================================================
   FARMER CROPS APIS
======================================================== */

// Add farmer crop
app.post("/api/crops", authenticateToken, async function (req, res) {
    try {
        if (req.user.role !== "farmer") {
            return res.status(403).json({ message: "Only registered farmers can add crop produce." });
        }

        const { name, quantity, unit, date, location, description } = req.body;

        if (!name || quantity === undefined || !unit || !date || !location) {
            return res.status(400).json({ message: "Please fill all crop details (name, quantity, unit, date, location)." });
        }

        const numQty = Number(quantity);
        if (isNaN(numQty) || numQty <= 0) {
            return res.status(400).json({ message: "Crop quantity must be a positive number greater than 0." });
        }

        const newCrop = new Crop({
            userEmail: req.user.email,
            name: name.trim(),
            quantity: numQty,
            unit: unit.trim(),
            date: date,
            location: location.trim(),
            description: description ? description.trim() : "",
            status: "Available"
        });

        await newCrop.save();
        res.status(201).json({ message: "Crop added successfully!", crop: newCrop });
    } catch (error) {
        console.error("Crop saving error:", error.message);
        res.status(500).json({ message: "Server error while saving crop." });
    }
});

// Get farmer crops (only own crops)
app.get("/api/crops/:email", authenticateToken, async function (req, res) {
    try {
        const requestedEmail = req.params.email.toLowerCase().trim();
        if (req.user.email !== requestedEmail) {
            return res.status(403).json({ message: "Unauthorized: You can only view your own crop produce." });
        }

        const crops = await Crop.find({ userEmail: requestedEmail }).sort({ createdAt: -1 });
        res.status(200).json(crops);
    } catch (error) {
        console.error("Crop loading error:", error.message);
        res.status(500).json({ message: "Server error while loading crops." });
    }
});

// Edit farmer crop
app.put("/api/crops/:id", authenticateToken, async function (req, res) {
    try {
        const crop = await Crop.findById(req.params.id);
        if (!crop) {
            return res.status(404).json({ message: "Crop not found." });
        }

        if (crop.userEmail.toLowerCase() !== req.user.email) {
            return res.status(403).json({ message: "Unauthorized: You can only edit your own crops." });
        }

        const { name, quantity, unit, date, location, description, status } = req.body;
        if (name) crop.name = name.trim();
        if (quantity !== undefined) {
            const numQty = Number(quantity);
            if (isNaN(numQty) || numQty <= 0) {
                return res.status(400).json({ message: "Quantity must be a positive number." });
            }
            crop.quantity = numQty;
        }
        if (unit) crop.unit = unit.trim();
        if (date) crop.date = date;
        if (location) crop.location = location.trim();
        if (description !== undefined) crop.description = description ? description.trim() : "";
        if (status) crop.status = status;

        await crop.save();
        res.status(200).json({ message: "Crop updated successfully!", crop: crop });
    } catch (error) {
        console.error("Crop update error:", error.message);
        res.status(500).json({ message: "Server error while updating crop." });
    }
});

// Delete farmer crop
app.delete("/api/crops/:id", authenticateToken, async function (req, res) {
    try {
        const crop = await Crop.findById(req.params.id);
        if (!crop) {
            return res.status(404).json({ message: "Crop not found." });
        }

        if (crop.userEmail.toLowerCase() !== req.user.email) {
            return res.status(403).json({ message: "Unauthorized: You can only delete your own crops." });
        }

        const cropIdStr = String(crop._id || req.params.id);
        const cropName = (crop.name || "").trim();
        const userEmail = req.user.email.toLowerCase().trim();

        // Synchronize active crop donations linked to this crop item to 'Removed by User'
        const activeStatuses = ["available", "requested"];
        const allUserCropDonations = await CropDonation.find({
            $or: [
                { cropId: cropIdStr },
                { userEmail: userEmail }
            ]
        });

        const activeLinkedCrops = (allUserCropDonations || []).filter(cd => {
            const matchesId = cd.cropId && String(cd.cropId) === cropIdStr;
            const matchesName = cd.cropName && cropName && cd.cropName.toLowerCase().trim() === cropName.toLowerCase().trim();
            const matchesUser = (cd.userEmail || "").toLowerCase().trim() === userEmail;
            const isMatch = matchesId || (matchesName && matchesUser);
            const st = (cd.donationStatus || cd.status || "").toLowerCase();
            return isMatch && activeStatuses.includes(st);
        });

        for (const cd of activeLinkedCrops) {
            cd.donationStatus = "removed_by_user";
            cd.status = "Removed by User";
            cd.removedAt = new Date();
            cd.removedBy = userEmail;

            if (!Array.isArray(cd.timeline)) cd.timeline = [];
            cd.timeline.push({
                event: "Removed by Farmer",
                timestamp: new Date(),
                details: `Linked crop harvest "${cropName}" was deleted by the farmer. Crop donation listing marked Not Available.`,
                actor: cd.donorName || req.user.name || "Farmer"
            });

            await cd.save();
        }

        await Crop.findByIdAndDelete(req.params.id);
        res.status(200).json({
            message: "Crop deleted successfully!",
            synchronizedCropDonations: activeLinkedCrops.length
        });
    } catch (error) {
        console.error("Crop deletion error:", error.message);
        res.status(500).json({ message: "Server error while deleting crop." });
    }
});

/* ========================================================
   COMMON WORKFLOW HANDLERS FOR DONATIONS & CROP DONATIONS
======================================================== */

/**
 * Creates a donation record (Food or Crop)
 */
async function handleCreateDonation(Model, req, res, isCrop = false) {
    try {
        const {
            itemId,
            itemName,
            foodId,
            cropId,
            foodName,
            cropName,
            quantity,
            unit,
            category,
            location,
            pickupLocation,
            description,
            photo,
            donationType,
            expectedAmount,
            expiryDate
        } = req.body;

        const effectiveName = (itemName || (isCrop ? cropName : foodName) || "").trim();
        const effectiveId = itemId || (isCrop ? cropId : foodId) || "";

        if (!effectiveName || quantity === undefined || !unit || !location) {
            return res.status(400).json({
                message: "Please fill all required donation details (item name, quantity, unit, location)."
            });
        }

        const numQty = Number(quantity);
        if (isNaN(numQty) || numQty <= 0) {
            return res.status(400).json({ message: "Donation quantity must be greater than 0." });
        }

        // Validate food expiry: do not allow expired food to be newly donated
        if (!isCrop) {
            if (expiryDate) {
                const status = calculateExpiryStatus(expiryDate);
                if (status.isValid && status.isExpired) {
                    return res.status(400).json({
                        message: "Cannot donate expired food. Please select fresh surplus food."
                    });
                }
            }
            if (effectiveId && !effectiveId.startsWith("custom_")) {
                const existingFood = await Food.findById(effectiveId);
                if (existingFood && existingFood.expiryDate) {
                    const status = calculateExpiryStatus(existingFood.expiryDate);
                    if (status.isValid && status.isExpired) {
                        return res.status(400).json({
                            message: "Cannot donate expired food. The selected inventory item has already expired."
                        });
                    }
                }

                // Check if this inventory food item already has an active donation listing
                const existingActive = await Model.findOne({
                    foodId: effectiveId,
                    donationStatus: { $in: ["available", "requested", "accepted"] }
                });
                if (existingActive) {
                    return res.status(400).json({
                        message: "This food item is already actively listed for donation."
                    });
                }
            }

            // Deduplicate rapid consecutive submissions (within 15 seconds)
            const recentDuplicate = await Model.findOne({
                userEmail: req.user.email,
                foodName: effectiveName,
                quantity: numQty,
                unit: unit.trim(),
                donationStatus: "available",
                createdAt: { $gte: new Date(Date.now() - 15000) }
            });
            if (recentDuplicate) {
                return res.status(200).json({
                    message: "Food donation already listed.",
                    donation: recentDuplicate
                });
            }
        }

        // Retrieve real registered donor details from database
        const donorUser = await User.findOne({ email: req.user.email });
        const realDonorName = (donorUser && donorUser.name) ? donorUser.name : (req.body.donorName || "Registered Donor");
        const realDonorContact = (donorUser && donorUser.contactNumber) ? donorUser.contactNumber : (req.body.donorContact || "");
        const realDonorAddress = (donorUser && donorUser.address) ? donorUser.address : (pickupLocation || location || "").trim();

        const isValueBased = donationType === "value_based";
        const numericExpectedAmount = isValueBased ? Math.max(0, Number(expectedAmount) || 0) : 0;

        const defaultPhoto = isCrop
            ? "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=60"
            : "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=60";

        const donationData = {
            userEmail: req.user.email,
            donorName: realDonorName,
            donorEmail: req.user.email,
            donorContact: realDonorContact,
            donorAddress: realDonorAddress,
            quantity: numQty,
            unit: unit.trim(),
            category: category || (isCrop ? "Surplus Crop" : "Household Surplus"),
            location: (location || realDonorAddress || "Coimbatore").trim(),
            pickupLocation: (pickupLocation || realDonorAddress || location || "Coimbatore").trim(),
            description: description ? description.trim() : "",
            photo: photo || defaultPhoto,
            date: new Date().toLocaleDateString(),
            donationType: isValueBased ? "value_based" : "free",
            expectedAmount: numericExpectedAmount,
            agreedAmount: 0,
            paymentStatus: "not_applicable",
            donationStatus: "available",
            status: "Available",
            timeline: [
                {
                    event: isCrop ? "Crop Donation Created" : "Food Donation Created",
                    timestamp: new Date(),
                    details: isValueBased
                        ? `Value-Based donation listed with expected value of ₹${numericExpectedAmount}`
                        : "Free community donation listed for immediate redistribution (₹0)",
                    actor: realDonorName
                }
            ]
        };

        if (isCrop) {
            donationData.cropId = effectiveId;
            donationData.cropName = effectiveName;
        } else {
            donationData.foodId = effectiveId;
            donationData.foodName = effectiveName;
        }

        const newDonation = new Model(donationData);
        await newDonation.save();

        res.status(201).json({
            message: `${isCrop ? "Crop" : "Food"} donation created successfully!`,
            donation: newDonation
        });
    } catch (error) {
        console.error("Donation creation error:", error);
        res.status(500).json({ message: "Server error while creating donation." });
    }
}

/**
 * Handle NGO Request transition (AVAILABLE -> REQUESTED)
 */
async function handleRequestDonation(Model, req, res) {
    try {
        const donation = await Model.findById(req.params.id);
        if (!donation) {
            return res.status(404).json({ message: "Donation not found." });
        }

        const currentStatus = (donation.donationStatus || donation.status || "").toLowerCase();
        if (currentStatus !== "available" || currentStatus.includes("removed") || currentStatus.includes("not available")) {
            return res.status(400).json({
                message: `Cannot request donation: This donation has been removed or is no longer available.`
            });
        }

        if (req.user.role !== "ngo") {
            return res.status(403).json({
                message: "Only registered NGO accounts can request donations."
            });
        }

        // Fetch real registered NGO profile
        const ngoUser = await User.findOne({ email: req.user.email });
        const ngoTitle = ngoUser ? ngoUser.name : "Registered NGO";
        const ngoContact = ngoUser ? ngoUser.contactNumber : "";
        const { notes } = req.body;

        donation.donationStatus = "requested";
        donation.status = "Requested";
        donation.requestedBy = req.user.email;
        donation.ngoName = ngoTitle;
        donation.ngoEmail = req.user.email;
        donation.ngoContact = ngoContact;
        donation.requestedAt = new Date();

        if (!Array.isArray(donation.timeline)) donation.timeline = [];
        donation.timeline.push({
            event: "NGO Requested",
            timestamp: new Date(),
            details: `${ngoTitle} requested to collect this donation.${notes ? ' Note: ' + notes : ''}`,
            actor: ngoTitle
        });

        await donation.save();

        res.status(200).json({
            message: "Donation requested successfully! Donor has been notified.",
            donation: sanitizeDonationForViewer(donation, req.user)
        });
    } catch (error) {
        console.error("Donation request error:", error.message);
        res.status(500).json({ message: "Server error while requesting donation." });
    }
}

/**
 * Handle Donor Acceptance transition (REQUESTED -> ACCEPTED)
 */
async function handleAcceptDonation(Model, req, res) {
    try {
        const donation = await Model.findById(req.params.id);
        if (!donation) {
            return res.status(404).json({ message: "Donation not found." });
        }

        // Security check: Only the owner may accept
        if (donation.userEmail.toLowerCase() !== req.user.email) {
            return res.status(403).json({
                message: "Unauthorized: You can only accept requests for your own listings."
            });
        }

        const currentStatus = (donation.donationStatus || donation.status || "").toLowerCase();
        if (currentStatus !== "requested" || currentStatus.includes("removed") || currentStatus.includes("not available")) {
            return res.status(400).json({
                message: `Cannot accept donation: Listing has been removed or is no longer in requested status.`
            });
        }

        const { agreedAmount } = req.body;
        donation.donationStatus = "accepted";
        donation.status = "Accepted";
        donation.acceptedAt = new Date();

        if (donation.donationType === "value_based") {
            const finalAgreed = agreedAmount !== undefined && agreedAmount !== null && agreedAmount !== ""
                ? Math.max(0, Number(agreedAmount))
                : (donation.expectedAmount || 0);

            donation.agreedAmount = finalAgreed;
            donation.paymentStatus = "pending";
        } else {
            donation.agreedAmount = 0;
            donation.expectedAmount = 0;
            donation.paymentStatus = "not_applicable";
        }

        if (!Array.isArray(donation.timeline)) donation.timeline = [];
        donation.timeline.push({
            event: "Donor Accepted",
            timestamp: new Date(),
            details: donation.donationType === "value_based"
                ? `Donor confirmed request. Agreed value: ₹${donation.agreedAmount} (Expected: ₹${donation.expectedAmount})`
                : "Donor accepted request for free donation.",
            actor: donation.donorName || "Donor"
        });

        await donation.save();

        res.status(200).json({
            message: "Donation request accepted! Contact details are now available to the assigned NGO to coordinate pickup.",
            donation: sanitizeDonationForViewer(donation, req.user)
        });
    } catch (error) {
        console.error("Donation accept error:", error.message);
        res.status(500).json({ message: "Server error while accepting donation." });
    }
}

/**
 * Handle Donor Rejection transition (REQUESTED -> AVAILABLE)
 */
async function handleRejectDonation(Model, req, res) {
    try {
        const donation = await Model.findById(req.params.id);
        if (!donation) {
            return res.status(404).json({ message: "Donation not found." });
        }

        if (donation.userEmail.toLowerCase() !== req.user.email) {
            return res.status(403).json({
                message: "Unauthorized: Only the listing owner can decline requests."
            });
        }

        const currentStatus = (donation.donationStatus || donation.status || "").toLowerCase();
        if (currentStatus !== "requested") {
            return res.status(400).json({
                message: `Cannot decline: donation is currently '${donation.donationStatus || donation.status}'.`
            });
        }

        donation.donationStatus = "available";
        donation.status = "Available";
        const prevNgo = donation.ngoName || "NGO";
        donation.requestedBy = "";
        donation.ngoName = "";
        donation.ngoEmail = "";
        donation.ngoContact = "";

        if (!Array.isArray(donation.timeline)) donation.timeline = [];
        donation.timeline.push({
            event: "Request Declined",
            timestamp: new Date(),
            details: `Request from ${prevNgo} was declined. Donation is available again for other organizations.`,
            actor: donation.donorName || "Donor"
        });

        await donation.save();

        res.status(200).json({
            message: "Request declined. Donation returned to Available status.",
            donation: sanitizeDonationForViewer(donation, req.user)
        });
    } catch (error) {
        console.error("Donation reject error:", error.message);
        res.status(500).json({ message: "Server error while rejecting donation." });
    }
}

/**
 * Handle Schedule Pickup transition (ACCEPTED -> COLLECTION SCHEDULED)
 */
async function handleScheduleDonation(Model, req, res) {
    try {
        const donation = await Model.findById(req.params.id);
        if (!donation) {
            return res.status(404).json({ message: "Donation not found." });
        }

        const isDonor = donation.userEmail.toLowerCase() === req.user.email;
        const isNgo = donation.requestedBy && donation.requestedBy.toLowerCase() === req.user.email;

        if (!isDonor && !isNgo) {
            return res.status(403).json({
                message: "Unauthorized: Only the donor or assigned NGO can schedule pickup."
            });
        }

        const currentStatus = (donation.donationStatus || donation.status || "").toLowerCase();
        if (currentStatus !== "accepted" && currentStatus !== "collection_scheduled") {
            return res.status(400).json({
                message: "Donation must be in 'accepted' status to schedule pickup."
            });
        }

        const { pickupDate, pickupTime, pickupLocation } = req.body;
        if (!pickupDate || !pickupTime) {
            return res.status(400).json({
                message: "Please provide both pickup date and time."
            });
        }

        donation.pickupDate = pickupDate;
        donation.pickupTime = pickupTime;
        if (pickupLocation) {
            donation.pickupLocation = pickupLocation.trim();
        }

        donation.donationStatus = "collection_scheduled";
        donation.status = "Collection Scheduled";

        if (!Array.isArray(donation.timeline)) donation.timeline = [];
        donation.timeline.push({
            event: "Pickup Scheduled",
            timestamp: new Date(),
            details: `Pickup scheduled for ${pickupDate} at ${pickupTime}. Location: ${donation.pickupLocation || donation.location}`,
            actor: isDonor ? (donation.donorName || "Donor") : (donation.ngoName || "NGO")
        });

        await donation.save();

        res.status(200).json({
            message: "Collection pickup scheduled successfully!",
            donation: sanitizeDonationForViewer(donation, req.user)
        });
    } catch (error) {
        console.error("Donation scheduling error:", error.message);
        res.status(500).json({ message: "Server error while scheduling pickup." });
    }
}

/**
 * Handle Confirm Collection transition (COLLECTION SCHEDULED -> COLLECTED)
 * ONLY the authorized requesting NGO can confirm collection!
 */
async function handleCollectDonation(Model, req, res) {
    try {
        const donation = await Model.findById(req.params.id);
        if (!donation) {
            return res.status(404).json({ message: "Donation not found." });
        }

        if (!donation.requestedBy || donation.requestedBy.toLowerCase() !== req.user.email) {
            return res.status(403).json({
                message: "Unauthorized: Only the assigned NGO can confirm physical collection of this donation."
            });
        }

        const currentStatus = (donation.donationStatus || donation.status || "").toLowerCase();
        if (currentStatus !== "collection_scheduled" && currentStatus !== "accepted") {
            return res.status(400).json({
                message: `Donation must be accepted or scheduled before confirming collection. Currently '${donation.donationStatus || donation.status}'.`
            });
        }

        donation.donationStatus = "collected";
        donation.status = "Collected";
        donation.collectedAt = new Date();

        if (!Array.isArray(donation.timeline)) donation.timeline = [];
        donation.timeline.push({
            event: "Food Collected",
            timestamp: new Date(),
            details: `Items successfully collected in person by ${donation.ngoName || 'NGO'}.`,
            actor: donation.ngoName || "NGO"
        });

        await donation.save();

        res.status(200).json({
            message: "Collection confirmed successfully! Donor has been notified.",
            donation: sanitizeDonationForViewer(donation, req.user)
        });
    } catch (error) {
        console.error("Donation collection error:", error.message);
        res.status(500).json({ message: "Server error while confirming collection." });
    }
}

/**
 * Handle Payment Recording for value-based donations
 */
async function handlePaymentDonation(Model, req, res) {
    try {
        const donation = await Model.findById(req.params.id);
        if (!donation) {
            return res.status(404).json({ message: "Donation not found." });
        }

        const isDonor = donation.userEmail.toLowerCase() === req.user.email;
        const isNgo = donation.requestedBy && donation.requestedBy.toLowerCase() === req.user.email;
        if (!isDonor && !isNgo) {
            return res.status(403).json({ message: "Unauthorized: Only transaction participants can record payment." });
        }

        if (donation.donationType !== "value_based") {
            return res.status(400).json({
                message: "This is a free community donation (₹0). Payment tracking is not applicable."
            });
        }

        const { method, notes } = req.body;
        const paymentResult = await paymentService.recordPayment(donation, {
            amount: donation.agreedAmount || donation.expectedAmount,
            method: method || "Cash / Direct Reimbursement",
            notes: notes || "Payment confirmed by participants.",
            recordedBy: req.user.email
        });

        donation.paymentStatus = "paid";
        donation.paymentRecordedAt = new Date();

        if (!Array.isArray(donation.timeline)) donation.timeline = [];
        donation.timeline.push({
            event: "Payment Recorded",
            timestamp: new Date(),
            details: `Payment of ₹${donation.agreedAmount || donation.expectedAmount} recorded (${paymentResult.method}). Ref: ${paymentResult.transactionId}`,
            actor: "Payment Service"
        });

        await donation.save();

        res.status(200).json({
            message: "Payment successfully recorded!",
            paymentResult: paymentResult,
            donation: sanitizeDonationForViewer(donation, req.user)
        });
    } catch (error) {
        console.error("Donation payment error:", error.message);
        res.status(500).json({ message: "Server error while recording payment." });
    }
}

/**
 * Handle Final Completion (COLLECTED -> COMPLETED)
 */
async function handleCompleteDonation(Model, req, res) {
    try {
        const donation = await Model.findById(req.params.id);
        if (!donation) {
            return res.status(404).json({ message: "Donation not found." });
        }

        const isDonor = donation.userEmail.toLowerCase() === req.user.email;
        const isNgo = donation.requestedBy && donation.requestedBy.toLowerCase() === req.user.email;
        if (!isDonor && !isNgo) {
            return res.status(403).json({ message: "Unauthorized: Only transaction participants can complete this donation." });
        }

        const currentStatus = (donation.donationStatus || donation.status || "").toLowerCase();
        if (currentStatus !== "collected") {
            return res.status(400).json({
                message: `Donation must be collected before marking as completed. Currently '${donation.donationStatus || donation.status}'.`
            });
        }

        donation.donationStatus = "completed";
        donation.status = "Completed";
        donation.completedAt = new Date();

        if (!donation.receiptId) {
            donation.receiptId = paymentService.generateReceiptId(donation._id);
        }

        if (!Array.isArray(donation.timeline)) donation.timeline = [];
        donation.timeline.push({
            event: "Completed",
            timestamp: new Date(),
            details: `Donation transaction fully completed. Receipt ID: ${donation.receiptId}`,
            actor: donation.donorName || "Donor"
        });

        await donation.save();

        res.status(200).json({
            message: "Donation transaction completed successfully! Receipt generated.",
            donation: sanitizeDonationForViewer(donation, req.user)
        });
    } catch (error) {
        console.error("Donation complete error:", error.message);
        res.status(500).json({ message: "Server error while completing donation." });
    }
}

/**
 * Handle Cancellation
 * Supports both:
 * 1. NGO cancelling their active pending request -> reverts listing to 'available'
 * 2. Donor withdrawing their available or requested listing -> marks listing 'cancelled'
 * Disallows cancelling completed or collected transactions.
 */
async function handleCancelDonation(Model, req, res) {
    try {
        const donation = await Model.findById(req.params.id);
        if (!donation) {
            return res.status(404).json({ message: "Donation not found." });
        }

        const isDonor = donation.userEmail.toLowerCase() === req.user.email;
        const isAssignedNgo = donation.requestedBy && donation.requestedBy.toLowerCase() === req.user.email;

        if (!isDonor && !isAssignedNgo) {
            return res.status(403).json({
                message: "Unauthorized: Only the listing donor or assigned NGO can cancel this donation."
            });
        }

        const currentStatus = (donation.donationStatus || donation.status || "").toLowerCase();
        if (currentStatus === "completed" || currentStatus === "collected") {
            return res.status(400).json({
                message: "Cannot cancel a donation that has already been collected or completed."
            });
        }

        const { reason } = req.body;

        // NGO cancels their pending request
        if (isAssignedNgo && !isDonor) {
            if (currentStatus !== "requested" && currentStatus !== "accepted") {
                return res.status(400).json({
                    message: "NGO can only withdraw active pending or accepted requests before pickup."
                });
            }

            const prevNgo = donation.ngoName || "NGO";
            donation.donationStatus = "available";
            donation.status = "Available";
            donation.requestedBy = "";
            donation.ngoName = "";
            donation.ngoEmail = "";
            donation.ngoContact = "";

            if (!Array.isArray(donation.timeline)) donation.timeline = [];
            donation.timeline.push({
                event: "NGO Request Cancelled",
                timestamp: new Date(),
                details: `${prevNgo} cancelled their collection request${reason ? ': ' + reason : ''}. Listing is available again.`,
                actor: prevNgo
            });

            await donation.save();
            return res.status(200).json({
                message: "Your request has been cancelled. Donation returned to the available marketplace.",
                donation: sanitizeDonationForViewer(donation, req.user)
            });
        }

        // Donor withdraws their listing
        if (isDonor) {
            donation.donationStatus = "cancelled";
            donation.status = "Cancelled";
            donation.cancelledAt = new Date();

            if (!Array.isArray(donation.timeline)) donation.timeline = [];
            donation.timeline.push({
                event: "Donation Withdrawn",
                timestamp: new Date(),
                details: reason ? `Withdrawn: ${reason}` : "Donation listing withdrawn by donor.",
                actor: donation.donorName || "Donor"
            });

            await donation.save();
            return res.status(200).json({
                message: "Donation listing has been cancelled.",
                donation: sanitizeDonationForViewer(donation, req.user)
            });
        }
    } catch (error) {
        console.error("Donation cancellation error:", error.message);
        res.status(500).json({ message: "Server error while cancelling donation." });
    }
}

/**
 * Handle NGO Removal transition (AVAILABLE / REQUESTED -> REMOVED_BY_NGO)
 * Strictly restricted to authorized NGO accounts!
 * Keeps donation record in DB for history without deleting it.
 */
async function handleNgoRemoveDonation(Model, req, res) {
    try {
        if (!req.user || req.user.role !== "ngo") {
            return res.status(403).json({
                message: "Unauthorized: Only authorized NGOs can remove donation listings."
            });
        }

        const donation = await Model.findById(req.params.id);
        if (!donation) {
            return res.status(404).json({ message: "Donation not found." });
        }

        const currentStatus = (donation.donationStatus || donation.status || "").toLowerCase();
        if (currentStatus === "completed" || currentStatus === "collected") {
            return res.status(400).json({
                message: "Cannot remove a donation that has already been collected or completed."
            });
        }

        const ngoUser = await User.findOne({ email: req.user.email });
        const ngoName = ngoUser ? ngoUser.name : (req.user.name || "NGO");
        const reason = req.body && req.body.reason ? req.body.reason : "Removed from available listings by authorized NGO.";

        donation.donationStatus = "removed_by_ngo";
        donation.status = "Removed by NGO";
        donation.removedAt = new Date();
        donation.removedBy = req.user.email;

        if (!Array.isArray(donation.timeline)) donation.timeline = [];
        donation.timeline.push({
            event: "Removed by NGO",
            timestamp: new Date(),
            details: reason,
            actor: ngoName
        });

        await donation.save();

        res.status(200).json({
            message: "Donation listing removed successfully.",
            donation: sanitizeDonationForViewer(donation, req.user)
        });
    } catch (error) {
        console.error("NGO donation removal error:", error.message);
        res.status(500).json({ message: "Server error while removing donation." });
    }
}

/* ========================================================
   FOOD DONATION ROUTE DEFINITIONS
======================================================== */

// Create a new food donation
app.post("/api/donations", authenticateToken, (req, res) => handleCreateDonation(Donation, req, res, false));

// Get all food donations (with optional filters) - Enriched with donor account details & contact privacy
app.get("/api/donations", optionalAuth, async function (req, res) {
    try {
        const { status } = req.query;
        let query = {};

        if (status && status !== "all") {
            query.$or = [
                { donationStatus: status.toLowerCase() },
                { status: status }
            ];
        }

        // Filter out automated test runner records from public marketplace
        if (status === "available" || !status) {
            query.userEmail = { $not: /^expiry_tester_/i };
        }

        const donations = await Donation.find(query).sort({ createdAt: -1 });

        // Retrieve associated donor user accounts to guarantee accurate donor names and addresses
        const donorEmails = [...new Set(donations.map(d => (d.userEmail || d.donorEmail || "").toLowerCase().trim()).filter(Boolean))];
        const donorUsers = await User.find({ email: { $in: donorEmails } });
        const userMap = new Map((donorUsers || []).map(u => [((u && u.email) || "").toLowerCase(), u]));

        // Enrich donations with real donor user details and deduplicate by foodId / unique listing
        const seenIds = new Set();
        const seenFoodInventoryIds = new Set();
        const enriched = [];

        for (const donation of donations) {
            const doc = donation.toObject ? donation.toObject() : { ...donation };
            const docIdStr = String(doc._id);

            // Deduplicate exact donation document ID
            if (seenIds.has(docIdStr)) continue;
            seenIds.add(docIdStr);

            // If an inventory item is listed multiple times as available, keep only the latest one
            if (doc.foodId && !doc.foodId.startsWith("custom_") && (status === "available" || !status)) {
                if (seenFoodInventoryIds.has(doc.foodId)) continue;
                seenFoodInventoryIds.add(doc.foodId);
            }

            const donorUser = userMap.get((doc.userEmail || doc.donorEmail || "").toLowerCase().trim());
            if (donorUser) {
                doc.donorName = donorUser.name || doc.donorName || "Registered Donor";
                if (donorUser.address) {
                    doc.donorAddress = donorUser.address;
                    doc.pickupLocation = doc.pickupLocation || donorUser.address;
                    doc.location = doc.location || donorUser.address;
                }
            } else if (!doc.donorName) {
                doc.donorName = "Registered Donor";
            }

            const sanitized = sanitizeDonationForViewer(doc, req.user);
            enriched.push(sanitized);
        }

        res.status(200).json(enriched);
    } catch (error) {
        console.error("All donation loading error:", error.message);
        res.status(500).json({ message: "Server error while loading donations." });
    }
});

// Single food donation by ID
app.get("/api/donations/item/:id", optionalAuth, async function (req, res) {
    try {
        const donation = await Donation.findById(req.params.id);
        if (!donation) return res.status(404).json({ message: "Donation not found." });
        const doc = donation.toObject ? donation.toObject() : { ...donation };
        const donorUser = await User.findOne({ email: (doc.userEmail || doc.donorEmail || "").toLowerCase().trim() });
        if (donorUser) {
            doc.donorName = donorUser.name || doc.donorName || "Registered Donor";
            if (donorUser.address) {
                doc.donorAddress = donorUser.address;
                doc.pickupLocation = doc.pickupLocation || donorUser.address;
                doc.location = doc.location || donorUser.address;
            }
        }
        res.status(200).json(sanitizeDonationForViewer(doc, req.user));
    } catch (error) {
        res.status(500).json({ message: "Server error loading donation." });
    }
});

// Get donations by user email (Donor) - Protected, owner only
app.get("/api/donations/user/:email", authenticateToken, async function (req, res) {
    try {
        const email = req.params.email.toLowerCase().trim();
        if (req.user.email !== email) {
            return res.status(403).json({ message: "Unauthorized: You can only view your own donations." });
        }
        const donations = await Donation.find({ userEmail: email }).sort({ createdAt: -1 });
        res.status(200).json(Array.isArray(donations) ? donations : []);
    } catch (error) {
        console.error("Donations error:", error.message);
        res.status(500).json({ message: "Server error loading user donations." });
    }
});

// Backward-compatible user email endpoint
app.get("/api/donations/:email", authenticateToken, async function (req, res) {
    try {
        const email = req.params.email.toLowerCase().trim();
        if (req.user.email !== email) {
            return res.status(403).json({ message: "Unauthorized: You can only view your own donations." });
        }
        const donations = await Donation.find({ userEmail: email }).sort({ createdAt: -1 });
        res.status(200).json(Array.isArray(donations) ? donations : []);
    } catch (error) {
        console.error("Donations error:", error.message);
        res.status(500).json({ message: "Server error loading donations." });
    }
});

// Get donations associated with an NGO - Protected, assigned NGO only
app.get("/api/donations/ngo/:email", authenticateToken, async function (req, res) {
    try {
        const email = req.params.email.toLowerCase().trim();
        if (req.user.email !== email) {
            return res.status(403).json({ message: "Unauthorized: You can only view assignments for your own NGO." });
        }
        const donations = await Donation.find({ requestedBy: email }).sort({ createdAt: -1 });
        const sanitized = donations.map(d => sanitizeDonationForViewer(d, req.user));
        res.status(200).json(sanitized);
    } catch (error) {
        res.status(500).json({ message: "Server error loading NGO donations." });
    }
});

// Food donation state transitions
app.put("/api/donations/:id/request", authenticateToken, (req, res) => handleRequestDonation(Donation, req, res));
app.put("/api/donations/:id/accept", authenticateToken, (req, res) => handleAcceptDonation(Donation, req, res));
app.put("/api/donations/:id/reject", authenticateToken, (req, res) => handleRejectDonation(Donation, req, res));
app.put("/api/donations/:id/schedule", authenticateToken, (req, res) => handleScheduleDonation(Donation, req, res));
app.put("/api/donations/:id/collect", authenticateToken, (req, res) => handleCollectDonation(Donation, req, res));
app.put("/api/donations/:id/payment", authenticateToken, (req, res) => handlePaymentDonation(Donation, req, res));
app.put("/api/donations/:id/complete", authenticateToken, (req, res) => handleCompleteDonation(Donation, req, res));
app.put("/api/donations/:id/cancel", authenticateToken, (req, res) => handleCancelDonation(Donation, req, res));
app.put("/api/donations/:id/remove", authenticateToken, (req, res) => handleNgoRemoveDonation(Donation, req, res));
app.delete("/api/donations/:id", authenticateToken, (req, res) => handleNgoRemoveDonation(Donation, req, res));

/* ========================================================
   CROP DONATION ROUTE DEFINITIONS
======================================================== */

// Create a new crop donation
app.post("/api/crop-donations", authenticateToken, (req, res) => handleCreateDonation(CropDonation, req, res, true));

// Get all crop donations (with optional filters) - Contact numbers sanitized before acceptance
app.get("/api/crop-donations", optionalAuth, async function (req, res) {
    try {
        const { status } = req.query;
        let query = {};

        if (status && status !== "all") {
            query.$or = [
                { donationStatus: status.toLowerCase() },
                { status: status }
            ];
        }

        const cropDonations = await CropDonation.find(query).sort({ createdAt: -1 });
        const sanitized = cropDonations.map(d => sanitizeDonationForViewer(d, req.user));
        res.status(200).json(sanitized);
    } catch (error) {
        console.error("Crop donation loading error:", error.message);
        res.status(500).json({ message: "Server error while loading crop donations." });
    }
});

// Single crop donation by ID
app.get("/api/crop-donations/item/:id", optionalAuth, async function (req, res) {
    try {
        const donation = await CropDonation.findById(req.params.id);
        if (!donation) return res.status(404).json({ message: "Crop donation not found." });
        res.status(200).json(sanitizeDonationForViewer(donation, req.user));
    } catch (error) {
        res.status(500).json({ message: "Server error loading crop donation." });
    }
});

// Get crop donations by user email (Farmer) - Protected, owner only
app.get("/api/crop-donations/user/:email", authenticateToken, async function (req, res) {
    try {
        const email = req.params.email.toLowerCase().trim();
        if (req.user.email !== email) {
            return res.status(403).json({ message: "Unauthorized: You can only view your own crop donations." });
        }
        const cropDonations = await CropDonation.find({ userEmail: email }).sort({ createdAt: -1 });
        res.status(200).json(cropDonations);
    } catch (error) {
        res.status(500).json({ message: "Server error loading farmer crop donations." });
    }
});

// Backward-compatible crop donations user email endpoint
app.get("/api/crop-donations/:email", authenticateToken, async function (req, res) {
    try {
        const email = req.params.email.toLowerCase().trim();
        if (req.user.email !== email) {
            return res.status(403).json({ message: "Unauthorized: You can only view your own crop donations." });
        }
        const cropDonations = await CropDonation.find({ userEmail: email }).sort({ createdAt: -1 });
        res.status(200).json(cropDonations);
    } catch (error) {
        res.status(500).json({ message: "Server error loading crop donations." });
    }
});

// Get crop donations associated with an NGO - Protected, assigned NGO only
app.get("/api/crop-donations/ngo/:email", authenticateToken, async function (req, res) {
    try {
        const email = req.params.email.toLowerCase().trim();
        if (req.user.email !== email) {
            return res.status(403).json({ message: "Unauthorized: You can only view assignments for your own NGO." });
        }
        const cropDonations = await CropDonation.find({ requestedBy: email }).sort({ createdAt: -1 });
        const sanitized = cropDonations.map(d => sanitizeDonationForViewer(d, req.user));
        res.status(200).json(sanitized);
    } catch (error) {
        res.status(500).json({ message: "Server error loading NGO crop donations." });
    }
});

// Crop donation state transitions
app.put("/api/crop-donations/:id/request", authenticateToken, (req, res) => handleRequestDonation(CropDonation, req, res));
app.put("/api/crop-donations/:id/accept", authenticateToken, (req, res) => handleAcceptDonation(CropDonation, req, res));
app.put("/api/crop-donations/:id/reject", authenticateToken, (req, res) => handleRejectDonation(CropDonation, req, res));
app.put("/api/crop-donations/:id/schedule", authenticateToken, (req, res) => handleScheduleDonation(CropDonation, req, res));
app.put("/api/crop-donations/:id/collect", authenticateToken, (req, res) => handleCollectDonation(CropDonation, req, res));
app.put("/api/crop-donations/:id/payment", authenticateToken, (req, res) => handlePaymentDonation(CropDonation, req, res));
app.put("/api/crop-donations/:id/complete", authenticateToken, (req, res) => handleCompleteDonation(CropDonation, req, res));
app.put("/api/crop-donations/:id/cancel", authenticateToken, (req, res) => handleCancelDonation(CropDonation, req, res));
app.put("/api/crop-donations/:id/remove", authenticateToken, (req, res) => handleNgoRemoveDonation(CropDonation, req, res));
app.delete("/api/crop-donations/:id", authenticateToken, (req, res) => handleNgoRemoveDonation(CropDonation, req, res));

/* ========================================================
   AI RECIPE & NUTRITION SUGGESTION APIS
======================================================== */

// Generate healthy recipes from inventory (Protected / Optional Auth)
app.post("/api/ai/recipes", optionalAuth, async function (req, res) {
    try {
        let foods = [];
        if (req.user && req.user.email) {
            // Strictly query the authenticated user's current saved inventory from MongoDB
            foods = await Food.find({ userEmail: req.user.email });
        } else if (Array.isArray(req.body.foods)) {
            foods = req.body.foods;
        }

        const recipes = aiRecipeService.generateRecipesForInventory(foods);
        res.status(200).json({ recipes });
    } catch (error) {
        console.error("AI Recipe generation error:", error.message);
        res.status(500).json({ message: "Server error generating recipe suggestions." });
    }
});

// Get AI recipes for logged-in user inventory
app.get("/api/ai/recipes/:email", authenticateToken, async function (req, res) {
    try {
        const email = req.params.email.toLowerCase().trim();
        if (req.user.email !== email) {
            return res.status(403).json({ message: "Unauthorized: You can only view recipes for your own inventory." });
        }

        const foods = await Food.find({ userEmail: email });
        const recipes = aiRecipeService.generateRecipesForInventory(foods);
        res.status(200).json({ recipes });
    } catch (error) {
        console.error("AI Recipe loading error:", error.message);
        res.status(500).json({ message: "Server error generating recipe suggestions." });
    }
});

/* ========================================================
   DASHBOARD ANALYTICS & STATS APIS
======================================================== */

// Donor Dashboard Statistics (Protected, owner only)
app.get("/api/stats/donor/:email", authenticateToken, async function (req, res) {
    try {
        const email = req.params.email.toLowerCase().trim();
        if (req.user.email !== email) {
            return res.status(403).json({ message: "Unauthorized: You can only view your own statistics." });
        }

        const foodDonations = await Donation.find({ userEmail: email });
        const cropDonations = await CropDonation.find({ userEmail: email });
        const allDonations = [...foodDonations, ...cropDonations];

        const totalDonations = allDonations.length;
        const foodDonatedKg = foodDonations.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
        const cropDonatedKg = cropDonations.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);

        const totalDonationValue = allDonations.reduce((sum, d) => {
            const val = d.agreedAmount || d.expectedAmount || 0;
            return sum + (Number(val) || 0);
        }, 0);

        const completedDonations = allDonations.filter(d =>
            (d.donationStatus || d.status || "").toLowerCase() === "completed"
        ).length;

        const activeDonations = allDonations.filter(d =>
            !["completed", "cancelled"].includes((d.donationStatus || d.status || "").toLowerCase())
        ).length;

        const pendingPayments = allDonations.filter(d =>
            d.donationType === "value_based" && d.paymentStatus === "pending"
        ).reduce((sum, d) => sum + (Number(d.agreedAmount || d.expectedAmount) || 0), 0);

        res.status(200).json({
            totalDonations,
            activeDonations,
            foodDonatedKg,
            cropDonatedKg,
            totalDonationValue,
            completedDonations,
            pendingPayments
        });
    } catch (error) {
        console.error("Donor stats error:", error.message);
        res.status(500).json({ message: "Server error calculating stats." });
    }
});

// NGO Dashboard Statistics (Protected, assigned NGO only)
app.get("/api/stats/ngo/:email", authenticateToken, async function (req, res) {
    try {
        const email = req.params.email.toLowerCase().trim();
        if (req.user.email !== email) {
            return res.status(403).json({ message: "Unauthorized: You can only view your own NGO statistics." });
        }

        const foodDonations = await Donation.find({ requestedBy: email });
        const cropDonations = await CropDonation.find({ requestedBy: email });
        const allAssigned = [...foodDonations, ...cropDonations];

        const donationsRequested = allAssigned.filter(d =>
            (d.donationStatus || d.status || "").toLowerCase() === "requested"
        ).length;

        const donationsAccepted = allAssigned.filter(d =>
            ["accepted", "collection_scheduled"].includes((d.donationStatus || d.status || "").toLowerCase())
        ).length;

        const donationsCollected = allAssigned.filter(d =>
            (d.donationStatus || d.status || "").toLowerCase() === "collected"
        ).length;

        const donationsCompleted = allAssigned.filter(d =>
            (d.donationStatus || d.status || "").toLowerCase() === "completed"
        ).length;

        const totalFoodReceivedKg = foodDonations.filter(d =>
            ["collected", "completed"].includes((d.donationStatus || d.status || "").toLowerCase())
        ).reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);

        const totalCropReceivedKg = cropDonations.filter(d =>
            ["collected", "completed"].includes((d.donationStatus || d.status || "").toLowerCase())
        ).reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);

        const totalValue = allAssigned.filter(d =>
            ["collected", "completed"].includes((d.donationStatus || d.status || "").toLowerCase())
        ).reduce((sum, d) => sum + (Number(d.agreedAmount || d.expectedAmount) || 0), 0);

        res.status(200).json({
            donationsRequested,
            donationsAccepted,
            donationsCollected,
            donationsCompleted,
            totalFoodReceivedKg,
            totalCropReceivedKg,
            totalValue
        });
    } catch (error) {
        console.error("NGO stats error:", error.message);
        res.status(500).json({ message: "Server error calculating NGO stats." });
    }
});

// Friendly routes for frontend pages
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/login.html"));
});
app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/register.html"));
});
app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/dashboard.html"));
});

// Render / Cloud Health Check
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "healthy",
        uptime: process.uptime(),
        storageEngine: db.isUsingLocalDb ? "Local High-Reliability Store" : "MongoDB Atlas Cluster",
        timestamp: new Date().toISOString()
    });
});

// Client SPA / page fallback: send index.html for non-API routes
app.use(function (req, res, next) {
    if (req.method === "GET" && !req.path.startsWith("/api/")) {
        return res.sendFile(path.join(__dirname, "../public/index.html"));
    }
    next();
});

// Start server
app.listen(PORT, "0.0.0.0", function () {
    console.log(`🌱 ZeroWaste backend running on port ${PORT} (0.0.0.0)`);
});