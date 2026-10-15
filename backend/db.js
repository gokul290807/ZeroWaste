const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MongooseUser = require("./models/User");
const MongooseFood = require("./models/Food");
const MongooseCrop = require("./models/Crop");
const MongooseDonation = require("./models/Donation");
const MongooseCropDonation = require("./models/CropDonation");

const dataDir = path.join(__dirname, "data");
const dataFilePath = path.join(dataDir, "zerowaste_store.json");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

let isUsingLocalDb = false;
let memoryStore = {
    users: [],
    foods: [],
    crops: [],
    donations: [],
    cropDonations: []
};

function loadLocalStore() {
    if (fs.existsSync(dataFilePath)) {
        try {
            const raw = fs.readFileSync(dataFilePath, "utf8");
            memoryStore = JSON.parse(raw);
        } catch (e) {
            console.error("Error reading local data file:", e.message);
        }
    }
}

function saveLocalStore() {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(memoryStore, null, 2), "utf8");
    } catch (e) {
        console.error("Error saving local data file:", e.message);
    }
}

async function seedDemoDataIfNeeded() {
    loadLocalStore();

    if (!memoryStore.users || memoryStore.users.length === 0) {
        console.log("🌱 Seeding realistic demo data for college presentation...");
        const hashedPw = await bcrypt.hash("password123", 10);

        memoryStore.users = [
            {
                _id: "usr_rahul_01",
                name: "Rahul Sharma",
                email: "rahul@gmail.com",
                password: hashedPw,
                role: "household",
                contactNumber: "+91 98765 43210",
                address: "45 Gandhi Road, RS Puram, Coimbatore",
                createdAt: new Date().toISOString()
            },
            {
                _id: "usr_suresh_02",
                name: "Suresh Patel",
                email: "suresh@farmer.com",
                password: hashedPw,
                role: "farmer",
                contactNumber: "+91 98123 45678",
                address: "Farm Sector 4, Pollachi, Coimbatore",
                createdAt: new Date().toISOString()
            },
            {
                _id: "usr_ngo_03",
                name: "Helping Hands NGO",
                email: "ngo@helpinghands.org",
                password: hashedPw,
                role: "ngo",
                contactNumber: "+91 91234 56789",
                address: "ZeroWaste Community Center, Coimbatore",
                createdAt: new Date().toISOString()
            }
        ];

        memoryStore.foods = [
            {
                _id: "food_tomato_01",
                userEmail: "rahul@gmail.com",
                name: "Fresh Tomatoes",
                quantity: 10,
                unit: "kg",
                expiryDate: "2026-10-15",
                category: "Vegetables",
                createdAt: new Date().toISOString()
            },
            {
                _id: "food_biryani_02",
                userEmail: "rahul@gmail.com",
                name: "Vegetable Biryani",
                quantity: 5,
                unit: "packets",
                expiryDate: "2026-10-06",
                category: "Cooked Meals",
                createdAt: new Date().toISOString()
            }
        ];

        memoryStore.crops = [
            {
                _id: "crop_wheat_01",
                userEmail: "suresh@farmer.com",
                name: "Organic Wheat",
                quantity: 50,
                unit: "kg",
                date: "2026-10-25",
                location: "Pollachi, Coimbatore",
                description: "Freshly harvested organic wheat, dry and packaged.",
                status: "Available",
                createdAt: new Date().toISOString()
            }
        ];

        memoryStore.donations = [
            {
                _id: "don_tomato_101",
                foodId: "food_tomato_01",
                userEmail: "rahul@gmail.com",
                donorName: "Rahul Sharma",
                donorEmail: "rahul@gmail.com",
                donorContact: "+91 98765 43210",
                foodName: "Fresh Tomatoes",
                quantity: 10,
                unit: "kg",
                category: "Vegetables",
                location: "RS Puram, Coimbatore",
                pickupLocation: "RS Puram, Coimbatore",
                description: "Farm-fresh ripe tomatoes, suitable for community kitchen.",
                photo: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=60",
                donationType: "value_based",
                expectedAmount: 300,
                agreedAmount: 0,
                paymentStatus: "not_applicable",
                donationStatus: "available",
                status: "Available",
                date: new Date().toLocaleDateString(),
                createdAt: new Date().toISOString(),
                timeline: [
                    {
                        event: "Donation Created",
                        timestamp: new Date().toISOString(),
                        details: "Value-based donation created with expected value of ₹300",
                        actor: "Rahul Sharma"
                    }
                ]
            },
            {
                _id: "don_biryani_102",
                foodId: "food_biryani_02",
                userEmail: "rahul@gmail.com",
                donorName: "Rahul Sharma",
                donorEmail: "rahul@gmail.com",
                donorContact: "+91 98765 43210",
                foodName: "Vegetable Biryani",
                quantity: 5,
                unit: "packets",
                category: "Cooked Meals",
                location: "Gandhipuram, Coimbatore",
                pickupLocation: "Gandhipuram, Coimbatore",
                description: "Freshly prepared vegetable biryani packets, clean and ready for consumption.",
                photo: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60",
                donationType: "free",
                expectedAmount: 0,
                agreedAmount: 0,
                paymentStatus: "not_applicable",
                donationStatus: "available",
                status: "Available",
                date: new Date().toLocaleDateString(),
                createdAt: new Date().toISOString(),
                timeline: [
                    {
                        event: "Donation Created",
                        timestamp: new Date().toISOString(),
                        details: "Free donation created for immediate redistribution",
                        actor: "Rahul Sharma"
                    }
                ]
            }
        ];

        memoryStore.cropDonations = [
            {
                _id: "cdon_wheat_201",
                cropId: "crop_wheat_01",
                userEmail: "suresh@farmer.com",
                donorName: "Suresh Patel",
                donorEmail: "suresh@farmer.com",
                donorContact: "+91 98123 45678",
                cropName: "Organic Wheat",
                quantity: 50,
                unit: "kg",
                category: "Grains",
                location: "Pollachi, Coimbatore",
                pickupLocation: "Pollachi, Coimbatore",
                description: "Surplus organic wheat from harvest. Available for immediate pickup.",
                photo: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=60",
                donationType: "value_based",
                expectedAmount: 1200,
                agreedAmount: 0,
                paymentStatus: "not_applicable",
                donationStatus: "available",
                status: "Available",
                date: new Date().toLocaleDateString(),
                createdAt: new Date().toISOString(),
                timeline: [
                    {
                        event: "Crop Donation Created",
                        timestamp: new Date().toISOString(),
                        details: "Farmer crop donation created with expected value of ₹1,200",
                        actor: "Suresh Patel"
                    }
                ]
            }
        ];

        saveLocalStore();
        console.log("✅ Seeded demo users: rahul@gmail.com, suresh@farmer.com, ngo@helpinghands.org (Password: password123)");
    }
}

// Wrapper for collection in local store with Mongoose-like syntax
function createLocalModel(collectionKey) {
    function Model(docData = {}) {
        Object.assign(this, docData);
        if (!this._id) {
            this._id = `${collectionKey.slice(0, 3)}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        }
        if (!this.createdAt) {
            this.createdAt = new Date().toISOString();
        }
    }

    Model.prototype.save = async function() {
        loadLocalStore();
        const list = memoryStore[collectionKey] || [];
        const index = list.findIndex(item => String(item._id) === String(this._id));
        const plain = JSON.parse(JSON.stringify(this));
        if (index >= 0) {
            list[index] = plain;
        } else {
            list.unshift(plain);
        }
        memoryStore[collectionKey] = list;
        saveLocalStore();
        return this;
    };

    function matchQuery(item, query) {
        if (!query || Object.keys(query).length === 0) return true;
        for (const [key, val] of Object.entries(query)) {
            if (key === "$or" && Array.isArray(val)) {
                const anyMatch = val.some(subQuery => matchQuery(item, subQuery));
                if (!anyMatch) return false;
            } else if (key === "$and" && Array.isArray(val)) {
                const allMatch = val.every(subQuery => matchQuery(item, subQuery));
                if (!allMatch) return false;
            } else if (val && typeof val === "object" && val.$in) {
                if (!val.$in.includes(item[key])) return false;
            } else if (val && typeof val === "object" && val.$ne !== undefined) {
                if (item[key] === val.$ne) return false;
            } else if (item[key] !== val) {
                return false;
            }
        }
        return true;
    }

    class QueryHelper {
        constructor(results) {
            this.results = results;
        }
        sort(sortObj) {
            if (sortObj && (sortObj.createdAt === -1 || sortObj._id === -1)) {
                this.results.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            }
            return this;
        }
        then(resolve, reject) {
            return Promise.resolve(this.results).then(resolve, reject);
        }
    }

    Model.find = function(query = {}) {
        loadLocalStore();
        const list = memoryStore[collectionKey] || [];
        const matched = list.filter(item => matchQuery(item, query));
        const instances = matched.map(doc => {
            const inst = new Model(doc);
            return inst;
        });
        return new QueryHelper(instances);
    };

    Model.findOne = async function(query = {}) {
        loadLocalStore();
        const list = memoryStore[collectionKey] || [];
        const found = list.find(item => matchQuery(item, query));
        return found ? new Model(found) : null;
    };

    Model.findById = async function(id) {
        loadLocalStore();
        const list = memoryStore[collectionKey] || [];
        const found = list.find(item => String(item._id) === String(id));
        return found ? new Model(found) : null;
    };

    Model.findByIdAndDelete = async function(id) {
        loadLocalStore();
        const list = memoryStore[collectionKey] || [];
        const index = list.findIndex(item => String(item._id) === String(id));
        if (index >= 0) {
            const [deleted] = list.splice(index, 1);
            memoryStore[collectionKey] = list;
            saveLocalStore();
            return new Model(deleted);
        }
        return null;
    };

    Model.findByIdAndUpdate = async function(id, updateData, options = {}) {
        loadLocalStore();
        const list = memoryStore[collectionKey] || [];
        const index = list.findIndex(item => String(item._id) === String(id));
        if (index >= 0) {
            const target = list[index];
            if (updateData.$set) {
                Object.assign(target, updateData.$set);
            } else {
                Object.assign(target, updateData);
            }
            if (updateData.$push) {
                for (const [arrKey, pushVal] of Object.entries(updateData.$push)) {
                    if (!Array.isArray(target[arrKey])) target[arrKey] = [];
                    target[arrKey].push(pushVal);
                }
            }
            list[index] = target;
            memoryStore[collectionKey] = list;
            saveLocalStore();
            return new Model(target);
        }
        return null;
    };

    return Model;
}

const LocalUser = createLocalModel("users");
const LocalFood = createLocalModel("foods");
const LocalCrop = createLocalModel("crops");
const LocalDonation = createLocalModel("donations");
const LocalCropDonation = createLocalModel("cropDonations");

// Proxy models that dynamically delegate to Mongoose if online, or Local Models if offline
function createDynamicModelProxy(mongooseModel, localModel) {
    return new Proxy(mongooseModel, {
        get(target, prop) {
            if (isUsingLocalDb) {
                return localModel[prop];
            }
            return target[prop];
        },
        construct(target, args) {
            if (isUsingLocalDb) {
                return new localModel(...args);
            }
            return new target(...args);
        }
    });
}

const User = createDynamicModelProxy(MongooseUser, LocalUser);
const Food = createDynamicModelProxy(MongooseFood, LocalFood);
const Crop = createDynamicModelProxy(MongooseCrop, LocalCrop);
const Donation = createDynamicModelProxy(MongooseDonation, LocalDonation);
const CropDonation = createDynamicModelProxy(MongooseCropDonation, LocalCropDonation);

async function initDatabase() {
    loadLocalStore();
    if (process.env.SEED_DEMO_DATA === "true") {
        await seedDemoDataIfNeeded();
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.log("ℹ️ No MONGODB_URI found. Operating in Local High-Reliability Mode.");
        isUsingLocalDb = true;
        return;
    }

    try {
        console.log("🔄 Connecting to MongoDB Atlas...");
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000
        });
        console.log("✅ MongoDB Atlas connected successfully!");
        isUsingLocalDb = false;
    } catch (err) {
        console.log("⚠️ MongoDB Atlas connection unavailable (IP whitelist or network).");
        console.log("🚀 ACTIVATING LOCAL HIGH-RELIABILITY STORAGE ENGINE.");
        isUsingLocalDb = true;
    }
}

module.exports = {
    initDatabase,
    get isUsingLocalDb() { return isUsingLocalDb; },
    User,
    Food,
    Crop,
    Donation,
    CropDonation
};
