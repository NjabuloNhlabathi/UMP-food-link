// Staff Page Logic
function renderStaffInventory() {
    const container = document.getElementById('staffInventoryList');
    const data = getData();
    if (data.foods.length === 0) {
        container.innerHTML = '<div class="empty-state-neumorphic"><span class="empty-icon">📦</span><p class="body-md">No items in inventory yet.</p></div>';
        updateBadge();
        return;
    }
    container.innerHTML = data.foods.map(food => `
        <div class="inventory-item-neumorphic">
            <div class="item-info">
                <div class="item-name">${food.name}</div>
                <div class="item-details">
                    ${food.category.replace('_',' ')} • ${food.qty} kg 
                    • Status: ${food.status} 
                    • Exp: ${new Date(food.expiry).toLocaleDateString()}
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-sm-neumorphic" onclick="markResolved('${food.id}')">✅ Resolve</button>
                <button class="btn-danger-neumorphic" onclick="deleteFood('${food.id}')">🗑️ Remove</button>
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

function runStaffAI() {
    const data = getData();
    const available = data.foods.filter(f => f.status === 'available');
    const resultDiv = document.getElementById('staffAIResult');
    
    if (available.length === 0) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <div class="result-header">
                <span class="result-icon">🧐</span>
                <strong>No surplus items to analyze</strong>
            </div>
            <p class="result-reason">Add some food first, then try again!</p>
        `;
        return;
    }

    const now = new Date();
    let summary = `
        <div class="result-header">
            <span class="result-icon">🧠</span>
            <strong>AI Surplus Analysis (EPA Hierarchy)</strong>
        </div>
        <ul style="list-style:none; padding:0; margin:12px 0 0 0;">
    `;
    
    available.forEach(food => {
        const expiryDate = new Date(food.expiry);
        const hoursUntilExpiry = (expiryDate - now) / (1000 * 60 * 60);
        
        let condition;
        let emoji = '🟢';
        let expiryStatus = '';
        
        if (food.category === 'liquid_oil') {
            condition = 'liquid_oil';
            emoji = '🟡';
            expiryStatus = 'Oil - Biofuel';
        } else if (hoursUntilExpiry < 0) {
            condition = 'spoiled_rotten';
            emoji = '🔴';
            expiryStatus = `Expired ${Math.abs(Math.round(hoursUntilExpiry))}h ago`;
        } else if (hoursUntilExpiry < 24) {
            condition = 'slightly_off';
            emoji = '🟠';
            expiryStatus = `Expires in ${Math.round(hoursUntilExpiry)}h`;
        } else {
            condition = 'fresh_edible';
            emoji = '🟢';
            expiryStatus = `Expires in ${Math.round(hoursUntilExpiry / 24)}d`;
        }

        const rec = getAIRecommendation(food.category, condition);
        
        summary += `
            <li style="padding:8px 0; border-bottom:1px solid var(--surface-container-high); display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                ${emoji} <strong>${food.name}</strong> (${food.qty}kg)
                <span style="font-size:12px; color:var(--on-surface-variant);">${expiryStatus}</span>
                → <span style="font-weight:600; color:var(--primary-container);">${rec.action}</span>
                <span style="font-size:11px; color:var(--on-surface-variant);">(${rec.level})</span>
            </li>
        `;
    });
    
    summary += `
        </ul>
        <div style="margin-top:12px; padding:12px; background:var(--surface); border-radius:var(--radius-default); box-shadow:var(--shadow-concave); font-size:13px; color:var(--on-surface-variant);">
            💡 <strong>Legend:</strong> 
            🟢 Fresh → Donate | 🟠 Near expiry → Animal Feed | 
            🔴 Expired → Compost | 🟡 Oil → Biofuel
        </div>
    `;
    
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = summary;
}

window.onload = function() {
    setDefaultExpiry();
    renderStaffInventory();
};