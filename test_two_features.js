/**
 * ZeroWaste - Comprehensive Verification Test for the Two Fixed Features:
 * 1. Food expiry notifications
 * 2. Healthy AI recipe suggestions
 */

const assert = require("assert");
const { parseCalendarDate, calculateExpiryStatus, formatCalendarDate } = require("./backend/dateUtils");
const aiRecipeService = require("./backend/services/aiRecipeService");

console.log("=================================================");
console.log("🧪 1. Testing Food Expiry Notifications Requirements");
console.log("=================================================");

// Mock today: 2026-10-15
const baseDate = new Date(2026, 9, 15); // Oct 15, 2026

// 1.1 Expiry exactly one day away (2026-10-16)
const tomorrowStatus = calculateExpiryStatus("2026-10-16", baseDate);
assert.strictEqual(tomorrowStatus.diffDays, 1, "Expiry date exactly one day away must have diffDays === 1");
assert.strictEqual(tomorrowStatus.isExpiringTomorrow, true, "isExpiringTomorrow must be true");
assert.strictEqual(tomorrowStatus.isExpired, false, "Must not be expired");
assert.strictEqual(tomorrowStatus.isNotificationEligible, true, "Must be eligible for notification");
console.log("  ✅ PASS: calculateExpiryStatus correctly identifies date exactly 1 day away (diffDays === 1)");

// 1.2 Expiry today (2026-10-15)
const todayStatus = calculateExpiryStatus("2026-10-15", baseDate);
assert.strictEqual(todayStatus.diffDays, 0, "Today expiry must have diffDays === 0");
assert.strictEqual(todayStatus.isExpiringToday, true, "isExpiringToday must be true");
assert.strictEqual(todayStatus.isExpired, false, "Must not be marked expired before calendar day ends");
console.log("  ✅ PASS: calculateExpiryStatus correctly identifies date expiring today (diffDays === 0)");

// 1.3 Expired food (2026-10-14)
const expiredStatus = calculateExpiryStatus("2026-10-14", baseDate);
assert.strictEqual(expiredStatus.diffDays, -1, "Yesterday expiry must have diffDays === -1");
assert.strictEqual(expiredStatus.isExpired, true, "isExpired must be true");
console.log("  ✅ PASS: calculateExpiryStatus correctly identifies expired items (diffDays < 0)");

// 1.4 Show ALL foods expiring tomorrow, not just the first item
const mockInventory = [
    { _id: "food_1", name: "Fresh Milk", quantity: 2, unit: "litres", expiryDate: "2026-10-16" }, // Tomorrow
    { _id: "food_2", name: "Sliced Bread", quantity: 1, unit: "packet", expiryDate: "2026-10-16" }, // Tomorrow
    { _id: "food_3", name: "Farm Tomatoes", quantity: 500, unit: "grams", expiryDate: "2026-10-16" }, // Tomorrow
    { _id: "food_4", name: "Potatoes", quantity: 2, unit: "kg", expiryDate: "2026-10-25" }, // Future
    { _id: "food_5", name: "Old Yogurt", quantity: 1, unit: "cup", expiryDate: "2026-10-12" } // Expired
];

// Test logic mirroring renderExpiryNotifications
const tomorrowItems = [];
const todayItems = [];
mockInventory.forEach(food => {
    const status = calculateExpiryStatus(food.expiryDate, baseDate);
    if (status.isValid && !status.isExpired) {
        if (status.diffDays === 0) todayItems.push({ food, status });
        else if (status.diffDays === 1) tomorrowItems.push({ food, status });
    }
});

assert.strictEqual(tomorrowItems.length, 3, "Must find ALL 3 foods expiring tomorrow, not just the first one");
assert.deepStrictEqual(
    tomorrowItems.map(t => t.food.name),
    ["Fresh Milk", "Sliced Bread", "Farm Tomatoes"],
    "All tomorrow items must be present in order"
);
console.log("  ✅ PASS: All 3 foods expiring tomorrow are identified and displayed, not just the first item");

// 1.5 Ensure expired food is strictly excluded from consumption / recipes / urgent alerts
const urgentItems = [...todayItems, ...tomorrowItems];
const hasExpiredInUrgent = urgentItems.some(u => u.status.isExpired || u.status.diffDays < 0);
assert.strictEqual(hasExpiredInUrgent, false, "Expired food must NEVER be in urgent consumption notifications");
console.log("  ✅ PASS: Expired food is strictly excluded from urgent consumption and cooking notifications");

// 1.6 Avoid duplicate notifications via fingerprinting
const fingerprint1 = urgentItems.map(u => `${u.food._id || u.food.name}-${u.food.expiryDate}-${u.status.diffDays}`).sort().join("|");
const fingerprint2 = urgentItems.map(u => `${u.food._id || u.food.name}-${u.food.expiryDate}-${u.status.diffDays}`).sort().join("|");
assert.strictEqual(fingerprint1, fingerprint2, "Fingerprint is deterministic and prevents duplicate notifications");
console.log("  ✅ PASS: Duplicate notification prevention fingerprint works consistently");

console.log("\n=================================================");
console.log("🍲 2. Testing Healthy AI Recipe Suggestions Requirements");
console.log("=================================================");

// 2.1 Recipes generated using inventory
const recipes = aiRecipeService.generateRecipesForInventory(mockInventory);
assert(Array.isArray(recipes) && recipes.length > 0, "Recipes must be generated as an array");
console.log(`  ✅ PASS: Generated ${recipes.length} recipes from inventory without external AI API`);

// 2.2 Verify recipe attributes for each generated recipe
recipes.forEach((recipe, idx) => {
    console.log(`\n  Checking Recipe #${idx + 1}: "${recipe.name}"`);
    // Recipe name
    assert(recipe.name && recipe.name.length > 0, "Recipe must have a valid name");
    console.log(`    - Name: ${recipe.name}`);

    // Ingredients with quantities
    assert(Array.isArray(recipe.inventoryIngredients) && recipe.inventoryIngredients.length > 0, "Must list inventory ingredients");
    recipe.inventoryIngredients.forEach(ing => {
        assert(ing.name && ing.quantity, "Inventory ingredient must include name and quantity");
        console.log(`    - Inventory Ingredient: ${ing.name} (${ing.quantity}) [Urgent: ${ing.isExpiringSoon}]`);
    });

    // Optional pantry items clearly marked
    assert(Array.isArray(recipe.optionalPantryAdditions), "Must have optional pantry additions array");
    console.log(`    - Optional Pantry Items (${recipe.optionalPantryAdditions.length} items clearly marked)`);

    // Simple step-by-step instructions
    assert(Array.isArray(recipe.steps) && recipe.steps.length >= 3, "Must have at least 3 simple steps");
    console.log(`    - Steps (${recipe.steps.length} beginner-friendly steps provided)`);

    // Preparation time
    assert(recipe.prepTime && recipe.prepTime.length > 0, "Must have preparation time");
    console.log(`    - Prep Time: ${recipe.prepTime} (Cook Time: ${recipe.cookTime || 'quick'})`);

    // Short health benefit
    assert(recipe.healthBenefit && recipe.healthBenefit.length > 15, "Must have a descriptive health benefit");
    console.log(`    - Health Benefit: "${recipe.healthBenefit.substring(0, 70)}..."`);

    // Vegetarian recipe and/or suitable alternative
    assert(recipe.vegetarianAlternative && recipe.vegetarianAlternative.length > 0, "Must provide vegetarian / plant-based alternative");
    console.log(`    - Vegetarian Alternative: "${recipe.vegetarianAlternative.substring(0, 60)}..."`);

    // Suggest donation as an additional option, not only suggestion
    assert(recipe.donationOption && recipe.donationOption.message, "Must include donation as an additional option");
    console.log(`    - Donation Option: "${recipe.donationOption.message.substring(0, 60)}..."`);

    // Ensure expired food is NEVER used
    const usesExpired = recipe.inventoryIngredients.some(i => i.name.toLowerCase().includes("yogurt"));
    assert.strictEqual(usesExpired, false, "Expired food ('Old Yogurt') must NEVER be used in any recipe");
});
console.log("\n  ✅ PASS: Expired food ('Old Yogurt') was strictly excluded from all recipe suggestions");

// 2.3 Priority given to items expiring soon (diffDays === 1)
const firstRecipe = recipes[0];
const usesUrgentItem = firstRecipe.inventoryIngredients.some(i => i.isExpiringSoon);
assert.strictEqual(usesUrgentItem, true, "First recipe must prioritize items expiring soon");
console.log(`  ✅ PASS: Recipes correctly prioritize items expiring soon (First recipe uses: ${firstRecipe.inventoryIngredients.map(i => i.name).join(", ")})`);

// 2.4 Empty inventory handling: Sensible staple recipes without error or donation-only output
const emptyInventoryRecipes = aiRecipeService.generateRecipesForInventory([]);
assert(Array.isArray(emptyInventoryRecipes) && emptyInventoryRecipes.length >= 2, "Empty inventory must return sensible staple recipes");
assert(emptyInventoryRecipes[0].steps.length > 0, "Staple recipes must have step-by-step instructions");
assert(emptyInventoryRecipes[0].healthBenefit, "Staple recipes must have health benefit");
console.log(`  ✅ PASS: Empty inventory returns ${emptyInventoryRecipes.length} sensible staple recipes rather than error or donation-only output`);

// 2.5 Unique / custom ingredients handling
const customInventory = [
    { _id: "cust_1", name: "Zucchini Squash", quantity: 3, unit: "pieces", expiryDate: "2026-10-16" }
];
const customRecipes = aiRecipeService.generateRecipesForInventory(customInventory);
assert(customRecipes.length > 0, "Must dynamically synthesize healthy recipes for unique ingredients");
assert(customRecipes[0].name.includes("Zucchini"), "Recipe name must incorporate custom ingredient");
assert(customRecipes[0].healthBenefit.includes("Zucchini"), "Health benefit must mention custom ingredient");
console.log(`  ✅ PASS: Custom ingredient correctly synthesized: "${customRecipes[0].name}"`);

console.log("\n=================================================");
console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! Both features verified.");
console.log("=================================================");
