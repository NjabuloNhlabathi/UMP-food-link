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
                <span style="font-size:13px; color:#3a5a3a;">${food.qty} kg | Status: ${food.status} | Exp: ${new Date(food.expiry).toLocaleDateString()}</span>
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

function runStaffAI() {
    const data = getData();
    const available = data.foods.filter(f => f.status === 'available');
    const resultDiv = document.getElementById('staffAIResult');
    
    if (available.length === 0) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '🧐 No surplus items to analyze. Add some food first!';
        return;
    }

    let summary = '<strong>🧠 AI Surplus Analysis (EPA Hierarchy):</strong><ul style="margin-top:8px; list-style:none; padding-left:0;">';
    available.forEach(food => {
        const rec = getAIRecommendation(food.category, 'fresh_edible');
        summary += `<li style="padding:4px 0; border-bottom:1px solid #eee;">✅ <strong>${food.name}</strong> (${food.qty}kg) → ${rec.action}</li>`;
    });
    summary += '</ul><p style="margin-top:10px; font-size:13px; color:#3a5a3a;">💡 Based on EPA Food Recovery Hierarchy. Donate fresh items first!</p>';
    
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = summary;
}

window.onload = function() {
    setDefaultExpiry();
    renderStaffInventory();
};