/**
 * ZeroWaste - Intelligent Healthy Recipe & Nutrition Suggestion Service
 * Generates easy, healthy recipes tailored to food in the user's inventory.
 * Strictly prioritizes items expiring soon, marks optional pantry items,
 * provides vegetarian alternatives, and suggests donation as a complementary option.
 */

const { calculateExpiryStatus } = require("../dateUtils");

// Standard healthy zero-waste recipe database mapped to staple ingredients
const RECIPE_KNOWLEDGE_BASE = [
    // --- MILK / DAIRY RECIPES ---
    {
        id: "golden_turmeric_milk",
        keywords: ["milk", "dairy", "toned milk", "cow milk", "buffalo milk", "fresh milk"],
        name: "Golden Turmeric Spiced Milk (Haldi Doodh)",
        prepTime: "2 mins",
        cookTime: "5 mins",
        totalTime: "7 mins",
        isVegetarian: true,
        dietaryTags: ["🥦 100% Vegetarian", "🌱 Immunity Booster", "☕ Warming Drink"],
        matchIngredient: "milk",
        defaultQty: "250-500 ml",
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
        healthBenefit: "Rich in bioavailable calcium for strong bones and Curcumin from turmeric; provides powerful anti-inflammatory and antioxidant support to soothe the digestive system and promote restful sleep.",
        vegetarianAlternative: "Plant-Based Alternative: Perfectly suitable for soy, almond, oat, or coconut milk for a 100% lactose-free vegan option."
    },
    {
        id: "fresh_homemade_paneer",
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

    // --- BREAD / BAKERY RECIPES ---
    {
        id: "healthy_vegetable_bread_upma",
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
        id: "crispy_tomato_garlic_bruschetta",
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

    // --- TOMATOES RECIPES ---
    {
        id: "comforting_tomato_rasam_soup",
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
        id: "quick_tomato_onion_chutney",
        keywords: ["tomato", "tomatoes", "tamatar"],
        name: "Quick Homestyle Tomato & Onion Skillet Chutney",
        prepTime: "5 mins",
        cookTime: "7 mins",
        totalTime: "12 mins",
        isVegetarian: true,
        dietaryTags: ["🥦 100% Vegetarian", "🌶️ Zesty Spread", "🥫 Zero-Waste Condiment"],
        matchIngredient: "tomato",
        defaultQty: "2 - 4 tomatoes",
        optionalPantryAdditions: [
            "1 tsp cooking oil",
            "Pinch of mustard seeds, salt, and red chili powder",
            "1/2 onion if available in your kitchen"
        ],
        steps: [
            "Roughly dice tomatoes (and onion if available).",
            "Heat 1 tsp oil in a pan, add mustard seeds until they pop, then add the diced vegetables.",
            "Season with salt and a pinch of chili powder. Cook covered on medium-low flame for 6 minutes until soft and jammy.",
            "Use as a flavorful sandwich spread, dip for rotis, or rice accompaniment!"
        ],
        healthBenefit: "High in dietary potassium, folate, and protective flavonoids with zero artificial additives or added sugars.",
        vegetarianAlternative: "100% vegan and gluten-free."
    },

    // --- POTATOES RECIPES ---
    {
        id: "golden_cumin_roasted_potatoes",
        keywords: ["potato", "potatoes", "aloo", "aaloo", "baby potato"],
        name: "Golden Cumin Roasted Potatoes (Homestyle Jeera Aloo)",
        prepTime: "5 mins",
        cookTime: "12 mins",
        totalTime: "17 mins",
        isVegetarian: true,
        dietaryTags: ["🥦 100% Vegetarian", "🥔 Comfort Classic", "🌾 Gluten-Free"],
        matchIngredient: "potato",
        defaultQty: "2 - 3 medium potatoes",
        optionalPantryAdditions: [
            "1 tsp cumin seeds (jeera)",
            "1 tsp cooking oil",
            "1/4 tsp turmeric powder, salt to taste, pinch of black pepper"
        ],
        steps: [
            "Wash and dice your inventory potatoes into 1/2-inch cubes (leave skins on for extra dietary fiber).",
            "Heat 1 tsp oil in a non-stick skillet over medium heat and add cumin seeds until aromatic (about 30 seconds).",
            "Add the diced potatoes, turmeric, and salt. Toss well to coat.",
            "Cover with a lid and cook on low heat for 8-10 minutes, stirring every 2 minutes until tender inside and crisp golden outside."
        ],
        healthBenefit: "Rich in potassium, Vitamin B6, and prebiotic resistant starch; helps regulate blood pressure and supports digestive microbiome health.",
        vegetarianAlternative: "100% vegan. Can also be prepared with sweet potatoes for a lower glycemic index."
    },

    // --- RICE RECIPES ---
    {
        id: "soothing_vegetable_khichdi",
        keywords: ["rice", "basmati", "cooked rice", "raw rice", "chawal", "arisi"],
        name: "Soothing One-Pot Vegetable Khichdi",
        prepTime: "5 mins",
        cookTime: "15 mins",
        totalTime: "20 mins",
        isVegetarian: true,
        dietaryTags: ["🥦 100% Vegetarian", "🌱 Ayurvedic Comfort", "🍲 Complete Meal"],
        matchIngredient: "rice",
        defaultQty: "1 cup rice",
        optionalPantryAdditions: [
            "3 cups water",
            "1 tsp cumin seeds & 1 tsp oil or ghee",
            "1/4 tsp turmeric powder & salt to taste",
            "Optional: 1/2 cup lentils (moong dal) or diced veggies if available"
        ],
        steps: [
            "Rinse your inventory rice under water until clear.",
            "In a pot, warm 1 tsp oil or ghee, add cumin seeds, and toast for 30 seconds.",
            "Add the rinsed rice, turmeric, salt, and 3 cups of water (add any diced vegetables from your kitchen).",
            "Cover and simmer on low heat for 12-15 minutes until soft, creamy, and soothing."
        ],
        healthBenefit: "Ayurveda's premier restorative meal; exceptionally easy to digest, restores electrolyte balance, and provides steady, clean energy.",
        vegetarianAlternative: "100% vegan when made with cooking oil instead of ghee."
    },

    // --- APPLES & BANANAS (FRUITS) ---
    {
        id: "warm_cinnamon_stewed_apples",
        keywords: ["apple", "apples", "seb", "green apple"],
        name: "Warm Cinnamon Stewed Apples",
        prepTime: "3 mins",
        cookTime: "6 mins",
        totalTime: "9 mins",
        isVegetarian: true,
        dietaryTags: ["🥦 100% Vegetarian", "🍎 Sugar-Free Treat", "🌱 High Fiber"],
        matchIngredient: "apple",
        defaultQty: "1 - 2 apples",
        optionalPantryAdditions: [
            "2 tbsp water",
            "1/4 tsp ground cinnamon",
            "Optional: 1 tsp honey or squeeze of lemon"
        ],
        steps: [
            "Core and slice your inventory apples into thin wedges (peeling is optional).",
            "Place apple slices in a small pan with 2 tablespoons of water and a generous sprinkle of cinnamon.",
            "Cover and cook on low heat for 5-6 minutes until fork-tender and naturally sweet and aromatic.",
            "Serve warm as a comforting dessert or healthy breakfast topping!"
        ],
        healthBenefit: "Concentrated source of soluble Pectin fiber which supports healthy cholesterol levels and acts as a prebiotic for gut bacteria.",
        vegetarianAlternative: "100% vegan, naturally sweetened, and allergen-free."
    },
    {
        id: "no_bake_banana_energy_bites",
        keywords: ["banana", "bananas", "kela", "plantain"],
        name: "No-Bake Natural Banana Energy Bites",
        prepTime: "4 mins",
        cookTime: "0 mins",
        totalTime: "4 mins",
        isVegetarian: true,
        dietaryTags: ["🥦 100% Vegetarian", "🍌 No-Cook Snack", "⚡ Instant Energy"],
        matchIngredient: "banana",
        defaultQty: "1 - 2 ripe bananas",
        optionalPantryAdditions: [
            "2-3 tbsp rolled oats, breadcrumbs, or seeds (pantry binder)",
            "Pinch of cinnamon or cocoa powder"
        ],
        steps: [
            "Peel ripe bananas and mash thoroughly with a fork in a mixing bowl.",
            "Stir in rolled oats, seeds, or a pinch of cinnamon until a thick, workable mixture forms.",
            "Shape into small bite-sized balls or simply enjoy with a spoon as a natural pre-workout snack!"
        ],
        healthBenefit: "Loaded with potassium, Vitamin B6, and natural fructose; replenishes muscle glycogen and prevents cramps without refined sugars.",
        vegetarianAlternative: "100% vegan, raw, and gluten-free."
    },

    // --- EGGS RECIPES ---
    {
        id: "quick_veggie_egg_scramble",
        keywords: ["egg", "eggs", "anda", "muttai"],
        name: "Wholesome Masala Veggie Egg Scramble",
        prepTime: "3 mins",
        cookTime: "5 mins",
        totalTime: "8 mins",
        isVegetarian: false, // Eggetarian
        dietaryTags: ["🥚 Eggetarian", "💪 High Protein", "⚡ Quick 5-Min Meal"],
        matchIngredient: "egg",
        defaultQty: "2 eggs",
        optionalPantryAdditions: [
            "1 tsp cooking oil",
            "Pinch of salt and black pepper",
            "Optional: Chopped onions, tomatoes, or green herbs from your kitchen"
        ],
        steps: [
            "Crack eggs into a bowl, add a pinch of salt, pepper, and 1 tbsp water; whisk briskly for 30 seconds for maximum fluffiness.",
            "Heat 1 tsp oil in a pan, briefly sauté any available diced veggies for 1 minute.",
            "Pour in the beaten eggs and cook on low heat, gently pushing curds from the edges toward the center until soft and velvety.",
            "Remove from heat while still slightly soft and serve warm with toast or roti!"
        ],
        healthBenefit: "Complete protein source providing all 9 essential amino acids, choline for brain cognitive health, and eye-protective lutein.",
        vegetarianAlternative: "Strict Vegetarian / Vegan Alternative: Replace eggs with crumbled firm tofu (Tofu Scramble) and pinch of turmeric for a 100% plant-based scramble!"
    },

    // --- WHEAT / FLOUR RECIPES ---
    {
        id: "wholesome_wheat_savory_pancakes",
        keywords: ["wheat", "flour", "atta", "maida", "besan"],
        name: "Wholesome Whole Wheat Savory Pancakes (Atta Cheela)",
        prepTime: "5 mins",
        cookTime: "8 mins",
        totalTime: "13 mins",
        isVegetarian: true,
        dietaryTags: ["🥦 100% Vegetarian", "🥞 Fiber-Rich", "🍳 Easy Skillet Meal"],
        matchIngredient: "flour",
        defaultQty: "1 cup flour",
        optionalPantryAdditions: [
            "3/4 cup water (to form smooth batter)",
            "Pinch of salt, turmeric, and cumin seeds",
            "1 tsp cooking oil for the pan"
        ],
        steps: [
            "In a bowl, whisk flour with water, salt, turmeric, and cumin until a smooth, lump-free pouring batter is formed.",
            "Heat a lightly oiled skillet over medium heat. Pour a ladle of batter and spread gently into a round pancake.",
            "Cook for 2-3 minutes until bubbles appear on top and bottom is golden. Flip and cook other side for 2 minutes.",
            "Serve hot with any pickle, chutney, or yogurt!"
        ],
        healthBenefit: "Rich in insoluble dietary fiber and complex starches; promotes steady blood sugar levels and prolonged satiety.",
        vegetarianAlternative: "100% vegan. Can be made with chickpea flour (besan) or oats flour for gluten-free diets."
    }
];

/**
 * Dynamically synthesizes a healthy, sensible recipe for custom or unmatched ingredients
 */
function synthesizeDynamicRecipe(foodItem) {
    const name = foodItem.name || "Surplus Ingredient";
    const qty = `${foodItem.quantity || 1} ${foodItem.unit || "portion"}`;

    return {
        id: `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: `Nourishing Homestyle Sautéed ${name}`,
        prepTime: "5 mins",
        cookTime: "10 mins",
        totalTime: "15 mins",
        isVegetarian: true,
        dietaryTags: ["🥦 100% Vegetarian", "🌱 Zero-Waste Sauté", "🍲 Quick & Clean"],
        matchIngredient: name.toLowerCase(),
        defaultQty: `${qty} from your inventory`,
        inventoryIngredients: [
            {
                name: name,
                quantity: qty,
                isExpiringSoon: false,
                expiryText: ""
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
            message: `Have more ${name} than you can prepare today? You can also share surplus portions with partner NGOs before it reaches critical dates.`,
            foodId: foodItem._id || "",
            foodName: name
        }
    };
}

/**
 * Core Recipe Generator: Evaluates active inventory items and synthesizes healthy recipe suggestions.
 * Prioritizes items expiring soon (diffDays === 0 or diffDays === 1).
 * Never uses expired foods.
 *
 * @param {Array} foods - Array of food items belonging to the user
 * @param {Object} [options]
 * @returns {Array} Structured recipe suggestions
 */
function generateRecipesForInventory(foods, options = {}) {
    if (!Array.isArray(foods) || foods.length === 0) {
        // Return 2 starter zero-waste staple recipes when inventory is empty
        return [
            {
                id: "starter_golden_milk",
                name: "Golden Turmeric Spiced Milk (Zero-Waste Starter)",
                prepTime: "2 mins",
                cookTime: "5 mins",
                totalTime: "7 mins",
                isVegetarian: true,
                dietaryTags: ["🥦 100% Vegetarian", "🌱 Immunity Booster"],
                matchIngredient: "milk",
                defaultQty: "1 glass (250 ml)",
                inventoryIngredients: [
                    { name: "Fresh Milk (or plant-based milk)", quantity: "250 ml", isExpiringSoon: false, expiryText: "Pantry staple" }
                ],
                optionalPantryAdditions: ["Pinch of turmeric powder", "Pinch of black pepper", "1 tsp honey or jaggery"],
                steps: [
                    "Warm milk gently in a saucepan over medium heat.",
                    "Whisk in turmeric and a pinch of black pepper.",
                    "Pour into your favorite mug, sweeten with honey, and enjoy!"
                ],
                healthBenefit: "Soothes inflammation, boosts immunity, and promotes restorative natural sleep.",
                vegetarianAlternative: "Vegan: Use almond, oat, or soy milk.",
                donationOption: {
                    message: "Log your household surplus in ZeroWaste to unlock automated expiry alerts and community sharing.",
                    foodId: "",
                    foodName: "Surplus"
                }
            },
            {
                id: "starter_tomato_rasam",
                name: "Comforting Fresh Tomato Rasam Broth",
                prepTime: "4 mins",
                cookTime: "10 mins",
                totalTime: "14 mins",
                isVegetarian: true,
                dietaryTags: ["🥦 100% Vegetarian", "🥣 Gut Cleansing"],
                matchIngredient: "tomato",
                defaultQty: "2 ripe tomatoes",
                inventoryIngredients: [
                    { name: "Ripe Tomatoes", quantity: "2 pieces", isExpiringSoon: false, expiryText: "Pantry staple" }
                ],
                optionalPantryAdditions: ["2 cups water", "1/2 tsp cumin seeds", "Crushed garlic & salt to taste"],
                steps: [
                    "Mash ripe tomatoes in 2 cups of water with salt and crushed garlic.",
                    "Simmer for 7 minutes, temper with cumin seeds in 1/2 tsp oil, and enjoy warm!"
                ],
                healthBenefit: "High in Lycopene and Vitamin C; flushes toxins and supports gut immunity.",
                vegetarianAlternative: "100% vegan and gluten-free.",
                donationOption: {
                    message: "Log your household surplus in ZeroWaste to unlock automated expiry alerts and community sharing.",
                    foodId: "",
                    foodName: "Surplus"
                }
            }
        ];
    }

    // 1. Filter out expired foods: NEVER recommend expired food for cooking or consumption!
    const validFoods = foods.filter(f => {
        const status = calculateExpiryStatus(f.expiryDate);
        return status.isValid && !status.isExpired;
    });

    if (validFoods.length === 0) {
        return [];
    }

    // 2. Sort valid foods by urgency: expiring today (0) or tomorrow (1) first
    validFoods.sort((a, b) => {
        const statA = calculateExpiryStatus(a.expiryDate);
        const statB = calculateExpiryStatus(b.expiryDate);
        return (statA.diffDays || 99) - (statB.diffDays || 99);
    });

    const matchedRecipes = [];
    const usedRecipeIds = new Set();

    // 3. Match knowledge base recipes against valid user foods
    for (const food of validFoods) {
        const foodNameLower = (food.name || "").toLowerCase().trim();
        const foodCategoryLower = (food.category || "").toLowerCase().trim();
        const status = calculateExpiryStatus(food.expiryDate);
        const isExpiringSoon = status.diffDays === 0 || status.diffDays === 1;
        const expiryLabel = status.diffDays === 0 ? "Expires today!" : (status.diffDays === 1 ? "Expires tomorrow!" : status.statusText);

        // Find candidate recipes matching this food
        const matchingKbs = RECIPE_KNOWLEDGE_BASE.filter(kb => {
            if (usedRecipeIds.has(kb.id)) return false;
            return kb.keywords.some(kw => foodNameLower.includes(kw) || foodCategoryLower.includes(kw));
        });

        for (const kb of matchingKbs) {
            usedRecipeIds.add(kb.id);

            // Construct enriched recipe with user's specific inventory quantities & expiry alert
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

            // Check if other inventory items can be paired into this recipe
            for (const otherFood of validFoods) {
                if (String(otherFood._id) === String(food._id)) continue;
                const otherLower = (otherFood.name || "").toLowerCase();
                const otherStatus = calculateExpiryStatus(otherFood.expiryDate);
                // If the recipe optional pantry or steps mentions this other item, add it as secondary inventory ingredient
                if (otherLower.includes("onion") && kb.name.toLowerCase().includes("onion")) {
                    recipe.inventoryIngredients.push({
                        name: otherFood.name,
                        quantity: `${otherFood.quantity} ${otherFood.unit}`,
                        isExpiringSoon: otherStatus.diffDays <= 1,
                        expiryText: otherStatus.diffDays <= 1 ? "Expires soon" : ""
                    });
                } else if (otherLower.includes("tomato") && (kb.name.toLowerCase().includes("tomato") || kb.name.toLowerCase().includes("bruschetta"))) {
                    recipe.inventoryIngredients.push({
                        name: otherFood.name,
                        quantity: `${otherFood.quantity} ${otherFood.unit}`,
                        isExpiringSoon: otherStatus.diffDays <= 1,
                        expiryText: otherStatus.diffDays <= 1 ? "Expires soon" : ""
                    });
                }
            }

            matchedRecipes.push(recipe);
            if (matchedRecipes.length >= 4) break;
        }

        if (matchedRecipes.length >= 4) break;
    }

    // 4. If user has unique/custom items that didn't match pre-defined recipes, synthesize custom zero-waste recipes
    if (matchedRecipes.length < 2) {
        for (const food of validFoods) {
            const alreadyUsed = matchedRecipes.some(r => r.inventoryIngredients.some(i => i.name === food.name));
            if (!alreadyUsed) {
                const dynamic = synthesizeDynamicRecipe(food);
                const status = calculateExpiryStatus(food.expiryDate);
                dynamic.inventoryIngredients[0].isExpiringSoon = status.diffDays <= 1;
                dynamic.inventoryIngredients[0].expiryText = status.diffDays === 0 ? "Expires today!" : (status.diffDays === 1 ? "Expires tomorrow!" : status.statusText);
                matchedRecipes.push(dynamic);
                if (matchedRecipes.length >= 3) break;
            }
        }
    }

    return matchedRecipes;
}

module.exports = {
    RECIPE_KNOWLEDGE_BASE,
    generateRecipesForInventory,
    synthesizeDynamicRecipe
};
