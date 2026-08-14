// ============================================================
// 1. PASTE YOUR CSV DATA BELOW (Between the backticks)
// ============================================================
// IMPORTANT: The AI will look up the EXACT food name first!
// Make sure your CSV has a column for food name (e.g., Food_Name, Item, Dish)
// ============================================================

const RAW_CSV_DATA = `
Category,Waste_Kg,Food_Name,Date,Reason
cooked_meal,2.3,Nasi Lemak,2025-01-10,Overproduction
raw_veg,1.2,Salad Mix,2025-01-11,Spoilage
meat_seafood,0.5,Fried Chicken,2025-01-12,Plate Waste
dairy_bread,1.8,Bread Rolls,2025-01-13,Expired
cooked_meal,3.1,Curry Laksa,2025-01-14,Overproduction
raw_veg,2.5,Tomatoes,2025-01-15,Spoilage
cooked_meal,1.2,Nasi Lemak,2025-01-16,Plate Waste
`;

// ============================================================
// 2. AI UTILITIES ENGINE (Do NOT change below this line)
// ============================================================

function getData() {
    return JSON.parse(localStorage.getItem('umpFoodlinkData')) || {
        foods: [],
        reservations: [],
        wasteLogs: []
    };
}

function saveData(data) {
    localStorage.setItem('umpFoodlinkData', JSON.stringify(data));
}

function generateId() { return Date.now() + '_' + Math.random().toString(36).substr(2, 4); }

// --- EPA AI Core Logic ---
function getAIRecommendation(foodType, condition) {
    if (condition === 'fresh_edible' || condition === 'cooked_leftover') {
        return { action: '🍽️ DONATE to Food Bank', reason: 'Safe for human consumption. Connect with local shelters.', level: 'Level 2: Feed People' };
    } else if (condition === 'slightly_off' && foodType !== 'liquid_oil') {
        return { action: '🐖 SEND to Animal Farms', reason: 'Slightly wilted/stale food is excellent for livestock feed.', level: 'Level 3: Feed Animals' };
    } else if (foodType === 'liquid_oil') {
        return { action: '⚙️ RECYCLE to Biofuel', reason: 'Used oils/grease can be converted into renewable biodiesel.', level: 'Level 4: Industrial Use' };
    } else if (condition === 'spoiled_rotten' || foodType === 'raw_veg') {
        return { action: '🌿 COMPOST / Anaerobic Digestion', reason: 'Rotten or raw organic matter creates nutrient-rich soil or biogas.', level: 'Level 5: Composting' };
    } else {
        return { action: '🗑️ MINIMIZE & Landfill', reason: 'Mixed/contaminated waste. Try portion control to prevent this.', level: 'Level 7: Landfill (Avoid)' };
    }
}

// --- NEW: AI that looks up EXACT food name first, then falls back to Category ---
function getWasteInsight(foodName, category) {
    const data = getData();
    
    // 1. Try to find waste logs for this EXACT food name
    let logs = data.wasteLogs.filter(log => 
        log.foodName && log.foodName.toLowerCase() === foodName.toLowerCase()
    );
    
    let source = '';
    let percentage = 0;
    
    if (logs.length > 0) {
        // We found records for this specific dish!
        const total = logs.reduce((sum, log) => sum + log.wastedQty, 0);
        const avg = total / logs.length;
        percentage = Math.min(80, Math.max(5, Math.round(avg * 10)));
        source = `based on ${logs.length} historical record(s) for "${foodName}"`;
    } else {
        // 2. Fallback: Look up by Category
        logs = data.wasteLogs.filter(log => log.category === category);
        if (logs.length > 0) {
            const total = logs.reduce((sum, log) => sum + log.wastedQty, 0);
            const avg = total / logs.length;
            percentage = Math.min(80, Math.max(5, Math.round(avg * 10)));
            source = `based on ${logs.length} record(s) for similar "${category.replace('_', ' ')}" items`;
        } else {
            // 3. Final Fallback: Smart defaults
            const defaults = { 'cooked_meal': 15, 'raw_veg': 20, 'meat_seafood': 10, 'dairy_bread': 12 };
            percentage = defaults[category] || 15;
            source = 'based on industry average estimates';
        }
    }
    
    return { percentage, source };
}

// --- Load Your CSV Data into the System (Now stores Food Name!) ---
function loadHardcodedCSV() {
    if (!RAW_CSV_DATA || RAW_CSV_DATA.trim().split('\n').length < 2) {
        console.log("No custom CSV data found. Using seeded demo data.");
        return;
    }

    if (localStorage.getItem('umpCSVLoaded') === 'true') {
        console.log("CSV data already loaded.");
        return;
    }

    console.log("Parsing your hardcoded CSV data...");
    Papa.parse(RAW_CSV_DATA.trim(), {
        header: true,
        skipEmptyLines: true,
        trimHeaders: true,
        complete: function(results) {
            if (results.errors.length > 0) {
                console.error("Error parsing CSV:", results.errors[0].message);
                return;
            }

            const rows = results.data;
            if (rows.length === 0) return;

            const data = getData();
            
            // Clear existing waste logs and replace with CSV data
            data.wasteLogs = [];
            let importedCount = 0;

            rows.forEach(row => {
                const headers = Object.keys(row);
                const categoryKey = headers.find(h => /category|type|food_type/i.test(h));
                const wasteKey = headers.find(h => /waste|wasted|waste_kg|weight|kg/i.test(h));
                const nameKey = headers.find(h => /name|item|food|dish/i.test(h) && !/category/i.test(h));
                const reasonKey = headers.find(h => /reason|cause|note/i.test(h));
                const dateKey = headers.find(h => /date|time|day/i.test(h));

                if (!categoryKey || !wasteKey) {
                    console.warn("Skipping row - missing Category or Waste column:", row);
                    return;
                }

                const category = String(row[categoryKey]).trim().toLowerCase().replace(/\s/g, '_');
                const wasteKg = parseFloat(String(row[wasteKey]).replace(',', '.').trim());
                const foodName = nameKey ? String(row[nameKey]).trim() || 'Unknown' : 'Unknown';
                const reason = reasonKey ? String(row[reasonKey]).trim() || 'Imported' : 'Imported';
                const date = dateKey ? String(row[dateKey]).trim() : new Date().toISOString().split('T')[0];

                if (isNaN(wasteKg) || wasteKg <= 0) return;

                // --- THIS IS THE IMPORTANT UPGRADE: We now store foodName in wasteLogs ---
                data.wasteLogs.push({
                    foodId: 'csv_' + Date.now() + '_' + importedCount,
                    foodName: foodName, // <-- STORED FOR EXACT LOOKUP
                    category: category,
                    wastedQty: wasteKg,
                    reason: reason,
                    date: new Date(date).toISOString() || new Date().toISOString()
                });
                importedCount++;
            });

            // Also add unique food names to the inventory if they don't exist
            rows.forEach(row => {
                const headers = Object.keys(row);
                const nameKey = headers.find(h => /name|item|food|dish/i.test(h) && !/category/i.test(h));
                const catKey = headers.find(h => /category|type|food_type/i.test(h));
                if (nameKey && catKey) {
                    const name = String(row[nameKey]).trim();
                    const category = String(row[catKey]).trim().toLowerCase().replace(/\s/g, '_');
                    if (name && !data.foods.some(f => f.name === name)) {
                        data.foods.push({
                            id: 'csv_food_' + Date.now() + '_' + Math.random().toString(36).substr(2,4),
                            name: name,
                            category: category || 'cooked_meal',
                            qty: 2.0,
                            expiry: new Date(Date.now() + 86400000).toISOString(),
                            status: 'available',
                            addedBy: 'CSV Import'
                        });
                    }
                }
            });

            saveData(data);
            localStorage.setItem('umpCSVLoaded', 'true');
            console.log(`✅ Successfully imported ${importedCount} waste records from your CSV!`);
            
            if (typeof renderStats === 'function') renderStats();
            if (typeof renderStudentFoods === 'function') renderStudentFoods();
            if (typeof renderStaffInventory === 'function') renderStaffInventory();
            if (typeof updateBadge === 'function') updateBadge();
        },
        error: function(error) {
            console.error('Failed to parse CSV:', error);
        }
    });
}

// --- Seed Default Demo Data (Fallback) ---
function seedInitialData() {
    const data = getData();
    if (data.foods.length === 0 && data.wasteLogs.length === 0) {
        const now = new Date();
        const expiry1 = new Date(now.getTime() + 24*60*60*1000).toISOString();
        const expiry2 = new Date(now.getTime() + 6*60*60*1000).toISOString();
        data.foods = [
            { id: 'seed1', name: 'Vegetable Curry', category: 'cooked_meal', qty: 3.2, expiry: expiry1, status: 'available', addedBy: 'Kitchen' },
            { id: 'seed2', name: 'Fresh Salad Greens', category: 'raw_veg', qty: 1.5, expiry: expiry2, status: 'available', addedBy: 'Kitchen' },
            { id: 'seed3', name: 'Butter Croissants', category: 'dairy_bread', qty: 2.0, expiry: expiry1, status: 'available', addedBy: 'Kitchen' }
        ];
        data.wasteLogs = [
            { foodId: 'seed1', foodName: 'Vegetable Curry', category: 'cooked_meal', wastedQty: 0.5, reason: 'Overproduction', date: new Date().toISOString() },
            { foodId: 'seed1', foodName: 'Vegetable Curry', category: 'cooked_meal', wastedQty: 0.8, reason: 'Plate waste', date: new Date().toISOString() },
            { foodId: 'seed2', foodName: 'Fresh Salad Greens', category: 'raw_veg', wastedQty: 0.9, reason: 'Spoilage', date: new Date().toISOString() }
        ];
        saveData(data);
    }
}

function setDefaultExpiry() {
    const el = document.getElementById('foodExpiry');
    if (el) {
        const now = new Date();
        now.setHours(now.getHours() + 8);
        el.value = now.toISOString().slice(0, 16);
    }
}

function updateBadge() {
    const data = getData();
    const count = data.foods.filter(f => f.status === 'available').length;
    const badges = document.querySelectorAll('#availBadge');
    badges.forEach(b => b.innerText = count);
}

// --- Initialize ---
seedInitialData();

setTimeout(() => {
    loadHardcodedCSV();
}, 100);

setTimeout(() => { updateBadge(); }, 200);