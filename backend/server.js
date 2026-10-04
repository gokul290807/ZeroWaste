const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Food = require("./models/Food");
const Donation = require("./models/Donation");
const Crop = require("./models/Crop");
const CropDonation = require("./models/CropDonation");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = 3000;


// Allow JSON data
app.use(express.json());
app.use(cors());

// Serve ZeroWaste frontend
app.use(express.static(path.join(__dirname, "../public")));


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(function () {

        console.log("✅ MongoDB connected successfully!");

    })
    .catch(function (error) {

        console.log("❌ MongoDB connection failed:");
        console.log(error.message);

    });

// Register new user
app.post("/api/register", async function (req, res) {

    try {

        const {
            name,
            email,
            password,
            role
        } = req.body;

        if (!name || !email || !password || !role) {

            return res.status(400).json({
                message: "Please fill all fields."
            });

        }

        const existingUser =
            await User.findOne({
                email: email
            });

        if (existingUser) {

            return res.status(400).json({
                message: "Email already registered."
            });

        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const newUser =
            new User({

                name: name,

                email: email,

                password: hashedPassword,

                role: role

            });

        await newUser.save();

        res.status(201).json({

            message:
                "Account created successfully!"

        });

    } catch (error) {

        console.log(
            "Registration error:",
            error.message
        );

        res.status(500).json({

            message:
                "Server error while registering."

        });

    }

});
// Login user
app.post("/api/login", async function (req, res) {

    try {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {

            return res.status(400).json({

                message:
                    "Please enter email and password."

            });

        }


        const user =
            await User.findOne({
                email: email
            });


        if (!user) {

            return res.status(401).json({

                message:
                    "Invalid email or password."

            });

        }


        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).json({

                message:
                    "Invalid email or password."

            });

        }


        res.status(200).json({

            message:
                "Login successful!",

            user: {

                name: user.name,

                email: user.email,

                role: user.role

            }

        });


    } catch (error) {

        console.log(
            "Login error:",
            error.message
        );


        res.status(500).json({

            message:
                "Server error while logging in."

        });

    }

});
// Test route
app.get("/api/test", function (req, res) {
    res.json({
        message: "ZeroWaste API is working!"
    });
});
app.get("/api/test", function (req, res) {

    res.json({
        message: "ZeroWaste API is working!"
    });

});
// Add food to MongoDB
app.post("/api/foods", async function (req, res) {

    try {

        const {
            userEmail,
            name,
            quantity,
            unit,
            expiryDate,
            category
        } = req.body;

        if (
            !userEmail ||
            !name ||
            !quantity ||
            !unit ||
            !expiryDate ||
            !category
        ) {

            return res.status(400).json({
                message: "Please fill all food details."
            });

        }

        const newFood = new Food({

            userEmail: userEmail,

            name: name,

            quantity: quantity,

            unit: unit,

            expiryDate: expiryDate,

            category: category

        });

        await newFood.save();

        res.status(201).json({

            message: "Food added successfully!",

            food: newFood

        });

    } catch (error) {

        console.log(
            "Food saving error:",
            error.message
        );

        res.status(500).json({

            message:
                "Server error while saving food."

        });

    }

});


// Get food from MongoDB
app.get("/api/foods/:email", async function (req, res) {

    try {

        const foods =
            await Food.find({
                userEmail: req.params.email
            });

        res.status(200).json(foods);

    } catch (error) {

        console.log(
            "Food loading error:",
            error.message
        );

        res.status(500).json({

            message:
                "Server error while loading food."

        });

    }

});
// Delete food from MongoDB
app.delete("/api/foods/:id", async function (req, res) {

    try {

        const deletedFood =
            await Food.findByIdAndDelete(
                req.params.id
            );

        if (!deletedFood) {

            return res.status(404).json({

                message:
                    "Food item not found."

            });

        }

        res.status(200).json({

            message:
                "Food deleted successfully!"

        });

    } catch (error) {

        console.log(
            "Food deletion error:",
            error.message
        );

        res.status(500).json({

            message:
                "Server error while deleting food."

        });

    }

});

// Create a new food donation
app.post("/api/donations", async function (req, res) {

    try {

        const {
            userEmail,
            foodId,
            foodName,
            quantity,
            unit,
            location,
            description
        } = req.body;


        if (
            !userEmail ||
            !foodId ||
            !foodName ||
            !quantity ||
            !unit ||
            !location
        ) {

            return res.status(400).json({

                message:
                    "Please fill all donation details."

            });

        }


        const newDonation =
            new Donation({

                userEmail: userEmail,

                foodId: foodId,

                foodName: foodName,

                quantity: Number(quantity),

                unit: unit,

                location: location,

                description:
                    description || "",

                date:
                    new Date().toLocaleDateString(),

                status: "Available"

            });


        await newDonation.save();


        res.status(201).json({

            message:
                "Donation created successfully!",

            donation:
                newDonation

        });


    } catch (error) {

        console.log(
            "Donation saving error:",
            error.message
        );


        res.status(500).json({

            message:
                "Server error while saving donation."

        });

    }

});
// Get donations for a user
app.get("/api/donations/:email", async function (req, res) {

    try {

        const donations =
            await Donation.find({
                userEmail: req.params.email
            }).sort({
                createdAt: -1
            });


        res.status(200).json(
            donations
        );


    } catch (error) {

        console.log(
            "Donation loading error:",
            error.message
        );


        res.status(500).json({

            message:
                "Server error while loading donations."

        });

    }

});
app.get("/api/donations", async function (req, res) {
    try {

        const donations =
            await Donation.find({
                status: "Available"
            }).sort({
                createdAt: -1
            });

        res.status(200).json(donations);

    } catch (error) {

        console.log(
            "All donation loading error:",
            error.message
        );

        res.status(500).json({
            message:
                "Server error while loading donations."
        });
    }
});
// Add a new farmer crop
app.post("/api/crops", async function (req, res) {

    try {

        const {
            userEmail,
            name,
            quantity,
            unit,
            date,
            location,
            description
        } = req.body;


        if (
            !userEmail ||
            !name ||
            !quantity ||
            !unit ||
            !date ||
            !location
        ) {

            return res.status(400).json({

                message:
                    "Please fill all crop details."

            });

        }


        const newCrop =
            new Crop({

                userEmail: userEmail,

                name: name,

                quantity: Number(quantity),

                unit: unit,

                date: date,

                location: location,

                description:
                    description || "",

                status: "Available"

            });


        await newCrop.save();


        res.status(201).json({

            message:
                "Crop added successfully!",

            crop:
                newCrop

        });


    } catch (error) {

        console.log(
            "Crop saving error:",
            error.message
        );


        res.status(500).json({

            message:
                "Server error while saving crop."

        });

    }

});
// Get crops for a farmer
app.get("/api/crops/:email", async function (req, res) {

    try {

        const crops =
            await Crop.find({
                userEmail: req.params.email
            }).sort({
                createdAt: -1
            });


        res.status(200).json(
            crops
        );


    } catch (error) {

        console.log(
            "Crop loading error:",
            error.message
        );


        res.status(500).json({

            message:
                "Server error while loading crops."

        });

    }

});
// Delete a farmer crop
app.delete("/api/crops/:id", async function (req, res) {

    try {

        const deletedCrop =
            await Crop.findByIdAndDelete(
                req.params.id
            );


        if (!deletedCrop) {

            return res.status(404).json({

                message:
                    "Crop not found."

            });

        }


        res.status(200).json({

            message:
                "Crop deleted successfully!"

        });


    } catch (error) {

        console.log(
            "Crop deletion error:",
            error.message
        );


        res.status(500).json({

            message:
                "Server error while deleting crop."

        });

    }

});
// Create a new crop donation
app.post("/api/crop-donations", async function (req, res) {

    try {

        const {
            userEmail,
            cropId,
            cropName,
            quantity,
            unit,
            location,
            description
        } = req.body;


        if (
            !userEmail ||
            !cropId ||
            !cropName ||
            !quantity ||
            !unit ||
            !location
        ) {

            return res.status(400).json({

                message:
                    "Please fill all crop donation details."

            });

        }


        const newCropDonation =
            new CropDonation({

                userEmail: userEmail,

                cropId: cropId,

                cropName: cropName,

                quantity: Number(quantity),

                unit: unit,

                location: location,

                description:
                    description || "",

                date:
                    new Date().toLocaleDateString(),

                status: "Available"

            });


        await newCropDonation.save();


        res.status(201).json({

            message:
                "Crop donation created successfully!",

            donation:
                newCropDonation

        });


    } catch (error) {

        console.log(
            "Crop donation saving error:",
            error.message
        );


        res.status(500).json({

            message:
                "Server error while saving crop donation."

        });

    }

});
app.get("/api/crop-donations/:email", async function (req, res) {
    try {

        const cropDonations =
            await CropDonation.find({
                userEmail: req.params.email
            }).sort({
                createdAt: -1
            });

        res.status(200).json(cropDonations);

    } catch (error) {

        console.log(
            "Crop donation loading error:",
            error.message
        );

        res.status(500).json({
            message:
                "Server error while loading crop donations."
        });
    }
});
app.get("/api/crop-donations", async function (req, res) {
    try {

        const cropDonations =
            await CropDonation.find({
                status: "Available"
            }).sort({
                createdAt: -1
            });

        res.status(200).json(cropDonations);

    } catch (error) {

        console.log(
            "All crop donation loading error:",
            error.message
        );

        res.status(500).json({
            message:
                "Server error while loading crop donations."
        });
    }
});
// Start server
app.listen(PORT, function () {

    console.log(
        `🌱 Zero Waste backend running at http://localhost:${PORT}`
    );

});