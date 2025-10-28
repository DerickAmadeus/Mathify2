// ===================================
// GRAPH HISTORY FUNCTIONS
// ===================================

/**
 * Get current logged-in user from auth.js
 * (auth.js harus sudah di-load)
 * @returns {object|null} User object or null
 */
function getGraphCurrentUser() {
    // Fungsi ini didefinisikan di auth.js
    if (typeof getCurrentUser === 'function') {
        return getCurrentUser();
    }
    // Fallback jika auth.js berubah
    const user = localStorage.getItem('user');
    if (!user) return null;
    try {
        return JSON.parse(user);
    } catch (err) {
        return null;
    }
}

/**
 * Save function expression to history
 */
async function saveToGraphHistory(functionExpression) {
    const user = getGraphCurrentUser();
    if (!user || !user.id) {
        console.warn('User not logged in, graph history not saved.');
        return;
    }

    try {
        // Hanya simpan jika functionExpression tidak kosong
        if (functionExpression && functionExpression.trim() !== '') {
            await fetch('/api/graph/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    function_expression: functionExpression
                })
            });
        }
    } catch (err) {
        console.error('Failed to save graph history:', err);
    }
}

/**
 * Fetch graph history from API
 */
async function fetchGraphHistory() {
    const user = getGraphCurrentUser();
    if (!user || !user.id) return;

    try {
        const response = await fetch(`/api/graph/history?user_id=${user.id}`);
        if (!response.ok) throw new Error('Failed to fetch history');
        
        const data = await response.json();
        displayGraphHistory(data);
    } catch (err) {
        console.error(err.message);
        const list = document.getElementById('graph-history-list');
        if(list) list.innerHTML = '<p style="color: #ef4444;">Gagal memuat history.</p>';
    }
}

/**
 * Display history items in the modal
 */
function displayGraphHistory(historyItems) {
    const list = document.getElementById('graph-history-list');
    if (!list) return;

    list.innerHTML = ''; // Clear list

    if (!historyItems || historyItems.length === 0) {
        list.innerHTML = '<p style="color: rgba(255,255,255,0.6); text-align: center;">History kosong.</p>';
        return;
    }

    // Ambil 10 item terbaru saja
    const recentItems = historyItems.slice(0, 10);

    recentItems.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item'; // Pakai style dari calculator.css
        historyItem.innerHTML = `<div class="history-expression">y = ${item.function_expression}</div>`;
        
        // Add click handler to reuse the function
        historyItem.addEventListener('click', () => {
            setFunction(item.function_expression); // Gunakan fungsi setFunction yang sudah ada
            const modal = document.getElementById('graph-history-modal');
            if (modal) modal.classList.remove('show');
        });

        list.appendChild(historyItem);
    });
}

/**
 * Setup event listeners for the history modal
 */
function setupGraphHistoryModal() {
    const historyToggle = document.getElementById('graph-history-toggle');
    const historyModal = document.getElementById('graph-history-modal');
    const closeHistory = document.getElementById('close-graph-history');
    const clearHistory = document.getElementById('clear-graph-history');

    if (!historyToggle || !historyModal || !closeHistory || !clearHistory) {
        console.warn('History modal elements not found.');
        return;
    }

    historyToggle.addEventListener('click', () => {
        historyModal.classList.add('show');
        fetchGraphHistory(); // Refresh history when opened
    });

    closeHistory.addEventListener('click', () => {
        historyModal.classList.remove('show');
    });

    // Close modal when clicking outside
    historyModal.addEventListener('click', (e) => {
        if (e.target === historyModal) {
            historyModal.classList.remove('show');
        }
    });

    // Clear history button
    clearHistory.addEventListener('click', async () => {
        if (!confirm('Anda yakin ingin menghapus semua riwayat grafik?')) return;
        
        const user = getGraphCurrentUser();
        if (!user || !user.id) return;

        try {
            const response = await fetch(`/api/graph/history?user_id=${user.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                displayGraphHistory([]); // Tampilkan list kosong
            } else {
                alert('Gagal menghapus history.');
            }
        } catch (err) {
            console.error('Failed to clear graph history:', err);
        }
    });
}

// ===================================
// END OF GRAPH HISTORY FUNCTIONS
// ===================================

let myChart = null;

// Update range display
function updateRangeDisplay() {
    const xMin = parseFloat(document.getElementById('xMin').value);
    const xMax = parseFloat(document.getElementById('xMax').value);
    const yMin = parseFloat(document.getElementById('yMin').value);
    const yMax = parseFloat(document.getElementById('yMax').value);
    
    // PERHATIKAN: ID elemen ini harus ada di HTML kamu
    const xDisplay = document.getElementById('xRangeDisplay');
    const yDisplay = document.getElementById('yRangeDisplay');
    
    if (xDisplay) {
        xDisplay.textContent = `${xMin.toFixed(1)} to ${xMax.toFixed(1)}`;
    }
    if (yDisplay) {
        yDisplay.textContent = `${yMin.toFixed(1)} to ${yMax.toFixed(1)}`;
    }
}

// Zoom In function
function zoomIn() {
    const xMinInput = document.getElementById('xMin');
    const xMaxInput = document.getElementById('xMax');
    const yMinInput = document.getElementById('yMin');
    const yMaxInput = document.getElementById('yMax');
    
    let xMin = parseFloat(xMinInput.value);
    let xMax = parseFloat(xMaxInput.value);
    let yMin = parseFloat(yMinInput.value);
    let yMax = parseFloat(yMaxInput.value);
    
    // Zoom in by 1 unit on each side (total 2 units decrease in range)
    xMinInput.value = (xMin + 1).toString();
    xMaxInput.value = (xMax - 1).toString();
    yMinInput.value = (yMin + 1).toString();
    yMaxInput.value = (yMax - 1).toString();
    
    updateRangeDisplay();
    plotFunction(false); // false = no animation
}

// Zoom Out function
function zoomOut() {
    const xMinInput = document.getElementById('xMin');
    const xMaxInput = document.getElementById('xMax');
    const yMinInput = document.getElementById('yMin');
    const yMaxInput = document.getElementById('yMax');
    
    let xMin = parseFloat(xMinInput.value);
    let xMax = parseFloat(xMaxInput.value);
    let yMin = parseFloat(yMinInput.value);
    let yMax = parseFloat(yMaxInput.value);
        
    // Zoom out by 1 unit on each side (total 2 units increase in range)
    xMinInput.value = (xMin - 1).toString();
    xMaxInput.value = (xMax + 1).toString();
    yMinInput.value = (yMin - 1).toString();
    yMaxInput.value = (yMax + 1).toString();
    
    updateRangeDisplay();
    plotFunction(false); // false = no animation
}

// Reset Zoom function
function resetZoom() {
    document.getElementById('xMin').value = '-10';
    document.getElementById('xMax').value = '10';
    document.getElementById('yMin').value = '-10';
    document.getElementById('yMax').value = '10';
    
    updateRangeDisplay();
    plotFunction(false); // false = no animation
}

// Set function from preset buttons or history
function setFunction(func) {
    document.getElementById('functionInput').value = func;
    plotFunction(); // Otomatis plot saat fungsi di-set
}

// Plot the function
function plotFunction(animate = true) {
    const functionInput = document.getElementById('functionInput').value;
    const xMin = parseFloat(document.getElementById('xMin').value);
    const xMax = parseFloat(document.getElementById('xMax').value);
    const yMin = parseFloat(document.getElementById('yMin').value);
    const yMax = parseFloat(document.getElementById('yMax').value);

    // Jangan simpan history jika input kosong
    if (!functionInput || functionInput.trim() === '') {
       // Opsional: Hapus grafik lama jika input dihapus
       if (myChart) {
           myChart.destroy();
           myChart = null;
       }
       // Mungkin tampilkan pesan atau biarkan kosong
       console.log("Input fungsi kosong, tidak memplot.");
       return; // Keluar dari fungsi jika input kosong
    }


    try {
        // Destroy previous chart if exists FIRST
        if (myChart) {
            myChart.destroy();
            myChart = null;
        }

        // Generate data points
        const points = 1000;
        const step = (xMax - xMin) / points;
        const segments = [];
        let currentSegment = [];
        
        let lastY = null;
        const yRange = Math.abs(yMax - yMin);
        const discontinuityThreshold = yRange * 0.5; // Sesuaikan jika perlu

        for (let i = 0; i <= points; i++) {
            const x = xMin + i * step;
            try {
                const y = math.evaluate(functionInput, { x: x });
                
                if (typeof y === 'number' && isFinite(y)) {
                    if (lastY !== null && Math.abs(y - lastY) > discontinuityThreshold) {
                        if (currentSegment.length > 0) segments.push(currentSegment);
                        currentSegment = [];
                    }
                    
                    const padding = yRange * 0.2;
                    if (y >= yMin - padding && y <= yMax + padding) {
                        currentSegment.push({ x: x, y: y });
                        lastY = y;
                    } else {
                        if (currentSegment.length > 0) segments.push(currentSegment);
                        currentSegment = [];
                        lastY = null;
                    }
                } else {
                    if (currentSegment.length > 0) segments.push(currentSegment);
                    currentSegment = [];
                    lastY = null;
                }
            } catch (e) {
                if (currentSegment.length > 0) segments.push(currentSegment);
                currentSegment = [];
                lastY = null;
            }
        }
        if (currentSegment.length > 0) segments.push(currentSegment);

        const datasets = segments.map((segment, index) => ({
            label: index === 0 ? `y = ${functionInput}` : '', // Hanya label di segmen pertama
            data: segment,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0,
            showLine: true
        }));

        const ctx = document.getElementById('graphCanvas').getContext('2d');
        myChart = new Chart(ctx, {
            type: 'scatter',
            data: { datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1,
                animation: { duration: animate ? 750 : 0 },
                plugins: {
                    legend: {
                        display: true, // Tampilkan legenda
                        position: 'top',
                        labels: {
                            color: '#ffffff',
                            font: { size: 12, weight: '300' },
                            // Filter agar hanya label utama yang muncul
                            filter: (item) => item.text !== ''
                        }
                    },
                    title: { display: false }
                },
                scales: {
                    x: {
                        type: 'linear', position: 'bottom',
                        min: xMin, max: xMax,
                        title: { display: true, text: 'x', color: '#ffffff' },
                        ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                        grid: { color: 'rgba(139, 92, 246, 0.2)' }
                    },
                    y: {
                        min: yMin, max: yMax,
                        title: { display: true, text: 'y', color: '#ffffff' },
                        ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                        grid: { color: 'rgba(139, 92, 246, 0.2)' }
                    }
                },
                interaction: { intersect: false, mode: 'index' }
            }
        });

        // Simpan ke history HANYA jika plot berhasil dan input tidak kosong
        saveToGraphHistory(functionInput);

    } catch (error) {
        // Tampilkan error jika parsing/evaluasi gagal
        alert('Error plotting function: ' + error.message + '\nPastikan format fungsi benar.');
        console.error(error);
        // Hapus grafik lama jika ada error
        if (myChart) {
             myChart.destroy();
             myChart = null;
        }
    }
    
    updateRangeDisplay();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    updateRangeDisplay(); // Panggil dulu untuk set nilai awal
    plotFunction(); // Plot fungsi default (jika ada)
    setupGraphHistoryModal(); // Setup modal history
});