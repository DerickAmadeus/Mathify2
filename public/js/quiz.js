// Quiz Configuration
const QUIZ_CONFIG = {
    get totalQuestions() {
        return questions.length;
    },
    debounceDelay: 800 // 800ms debounce for graph update
};

// Quiz State
let quizState = {
    currentQuestion: 1,
    timeRemaining: 0,
    answers: {},
    flaggedQuestions: new Set(),
    timerInterval: null,
    debounceTimer: null,
    graphChart: null,
    moduleData: null
};


// Questions will be fetched from API
let questions = [];

async function fetchQuestionsByModule(moduleId) {
    try {
        const response = await fetch(`/api/questions?module_id=${moduleId}`);
        if (!response.ok) throw new Error('Failed to fetch questions');
        questions = await response.json();
    } catch (error) {
        console.error('Error fetching questions:', error);
        alert('Gagal mengambil soal dari server.');
    }
}

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
        
        // Get user ID
        const userId = getCurrentUserId();
        if (!userId) {
            alert('Please login first');
            window.location.href = '/login';
            return null;
        }
        
        // Check if module already completed
        const progressResponse = await fetch(`/api/modules/${module.id}/progress?user_id=${userId}`);
        const progressResult = await progressResponse.json();
        
        if (progressResult.success && progressResult.data && progressResult.data.status === 'completed') {
            alert('Anda sudah menyelesaikan quiz ini!');
            window.location.href = '/modules';
            return null;
        }
        
        // Fetch full module data from API
        const response = await fetch(`/api/modules/${module.id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch module data');
        }
        
        const result = await response.json();
        quizState.moduleData = result.data;
        
        // Update quiz title with module title
        const titleElement = document.getElementById('quizTitle');
        const breadcrumbElement = document.getElementById('breadcrumbModule');
        if (titleElement && quizState.moduleData) {
            titleElement.textContent = quizState.moduleData.title || 'Quiz';
        }
        if (breadcrumbElement && quizState.moduleData) {
            breadcrumbElement.textContent = quizState.moduleData.title || 'Quiz';
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

// Get current user ID
function getCurrentUserId() {
    const user = localStorage.getItem('user');
    if (!user) return null;
    
    try {
        const userData = JSON.parse(user);
        return userData.id;
    } catch (err) {
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
    const timeLeftElement = document.getElementById('timeLeftValue');
    if (timeLeftElement) {
        timeLeftElement.textContent = formatTime(quizState.timeRemaining);
    }
    
    quizState.timerInterval = setInterval(() => {
        quizState.timeRemaining--;
        
        if (timeLeftElement) {
            timeLeftElement.textContent = formatTime(quizState.timeRemaining);
            
            // Change color when time is running out
            if (quizState.timeRemaining <= 60) {
                timeLeftElement.style.color = '#f5576c';
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
        
        // Update status badge
        const statusBadge = document.getElementById('statusBadge');
        if (statusBadge) {
            statusBadge.textContent = 'Answered';
            statusBadge.style.background = 'rgba(76, 175, 80, 0.3)';
            statusBadge.style.color = '#4caf50';
            statusBadge.style.borderColor = '#4caf50';
        }
    }
}

function loadQuestion(questionNumber) {
    // Update question number display
    document.getElementById('currentQuestionNumber').textContent = questionNumber;
    
    // Get question from questions array (0-indexed)
    const question = questions[questionNumber - 1];
    
    if (question) {
        // Update question title
        const questionTitle = document.querySelector('.question-title');
        if (questionTitle) {
            questionTitle.textContent = question.title || `Soal ${questionNumber}`;
        }
        
        // Update question formula with MathJax
        const questionFormula = document.getElementById('questionFormula');
        if (questionFormula) {
            let formulaText = question.formula || '';
            // Only wrap with $$ if not already present
            if (!formulaText.trim().startsWith('$$')) {
                formulaText = `$$${formulaText}$$`;
            }
            questionFormula.innerHTML = formulaText;
            // Re-render MathJax for the formula
            if (window.MathJax) {
                MathJax.typesetPromise([questionFormula]).catch((err) => console.log('MathJax error:', err));
            }
        }
        
        // Update question instruction
        const questionInstruction = document.querySelector('.question-instruction p');
        if (questionInstruction) {
            questionInstruction.innerHTML = question.instruction || '';
            // Re-render MathJax for the instruction
            if (window.MathJax) {
                MathJax.typesetPromise([questionInstruction]).catch((err) => console.log('MathJax error:', err));
            }
        }
    }
    
    // Load saved answer if exists
    const answerInput = document.getElementById('answerInput');
    if (answerInput) {
        answerInput.value = quizState.answers[questionNumber] || '';
        
        // Update graph if there's a saved answer
        if (quizState.answers[questionNumber]) {
            updateGraph(quizState.answers[questionNumber]);
        } else {
            // Clear graph
            if (quizState.graphChart) {
                quizState.graphChart.data.datasets = [];
                quizState.graphChart.update();
                document.getElementById('graphStatusText').textContent = 'No input';
            }
        }
    }
    
    // Update status badge
    const statusBadge = document.getElementById('statusBadge');
    if (statusBadge) {
        if (quizState.answers[questionNumber]) {
            statusBadge.textContent = 'Answered';
            statusBadge.style.background = 'rgba(76, 175, 80, 0.3)';
            statusBadge.style.color = '#4caf50';
            statusBadge.style.borderColor = '#4caf50';
        } else {
            statusBadge.textContent = 'Not yet answered';
            statusBadge.style.background = 'rgba(255, 193, 7, 0.2)';
            statusBadge.style.color = '#ffc107';
            statusBadge.style.borderColor = 'rgba(255, 193, 7, 0.3)';
        }
    }
    
    // Update flag button state
    const flagButton = document.getElementById('flagButton');
    if (flagButton) {
        if (quizState.flaggedQuestions.has(questionNumber)) {
            flagButton.classList.add('flagged');
        } else {
            flagButton.classList.remove('flagged');
        }
    }
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
        
        answerInput.addEventListener('blur', () => {
            saveCurrentAnswer();
            generateQuestionGrid();
        });
    }
    
    // Flag button
    const flagButton = document.getElementById('flagButton');
    if (flagButton) {
        flagButton.addEventListener('click', () => {
            if (quizState.flaggedQuestions.has(quizState.currentQuestion)) {
                quizState.flaggedQuestions.delete(quizState.currentQuestion);
                flagButton.classList.remove('flagged');
            } else {
                quizState.flaggedQuestions.add(quizState.currentQuestion);
                flagButton.classList.add('flagged');
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
    
    // Calculate results - compare with correct answers
    const answeredCount = Object.keys(quizState.answers).length;
    let rightAnswer = 0;
    let wrongAnswer = 0;
    
    // Check each answer
    for (let i = 1; i <= QUIZ_CONFIG.totalQuestions; i++) {
        const userAnswer = quizState.answers[i];
        const question = questions[i - 1]; // questions array is 0-indexed
        
        if (userAnswer && question && question.correct_answer) {
            // Simple string comparison (trim and lowercase)
            const normalizedUserAnswer = userAnswer.trim().toLowerCase();
            const normalizedCorrectAnswer = question.correct_answer.trim().toLowerCase();
            
            if (normalizedUserAnswer === normalizedCorrectAnswer) {
                rightAnswer++;
            } else {
                wrongAnswer++;
            }
        } else if (userAnswer) {
            // If answered but no correct answer defined, count as wrong
            wrongAnswer++;
        }
    }
    
    // Unanswered questions count as wrong
    const unansweredCount = QUIZ_CONFIG.totalQuestions - answeredCount;
    wrongAnswer += unansweredCount;
    
    // Save to database
    saveQuizResults(rightAnswer, wrongAnswer);
    
    alert(`Quiz selesai!\n\nBenar: ${rightAnswer}\nSalah: ${wrongAnswer}\nTotal: ${QUIZ_CONFIG.totalQuestions}`);
    
    // Remove beforeunload listener
    window.onbeforeunload = null;
    
    // Redirect back to modules page
    window.location.href = '/modules';
}

// Save quiz results to database
async function saveQuizResults(rightAnswer, wrongAnswer) {
    try {
        const userId = getCurrentUserId();
        const moduleInfo = sessionStorage.getItem('currentModule');
        
        if (!userId || !moduleInfo) {
            console.error('Missing user or module info');
            return;
        }
        
        const module = JSON.parse(moduleInfo);
        
        const response = await fetch(`/api/modules/${module.id}/progress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                status: 'completed',
                remaining_seconds: quizState.timeRemaining,
                right_answer: rightAnswer,
                wrong_answer: wrongAnswer
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            console.error('Failed to save quiz results:', result.error);
        }
    } catch (error) {
        console.error('Error saving quiz results:', error);
    }
}

async function waitForMathJax() {
    return new Promise((resolve) => {
        if (window.MathJax && MathJax.typesetPromise) {
            resolve();
        } else {
            const checkInterval = setInterval(() => {
                if (window.MathJax && MathJax.typesetPromise) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 200);
        }
    });
}

// Initialize MathJax
async function initializeMathJax() {
    await waitForMathJax(); // pastikan MathJax sudah siap
    try {
        await MathJax.typesetPromise();
    } catch (err) {
        console.log('MathJax render error:', err);
    }
}



// Initialize Quiz
async function initializeQuiz() {
    // Load module data first
    const moduleData = await loadModuleData();
    if (!moduleData) return;

    // Fetch questions for this module
    await fetchQuestionsByModule(moduleData.id);

    preventPageLeave();
    startTimer();
    initializeGraph();
    generateQuestionGrid();
    setupEventListeners();

    // Jika tidak ada soal, tampilkan pesan
    if (!questions || questions.length === 0) {
        showNoQuestionsMessage();
        return;
    }

    // Load first question
    loadQuestion(1);

    // Initialize MathJax after a short delay
    setTimeout(initializeMathJax, 100);
}

function showNoQuestionsMessage() {
    // Hapus konten quiz
    const quizContainer = document.getElementById('quizContainer') || document.body;
    quizContainer.innerHTML = '';
    // Buat elemen pesan
    const msg = document.createElement('div');
    msg.textContent = 'Soal belum tersedia.';
    msg.style.background = '#fff';
    msg.style.color = '#333';
    msg.style.fontSize = '2rem';
    msg.style.fontWeight = 'bold';
    msg.style.textAlign = 'center';
    msg.style.padding = '60px';
    msg.style.borderRadius = '12px';
    msg.style.margin = '80px auto';
    msg.style.maxWidth = '400px';
    msg.style.boxShadow = '0 2px 16px rgba(0,0,0,0.08)';
    quizContainer.appendChild(msg);
}

// Start quiz when page loads
document.addEventListener('DOMContentLoaded', initializeQuiz);
