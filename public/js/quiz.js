// Quiz Configuration
const QUIZ_CONFIG = {
    totalQuestions: 10,
    initialTime: 257, // 4:17 in seconds
    debounceDelay: 800 // 800ms debounce for graph update
};

// Quiz State
let quizState = {
    currentQuestion: 8,
    timeRemaining: QUIZ_CONFIG.initialTime,
    answers: {},
    flaggedQuestions: new Set(),
    timerInterval: null,
    debounceTimer: null,
    graphChart: null,
    moduleData: null
};

// Sample Questions Data
const questions = [
    {
        id: 1,
        title: "Hasil limit",
        formula: "\\lim_{(x,y)\\to(0,0)} \\frac{3x^2 + x^2y + 3y^2 + y^3}{x^2 + y^2} = A",
        instruction: "Maka $A =$"
    },
    // Add more questions as needed
];

// Load module data from sessionStorage and DB
async function loadModuleData() {
    try {
        const moduleInfo = sessionStorage.getItem('currentModule');
        if (!moduleInfo) {
            alert('Module information not found. Redirecting to modules page...');
            window.location.href = '/modules';
            return null;
        }
        
        const module = JSON.parse(moduleInfo);
        
        // Fetch full module data from API
        const response = await fetch(`/api/modules/${module.id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch module data');
        }
        
        const result = await response.json();
        quizState.moduleData = result.data;
        
        // Update quiz title with module title
        const titleElement = document.querySelector('.quiz-main-title');
        if (titleElement && quizState.moduleData) {
            titleElement.textContent = quizState.moduleData.title || 'Quiz';
        }
        
        // Update timer if module has duration
        if (quizState.moduleData && quizState.moduleData.duration_minutes) {
            if (module.remainingSeconds) {
                quizState.timeRemaining = module.remainingSeconds;
            } else {
                quizState.timeRemaining = quizState.moduleData.duration_minutes * 60;
            }
        }
        
        return quizState.moduleData;
    } catch (error) {
        console.error('Error loading module data:', error);
        alert('Failed to load quiz data. Using default settings.');
        return null;
    }
}

// Prevent Page Leave
function preventPageLeave() {
    // Prevent back button
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = function() {
        window.history.pushState(null, null, window.location.href);
        alert('Anda tidak dapat meninggalkan halaman quiz saat sedang berlangsung!');
    };
    
    // Prevent page close/reload
    window.addEventListener('beforeunload', function(e) {
        e.preventDefault();
        e.returnValue = 'Quiz sedang berlangsung. Apakah Anda yakin ingin meninggalkan halaman?';
        return e.returnValue;
    });
    
    // Prevent context menu
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
    
    // Prevent certain keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Prevent F5 (refresh)
        if (e.key === 'F5') {
            e.preventDefault();
        }
        // Prevent Ctrl+R (refresh)
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
        }
        // Prevent Ctrl+W (close tab)
        if (e.ctrlKey && e.key === 'w') {
            e.preventDefault();
        }
    });
}

// Timer Functions
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function startTimer() {
    quizState.timerInterval = setInterval(() => {
        quizState.timeRemaining--;
        
        const timeLeftElement = document.getElementById('timeLeftValue');
        if (timeLeftElement) {
            timeLeftElement.textContent = formatTime(quizState.timeRemaining);
            
            // Change color when time is running out
            if (quizState.timeRemaining <= 60) {
                timeLeftElement.style.color = '#d32f2f';
                timeLeftElement.style.fontWeight = 'bold';
            }
        }
        
        // Auto submit when time runs out
        if (quizState.timeRemaining <= 0) {
            clearInterval(quizState.timerInterval);
            autoSubmitQuiz();
        }
    }, 1000);
}

function autoSubmitQuiz() {
    alert('Waktu habis! Quiz akan otomatis disubmit.');
    finishQuiz();
}

// Graph Functions - Using same approach as graph.js
function initializeGraph() {
    const canvas = document.getElementById('miniGraphCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    quizState.graphChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'f(x)',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0,
                showLine: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1,
            animation: {
                duration: 0
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: false
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: -10,
                    max: 10,
                    title: {
                        display: true,
                        text: 'x',
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.5)',
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        color: 'rgba(139, 92, 246, 0.2)'
                    }
                },
                y: {
                    min: -10,
                    max: 10,
                    title: {
                        display: true,
                        text: 'y',
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.5)',
                        font: {
                            size: 10
                        }
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
}

function updateGraph(expression) {
    if (!quizState.graphChart || !expression || expression.trim() === '') {
        document.getElementById('graphStatusText').textContent = 'No input';
        return;
    }
    
    try {
        const xMin = -10;
        const xMax = 10;
        const yMin = -10;
        const yMax = 10;
        
        // Generate data points with discontinuity detection (like graph.js)
        const points = 500;
        const step = (xMax - xMin) / points;
        const segments = [];
        let currentSegment = [];
        
        let lastY = null;
        const yRange = Math.abs(yMax - yMin);
        const discontinuityThreshold = yRange * 0.5;

        for (let i = 0; i <= points; i++) {
            const x = xMin + i * step;
            try {
                // Evaluate using math.js
                const y = math.evaluate(expression, { x: x });
                
                if (typeof y === 'number' && isFinite(y)) {
                    // Check for discontinuity
                    if (lastY !== null && Math.abs(y - lastY) > discontinuityThreshold) {
                        if (currentSegment.length > 0) {
                            segments.push(currentSegment);
                            currentSegment = [];
                        }
                    }
                    
                    // Only add points within visible range
                    const padding = yRange * 0.2;
                    if (y >= yMin - padding && y <= yMax + padding) {
                        currentSegment.push({ x: x, y: y });
                        lastY = y;
                    } else {
                        if (currentSegment.length > 0) {
                            segments.push(currentSegment);
                            currentSegment = [];
                        }
                        lastY = null;
                    }
                } else {
                    if (currentSegment.length > 0) {
                        segments.push(currentSegment);
                        currentSegment = [];
                    }
                    lastY = null;
                }
            } catch (e) {
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
            label: index === 0 ? `y = ${expression}` : '',
            data: segment,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0,
            showLine: true
        }));

        if (datasets.length > 0) {
            quizState.graphChart.data.datasets = datasets;
            quizState.graphChart.update('none');
            document.getElementById('graphStatusText').textContent = 'Displaying';
        } else {
            document.getElementById('graphStatusText').textContent = 'Invalid expression';
        }
    } catch (error) {
        document.getElementById('graphStatusText').textContent = 'Error parsing';
        console.error('Graph error:', error);
    }
}

function debounceGraphUpdate(expression) {
    // Clear existing debounce timer
    if (quizState.debounceTimer) {
        clearTimeout(quizState.debounceTimer);
    }
    
    // Set new debounce timer
    quizState.debounceTimer = setTimeout(() => {
        updateGraph(expression);
    }, QUIZ_CONFIG.debounceDelay);
}

// Question Navigation
function generateQuestionGrid() {
    const grid = document.getElementById('questionGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    for (let i = 1; i <= QUIZ_CONFIG.totalQuestions; i++) {
        const btn = document.createElement('button');
        btn.className = 'question-grid-btn';
        btn.textContent = i;
        
        // Mark current question
        if (i === quizState.currentQuestion) {
            btn.classList.add('current');
        }
        
        // Mark answered questions
        if (quizState.answers[i]) {
            btn.classList.add('answered');
        }
        
        // Mark flagged questions
        if (quizState.flaggedQuestions.has(i)) {
            btn.classList.add('flagged');
        }
        
        btn.addEventListener('click', () => navigateToQuestion(i));
        grid.appendChild(btn);
    }
}

function navigateToQuestion(questionNumber) {
    // Save current answer before navigating
    saveCurrentAnswer();
    
    quizState.currentQuestion = questionNumber;
    loadQuestion(questionNumber);
    generateQuestionGrid();
}

function saveCurrentAnswer() {
    const answerInput = document.getElementById('answerInput');
    if (answerInput && answerInput.value.trim() !== '') {
        quizState.answers[quizState.currentQuestion] = answerInput.value;
    }
}

function loadQuestion(questionNumber) {
    // Update question number display
    document.getElementById('currentQuestionNumber').textContent = questionNumber;
    
    // Load saved answer if exists
    const answerInput = document.getElementById('answerInput');
    if (answerInput) {
        answerInput.value = quizState.answers[questionNumber] || '';
        
        // Update graph if there's a saved answer
        if (quizState.answers[questionNumber]) {
            updateGraph(quizState.answers[questionNumber]);
        }
    }
    
    // You can add logic here to load different questions
    // For now, we'll keep the same question displayed
}

// Event Handlers
function setupEventListeners() {
    // Answer input with debounced graph update
    const answerInput = document.getElementById('answerInput');
    if (answerInput) {
        answerInput.addEventListener('input', (e) => {
            const value = e.target.value;
            debounceGraphUpdate(value);
        });
    }
    
    // Flag button
    const flagButton = document.getElementById('flagButton');
    if (flagButton) {
        flagButton.addEventListener('click', () => {
            if (quizState.flaggedQuestions.has(quizState.currentQuestion)) {
                quizState.flaggedQuestions.delete(quizState.currentQuestion);
            } else {
                quizState.flaggedQuestions.add(quizState.currentQuestion);
            }
            generateQuestionGrid();
        });
    }
    
    // Previous button
    const previousBtn = document.getElementById('previousBtn');
    if (previousBtn) {
        previousBtn.addEventListener('click', () => {
            if (quizState.currentQuestion > 1) {
                navigateToQuestion(quizState.currentQuestion - 1);
            }
        });
    }
    
    // Next button
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (quizState.currentQuestion < QUIZ_CONFIG.totalQuestions) {
                navigateToQuestion(quizState.currentQuestion + 1);
            }
        });
    }
    
    // Finish button
    const finishBtn = document.getElementById('finishAttemptBtn');
    if (finishBtn) {
        finishBtn.addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin menyelesaikan quiz?')) {
                finishQuiz();
            }
        });
    }
}

function finishQuiz() {
    // Save current answer
    saveCurrentAnswer();
    
    // Stop timer
    if (quizState.timerInterval) {
        clearInterval(quizState.timerInterval);
    }
    
    // Calculate results
    const answeredCount = Object.keys(quizState.answers).length;
    
    alert(`Quiz selesai!\nPertanyaan terjawab: ${answeredCount}/${QUIZ_CONFIG.totalQuestions}`);
    
    // Redirect back to modules page
    window.removeEventListener('beforeunload', preventPageLeave);
    window.location.href = '/modules';
}

// Initialize MathJax
function initializeMathJax() {
    if (window.MathJax) {
        MathJax.typesetPromise().catch((err) => console.log('MathJax error:', err));
    }
}

// Initialize Quiz
async function initializeQuiz() {
    // Load module data first
    await loadModuleData();
    
    preventPageLeave();
    startTimer();
    initializeGraph();
    generateQuestionGrid();
    setupEventListeners();
    
    // Initialize MathJax after a short delay
    setTimeout(initializeMathJax, 100);
}

// Start quiz when page loads
document.addEventListener('DOMContentLoaded', initializeQuiz);
