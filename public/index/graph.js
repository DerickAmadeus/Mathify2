let myChart = null;

// Update range display
function updateRangeDisplay() {
    const xMin = parseFloat(document.getElementById('xMin').value);
    const xMax = parseFloat(document.getElementById('xMax').value);
    const yMin = parseFloat(document.getElementById('yMin').value);
    const yMax = parseFloat(document.getElementById('yMax').value);
    
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
    xMinInput.value = xMin + 1;
    xMaxInput.value = xMax - 1;
    yMinInput.value = yMin + 1;
    yMaxInput.value = yMax - 1;
    
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
    xMinInput.value = xMin - 1;
    xMaxInput.value = xMax + 1;
    yMinInput.value = yMin - 1;
    yMaxInput.value = yMax + 1;
    
    updateRangeDisplay();
    plotFunction(false); // false = no animation
}

// Reset Zoom function
function resetZoom() {
    document.getElementById('xMin').value = -10;
    document.getElementById('xMax').value = 10;
    document.getElementById('yMin').value = -10;
    document.getElementById('yMax').value = 10;
    
    updateRangeDisplay();
    plotFunction(false); // false = no animation
}

// Set function from preset buttons
function setFunction(func) {
    document.getElementById('functionInput').value = func;
    plotFunction();
}

// Plot the function
function plotFunction(animate = true) {
    const functionInput = document.getElementById('functionInput').value;
    const xMin = parseFloat(document.getElementById('xMin').value);
    const xMax = parseFloat(document.getElementById('xMax').value);
    const yMin = parseFloat(document.getElementById('yMin').value);
    const yMax = parseFloat(document.getElementById('yMax').value);

    if (!functionInput) {
        alert('Please enter a function');
        return;
    }

    try {
        // Destroy previous chart if exists FIRST
        if (myChart) {
            myChart.destroy();
            myChart = null;
        }

        // Generate data points with more detail for better discontinuity detection
        const points = 1000;
        const step = (xMax - xMin) / points;
        const segments = []; // Array of separate line segments
        let currentSegment = [];
        
        let lastY = null;
        const yRange = Math.abs(yMax - yMin);
        const discontinuityThreshold = yRange * 0.5;

        for (let i = 0; i <= points; i++) {
            const x = xMin + i * step;
            try {
                // Evaluate the function using math.js
                const y = math.evaluate(functionInput, { x: x });
                
                // Check if y is valid
                if (typeof y === 'number' && isFinite(y)) {
                    // Check if we need to start a new segment (discontinuity detected)
                    if (lastY !== null && Math.abs(y - lastY) > discontinuityThreshold) {
                        // Save current segment if it has data
                        if (currentSegment.length > 0) {
                            segments.push(currentSegment);
                            currentSegment = [];
                        }
                    }
                    
                    // Only add points within visible range (with padding)
                    const padding = yRange * 0.2;
                    if (y >= yMin - padding && y <= yMax + padding) {
                        currentSegment.push({ x: x, y: y });
                        lastY = y;
                    } else {
                        // Point outside range, start new segment
                        if (currentSegment.length > 0) {
                            segments.push(currentSegment);
                            currentSegment = [];
                        }
                        lastY = null;
                    }
                } else {
                    // Invalid point, start new segment
                    if (currentSegment.length > 0) {
                        segments.push(currentSegment);
                        currentSegment = [];
                    }
                    lastY = null;
                }
            } catch (e) {
                // Error evaluating, start new segment
                if (currentSegment.length > 0) {
                    segments.push(currentSegment);
                    currentSegment = [];
                }
                lastY = null;
            }
        }

        // Add the last segment
        if (currentSegment.length > 0) {
            segments.push(currentSegment);
        }

        // Create datasets from segments
        const datasets = segments.map((segment, index) => ({
            label: index === 0 ? `y = ${functionInput}` : '',
            data: segment,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0,
            showLine: true
        }));

        // Create new chart
        const ctx = document.getElementById('graphCanvas').getContext('2d');
        myChart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1,
                animation: {
                    duration: animate ? 750 : 0  // Animate on initial plot, instant on zoom
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#ffffff',
                            font: {
                                size: 12,
                                weight: '300'
                            },
                            filter: function(item) {
                                // Only show first dataset in legend
                                return item.text !== '';
                            }
                        }
                    },
                    title: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: xMin,
                        max: xMax,
                        title: {
                            display: true,
                            text: 'x',
                            color: '#ffffff'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(139, 92, 246, 0.2)'
                        }
                    },
                    y: {
                        min: yMin,
                        max: yMax,
                        title: {
                            display: true,
                            text: 'y',
                            color: '#ffffff'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(139, 92, 246, 0.2)'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });

    } catch (error) {
        alert('Error plotting function: ' + error.message);
        console.error(error);
    }
    
    // Update range display after plotting
    updateRangeDisplay();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    updateRangeDisplay();
    plotFunction();
});
