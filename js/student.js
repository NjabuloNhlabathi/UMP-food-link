// Student Page Logic
function renderStudentFoods() {
    const container = document.getElementById('studentFoodList');
    const data = getData();
    const available = data.foods.filter(f => f.status === 'available');

    if (available.length === 0) {
        container.innerHTML = `
            <div class="empty-state-neumorphic">
                <span class="empty-icon">🥗</span>
                <h3 class="headline-md">No Surplus Available</h3>
                <p class="body-md">Check back later for available meals!</p>
            </div>
        `;
        updateBadge();
        return;
    }

    // Update mini stats
    document.getElementById('availCount').innerText = available.length;
    document.getElementById('reservedCount').innerText = data.reservations.length;

    container.innerHTML = available.map(food => {
        const insight = getWasteInsight(food.name, food.category);
        const insightText = insight.percentage > 30 
            ? '⚠️ High historical waste. Take only what you need!' 
            : '✅ Low waste footprint. Good choice!';
        
        // Determine card accent color based on waste percentage
        let accentColor = 'var(--tertiary-container)';
        if (insight.percentage > 30) accentColor = 'var(--secondary-container)';
        else if (insight.percentage < 15) accentColor = 'var(--primary-container)';
        
        return `
            <div class="food-card-neumorphic" style="border-top-color: ${accentColor};">
                <h4>${food.name}</h4>
                <div class="meta">📂 ${food.category.replace('_', ' ')}</div>
                <div class="meta">⚖️ ${food.qty} kg available</div>
                <div class="meta">⏳ Expires: ${new Date(food.expiry).toLocaleString()}</div>
                <div class="ai-insight">🧠 AI Insight: ~${insight.percentage}% avg waste ${insight.source}</div>
                <div class="food-card-actions">
                    <button class="btn-primary-neumorphic btn-sm-neumorphic" onclick="reserveFood('${food.id}')">📲 Reserve</button>
                    <button class="btn-warning-neumorphic btn-sm-neumorphic" onclick="logWaste('${food.id}')">🗑️ Log Waste</button>
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