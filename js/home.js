// Home Page Logic
function runHomeAI() {
    const type = document.getElementById('aiFoodType').value;
    const condition = document.getElementById('aiCondition').value;
    const result = getAIRecommendation(type, condition);

    const box = document.getElementById('homeAIResult');
    box.style.display = 'block';
    document.getElementById('homeAction').innerText = result.action;
    document.getElementById('homeReason').innerText = result.reason;
    document.getElementById('homeLevel').innerText = result.level;
}

function renderStats() {
    const data = getData();
    const available = data.foods.filter(f => f.status === 'available');
    document.getElementById('totalItems').innerText = available.length;
    document.getElementById('totalReserved').innerText = data.reservations.length;
    const totalWasteKg = data.wasteLogs.reduce((sum, w) => sum + w.wastedQty, 0);
    document.getElementById('totalWaste').innerText = totalWasteKg.toFixed(1);
    updateBadge();
}

// Run on load
window.onload = function() {
    renderStats();
    runHomeAI();
};