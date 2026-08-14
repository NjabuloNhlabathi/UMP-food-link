// Student Page Logic
function renderStudentFoods() {
    const container = document.getElementById('studentFoodList');
    const data = getData();
    const available = data.foods.filter(f => f.status === 'available');

    if (available.length === 0) {
        container.innerHTML = '<div class="empty-state">🥗 No surplus food available right now. Check back later!</div>';
        updateBadge();
        return;
    }

    container.innerHTML = available.map(food => {
        const insight = getWasteInsight(food.name, food.category);
        const insightText = insight.percentage > 30 
            ? '⚠️ High historical waste. Take only what you need!' 
            : '✅ Low waste footprint. Good choice!';
        
        return `
            <div class="food-card">
                <h4>${food.name}</h4>
                <div class="meta">📂 ${food.category.replace('_', ' ')}</div>
                <div class="meta">⚖️ ${food.qty} kg available</div>
                <div class="meta">⏳ Expires: ${new Date(food.expiry).toLocaleString()}</div>
                <div class="ai-insight">🧠 AI Insight: ~${insight.percentage}% avg waste ${insight.source}</div>
                <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">
                    <button class="btn btn-primary btn-sm" onclick="reserveFood('${food.id}')">📲 Reserve</button>
                    <button class="btn btn-warning btn-sm" onclick="logWaste('${food.id}')">🗑️ Log Waste</button>
                </div>
            </div>
        `;
    }).join('');

    updateBadge();
}

function reserveFood(foodId) {
    const data = getData();
    const food = data.foods.find(f => f.id === foodId);
    if (!food || food.status !== 'available') return alert('Sorry, this item is no longer available.');
    
    const studentName = prompt('Enter your name to reserve:');
    if (!studentName) return;

    food.status = 'reserved';
    data.reservations.push({ foodId, studentName, reservedAt: new Date().toISOString() });
    saveData(data);
    renderStudentFoods();
    alert(`✅ ${food.name} reserved for ${studentName}!`);
}

function logWaste(foodId) {
    const data = getData();
    const food = data.foods.find(f => f.id === foodId);
    if (!food) return alert('Item not found.');
    
    const qty = parseFloat(prompt(`How many kg of "${food.name}" were wasted?`, '0.5'));
    if (isNaN(qty) || qty <= 0) return alert('Invalid quantity.');
    
    const reason = prompt('Reason for waste? (e.g. Overproduction, Spoilage)', 'Overproduction') || 'Unknown';
    
    data.wasteLogs.push({
        foodId: food.id,
        foodName: food.name,
        category: food.category,
        wastedQty: qty,
        reason: reason,
        date: new Date().toISOString()
    });
    
    if (qty >= food.qty) {
        food.status = 'resolved';
    } else {
        food.qty = Math.max(0, food.qty - qty);
        if (food.qty === 0) food.status = 'resolved';
    }
    
    saveData(data);
    renderStudentFoods();
    alert(`📊 Logged ${qty}kg waste for "${food.name}". AI model updated!`);
}

window.onload = function() {
    renderStudentFoods();
};