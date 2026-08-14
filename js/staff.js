// Staff Page Logic
function renderStaffInventory() {
    const container = document.getElementById('staffInventoryList');
    const data = getData();
    if (data.foods.length === 0) {
        container.innerHTML = '<div class="empty-state">No items added yet.</div>';
        updateBadge();
        return;
    }
    container.innerHTML = data.foods.map(food => `
        <div style="background:white; border:1px solid #dde8dd; border-radius:12px; padding:14px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
            <div>
                <strong>${food.name}</strong> (${food.category.replace('_',' ')}) <br>
                <span style="font-size:13px; color:#3a5a3a;">${food.qty} kg | Status: ${food.status} | Exp: ${new Date(food.expiry).toLocaleString()}</span>
            </div>
            <div style="display:flex; gap:6px; margin-top:6px;">
                <button class="btn btn-sm btn-outline" onclick="markResolved('${food.id}')">✅ Resolve</button>
                <button class="btn btn-sm btn-danger" onclick="deleteFood('${food.id}')">🗑️ Remove</button>
            </div>
        </div>
    `).join('');

    updateBadge();
}

function addFoodItem() {
    const name = document.getElementById('foodName').value.trim();
    const category = document.getElementById('foodCategory').value;
    const qty = parseFloat(document.getElementById('foodQty').value);
    const expiry = document.getElementById('foodExpiry').value;

    if (!name) return alert('Please enter a food name.');
    if (!expiry) return alert('Please set an expiry/availability time.');

    const data = getData();
    data.foods.push({
        id: generateId(),
        name: name,
        category: category,
        qty: qty,
        expiry: expiry,
        status: 'available',
        addedBy: 'Kitchen Staff'
    });
    saveData(data);
    document.getElementById('foodName').value = '';
    document.getElementById('foodQty').value = '2.5';
    renderStaffInventory();
    alert(`✅ "${name}" added to surplus!`);
}

function markResolved(foodId) {
    const data = getData();
    const food = data.foods.find(f => f.id === foodId);
    if (food) { food.status = 'resolved'; saveData(data); renderStaffInventory(); }
}

function deleteFood(foodId) {
    if (!confirm('Remove this item permanently?')) return;
    let data = getData();
    data.foods = data.foods.filter(f => f.id !== foodId);
    saveData(data);
    renderStaffInventory();
}

// ============================================================
//  GUARANTEED WORKING AI SURPLUS ANALYZER
// ============================================================
function runStaffAI() {
    const data = getData();
    const available = data.foods.filter(f => f.status === 'available');
    const resultDiv = document.getElementById('staffAIResult');
    
    if (available.length === 0) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '🧐 No surplus items to analyze. Add some food first!';
        return;
    }

    // Get the current time
    const now = new Date();
    console.log("🕐 Current time:", now.toLocaleString());
    
    let summary = '<strong>🧠 AI Surplus Analysis (EPA Hierarchy):</strong><ul style="margin-top:8px; list-style:none; padding-left:0;">';
    
    available.forEach(food => {
        // Parse the expiry date
        const expiryDate = new Date(food.expiry);
        console.log(`📅 ${food.name} expiry:`, expiryDate.toLocaleString());
        
        // Calculate hours until expiry (in hours)
        const hoursUntilExpiry = (expiryDate - now) / (1000 * 60 * 60);
        console.log(`⏰ ${food.name} hours until expiry:`, hoursUntilExpiry);
        
        let condition;
        let statusEmoji = '🟢';
        let expiryStatus = '';
        
        // --- CHECK 1: Is it LIQUID OIL? (Always Biofuel) ---
        if (food.category === 'liquid_oil') {
            condition = 'liquid_oil';
            statusEmoji = '🟡';
            expiryStatus = '🛢️ Oil - Biofuel';
        } 
        // --- CHECK 2: Is it EXPIRED? (hoursUntilExpiry < 0) ---
        else if (hoursUntilExpiry < 0) {
            condition = 'spoiled_rotten';
            statusEmoji = '🔴';
            expiryStatus = `⚠️ Expired ${Math.abs(Math.round(hoursUntilExpiry))} hours ago`;
        } 
        // --- CHECK 3: Is it NEAR EXPIRY? (0 to 24 hours) ---
        else if (hoursUntilExpiry >= 0 && hoursUntilExpiry < 24) {
            condition = 'slightly_off';
            statusEmoji = '🟠';
            expiryStatus = `⏳ Expires in ${Math.round(hoursUntilExpiry)} hours`;
        } 
        // --- CHECK 4: FRESH (more than 24 hours left) ---
        else {
            condition = 'fresh_edible';
            statusEmoji = '🟢';
            expiryStatus = `✅ Expires in ${Math.round(hoursUntilExpiry / 24)} days`;
        }

        // Get the recommendation based on the determined condition
        const rec = getAIRecommendation(food.category, condition);
        
        // Build the summary line
        summary += `
            <li style="padding:8px 0; border-bottom:1px solid #eee; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                ${statusEmoji} <strong>${food.name}</strong> (${food.qty}kg) 
                <span style="font-size:12px; color:#5a7a5a;">${expiryStatus}</span>
                → <strong style="color:#1e4a1e;">${rec.action}</strong>
                <span style="font-size:11px; color:#7a8a7a;">(${rec.level})</span>
            </li>
        `;
    });
    
    summary += '</ul><p style="margin-top:10px; font-size:13px; color:#3a5a3a; background:#f0f7f0; padding:12px; border-radius:10px;">';
    summary += '💡 <strong>Legend:</strong> ';
    summary += '🟢 Fresh (>24h left) → Donate | ';
    summary += '🟠 Near expiry (0-24h) → Animal Feed | ';
    summary += '🔴 Expired → Compost | ';
    summary += '🟡 Oil → Biofuel';
    summary += '</p>';
    
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = summary;
    
    // Also log to console for debugging
    console.log("✅ AI Analysis complete! Check the results above.");
}

window.onload = function() {
    setDefaultExpiry();
    renderStaffInventory();
};