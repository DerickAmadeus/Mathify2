/**
 * Modules Page - Fetch and display practice modules from database
 */

// Timer class for countdown with pause/resume
class Timer {
    constructor(minutes, remainingSeconds = null) {
        this.totalSeconds = minutes * 60;
        this.remainingSeconds = remainingSeconds !== null ? remainingSeconds : this.totalSeconds;
        this.intervalId = null;
        this.isPaused = false;
        this.moduleId = null;
        this.userId = null;
        this.lastSaveTime = Date.now();
        this.saveInterval = 10000; // Save every 10 seconds
    }

    start(callback) {
        if (this.intervalId) return; // Already running
        
        this.isPaused = false;
        this.lastSaveTime = Date.now(); // Reset save timer
        
        this.intervalId = setInterval(() => {
            if (!this.isPaused) {
                // Prevent negative values
                this.remainingSeconds = Math.max(0, this.remainingSeconds - 1);
                
                if (this.remainingSeconds <= 0) {
                    this.stop();
                    this.saveProgress('completed');
                } else {
                    // Auto-save based on time elapsed, not modulo
                    const now = Date.now();
                    if (now - this.lastSaveTime >= this.saveInterval) {
                        this.saveProgress('in_progress');
                        this.lastSaveTime = now;
                    }
                }
                
                if (callback) callback(this.getFormattedTime(), this.isPaused);
            }
        }, 1000);
    }

    pause() {
        this.isPaused = true;
        this.saveProgress('paused');
    }

    resume() {
        this.isPaused = false;
        this.saveProgress('in_progress');
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    async saveProgress(status) {
        if (!this.moduleId || !this.userId) return;

        try {
            await fetch(`/api/modules/${this.moduleId}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: this.userId,
                    status: status,
                    remaining_seconds: this.remainingSeconds
                })
            });
        } catch (err) {
            console.error('Error saving progress:', err);
        }
    }

    getFormattedTime() {
        const minutes = Math.floor(this.remainingSeconds / 60);
        const seconds = this.remainingSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}

// Store active timers
const activeTimers = new Map();

/**
 * Fetch modules from API
 */
async function fetchModules() {
    try {
        const response = await fetch('/api/modules');
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to fetch modules');
        }

        return result.data || [];
    } catch (err) {
        console.error('Error fetching modules:', err);
        showError('Gagal memuat modul. Silakan refresh halaman.');
        return [];
    }
}

/**
 * Fetch user's progress for a module
 */
async function fetchProgress(moduleId, userId) {
    try {
        const response = await fetch(`/api/modules/${moduleId}/progress?user_id=${userId}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to fetch progress');
        }

        return result.data;
    } catch (err) {
        console.error('Error fetching progress:', err);
        return null;
    }
}

/**
 * Get current user ID from localStorage
 */
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

/**
 * Show error message
 */
function showError(message) {
    const container = document.getElementById('soalContainer');
    if (container) {
        container.innerHTML = `
            <div class="error-box" style="padding: 2rem; text-align: center; color: #ef4444;">
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #667eea; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
                    Refresh
                </button>
            </div>
        `;
    }
}

/**
 * Show loading state
 */
function showLoading() {
    const container = document.getElementById('soalContainer');
    if (container) {
        container.innerHTML = `
            <div class="loading-box" style="padding: 2rem; text-align: center; color: rgba(255,255,255,0.7);">
                <p>Loading modules...</p>
            </div>
        `;
    }
}

/**
 * Get difficulty badge color
 */
function getDifficultyColor(difficulty) {
    const colors = {
        'easy': '#10b981',
        'medium': '#f59e0b',
        'hard': '#ef4444'
    };
    return colors[difficulty?.toLowerCase()] || '#667eea';
}

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Generate module boxes from API data
 */
async function generateModuleBoxes(modules) {
    const container = document.getElementById('soalContainer');
    if (!container) return;

    if (!modules || modules.length === 0) {
        container.innerHTML = `
            <div class="empty-box" style="padding: 2rem; text-align: center; color: rgba(255,255,255,0.6);">
                <p>Belum ada modul tersedia.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = ''; // Clear container

    const userId = getCurrentUserId();

    // Fetch all progress data in parallel instead of one by one
    let progressMap = new Map();
    if (userId) {
        const progressPromises = modules.map(m => 
            fetchProgress(m.id, userId).then(p => ({ moduleId: m.id, progress: p }))
        );
        const progressResults = await Promise.all(progressPromises);
        progressResults.forEach(({ moduleId, progress }) => {
            if (progress) progressMap.set(moduleId, progress);
        });
    }

    // Now render all modules with their progress
    for (const module of modules) {
        const box = document.createElement('div');
        box.className = 'soal-box';
        
        const timerId = `timer-${module.id}`;
        const buttonId = `btn-${module.id}`;
        const difficultyColor = getDifficultyColor(module.difficulty);
        
        // Get progress from map
        const progress = progressMap.get(module.id) || null;

        const isInProgress = progress && progress.status === 'in_progress';
        const isPaused = progress && progress.status === 'paused';
        const isCompleted = progress && progress.status === 'completed';
        
        let timerDisplay = `${module.duration_minutes} menit`;
        let buttonText = 'Mulai Soal';
        let buttonIcon = 'M13 7l5 5m0 0l-5 5m5-5H6';
        
        if (isCompleted) {
            timerDisplay = 'Selesai!';
            buttonText = 'Ulangi';
        } else if (progress && progress.remaining_seconds !== null) {
            const mins = Math.floor(progress.remaining_seconds / 60);
            const secs = progress.remaining_seconds % 60;
            timerDisplay = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            
            if (isPaused) {
                buttonText = 'Lanjutkan';
                buttonIcon = 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z';
            } else if (isInProgress) {
                buttonText = 'Pause';
                buttonIcon = 'M10 9v6m4-6v6';
            }
        }
        
        box.innerHTML = `
            <div class="soal-header">
                <h3 class="soal-judul">${escapeHtml(module.title)}</h3>
                <span class="soal-badge" style="background: ${difficultyColor}">
                    ${escapeHtml(module.difficulty || 'Medium')}
                </span>
            </div>
            <div class="soal-body">
                ${module.description ? `<p class="soal-description" style="margin-bottom: 1rem; color: rgba(255,255,255,0.7); font-size: 0.9rem;">${escapeHtml(module.description)}</p>` : ''}
                <div class="soal-info">
                    <div class="soal-progress">
                        <svg xmlns="http://www.w3.org/2000/svg" class="soal-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>${module.total_questions} Soal</span>
                    </div>
                    <div class="soal-timer">
                        <svg xmlns="http://www.w3.org/2000/svg" class="soal-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span id="${timerId}">${timerDisplay}</span>
                    </div>
                </div>
                <button class="soal-btn" id="${buttonId}" 
                    onclick="handleModuleButton(${module.id}, ${module.duration_minutes}, '${timerId}', '${buttonId}', ${progress ? progress.remaining_seconds : null})">
                    <span>${buttonText}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${buttonIcon}" />
                    </svg>
                </button>
            </div>
        `;
        
        container.appendChild(box);
        
        // Auto-resume if was in progress
        if (isInProgress && progress) {
            // Add flag to prevent race condition with user clicks
            const button = document.getElementById(buttonId);
            if (button) button.disabled = true;
            
            setTimeout(() => {
                if (button) button.disabled = false;
                // Check again if timer already exists (user might have clicked during delay)
                if (!activeTimers.has(module.id)) {
                    startModule(module.id, module.duration_minutes, timerId, buttonId, progress.remaining_seconds);
                }
            }, 500);
        }
    }
}

/**
 * Handle module button click (start/pause/resume/restart)
 */
async function handleModuleButton(moduleId, durationMinutes, timerId, buttonId, remainingSeconds = null) {
    const timer = activeTimers.get(moduleId);
    const button = document.getElementById(buttonId);
    
    // Check if button is "Ulangi" (completed status)
    if (button && button.textContent.trim() === 'Ulangi') {
        try {
            // Delete progress from database
            const userData = localStorage.getItem('user');
            if (!userData) return;
            
            const user = JSON.parse(userData);
            const response = await fetch(`/api/modules/${moduleId}/progress?user_id=${user.id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                // Reload modules to reset the UI
                loadModules();
            } else {
                console.error('Failed to delete progress');
            }
        } catch (error) {
            console.error('Error restarting module:', error);
        }
        return;
    }
    
    if (timer) {
        // Timer exists - toggle pause/resume
        if (timer.isPaused) {
            timer.resume();
            updateButton(button, 'Pause', 'M10 9v6m4-6v6');
        } else {
            timer.pause();
            updateButton(button, 'Lanjutkan', 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z');
        }
    } else {
        // Start new timer
        startModule(moduleId, durationMinutes, timerId, buttonId, remainingSeconds);
    }
}

/**
 * Update button text and icon
 */
function updateButton(button, text, iconPath) {
    if (!button) return;
    button.innerHTML = `
        <span>${text}</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}" />
        </svg>
    `;
}

/**
 * Start module timer
 */
function startModule(moduleId, durationMinutes, timerId, buttonId, remainingSeconds = null) {
    const timerElement = document.getElementById(timerId);
    const button = document.getElementById(buttonId);
    
    if (!timerElement || !button) return;
    
    // Check if timer already exists
    if (activeTimers.has(moduleId)) {
        return;
    }
    
    const userId = getCurrentUserId();
    if (!userId) {
        alert('Silakan login terlebih dahulu');
        return;
    }
    
    // Create new timer
    const timer = new Timer(durationMinutes, remainingSeconds);
    timer.moduleId = moduleId;
    timer.userId = userId;
    
    activeTimers.set(moduleId, timer);
    
    timer.start((timeString, isPaused) => {
        timerElement.textContent = `Waktu tersisa: ${timeString}`;
        
        // When timer ends
        if (timeString === '00:00') {
            timerElement.textContent = 'Waktu Habis!';
            updateButton(button, 'Selesai', 'M5 13l4 4L19 7');
            button.disabled = true;
            button.style.opacity = '0.7';
            activeTimers.delete(moduleId);
        }
    });
    
    // Update button to Pause
    updateButton(button, 'Pause', 'M10 9v6m4-6v6');
    
    console.log(`Started module ${moduleId}`);
    showQuestions(moduleId);
}

/**
 * Fetch and display questions for selected module
 */
/**
 * Fetch and display questions for selected module (robust version)
 */

async function showQuestions(moduleId) {
    const container = document.getElementById('soalContainer');
    if (!container) return;

    container.innerHTML = `<p style="text-align:center;color:#aaa;">Memuat soal...</p>`;

    try {
        const response = await fetch(`/api/modules/${moduleId}/questions`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal memuat soal');

        const questions = result.data || [];
        if (questions.length === 0) {
            container.innerHTML = `<p style="text-align:center;color:#aaa;">Belum ada soal di modul ini.</p>`;
            return;
        }

        // state
        let currentIndex = 0;
        const answers = new Array(questions.length).fill(null);

        // render UI (one question per view) with themed controls
        container.innerHTML = `
            <div class="quiz-header">
                <button id="backToModules" class="quiz-btn ghost">← Kembali ke Modul</button>
                <h2>Soal Modul ${moduleId}</h2>
            </div>
            <div id="questionArea" class="question-area"></div>
            <div class="quiz-controls">
                <button id="exitBtn" class="quiz-btn danger">Exit Modul</button>
                <button id="submitBtn" class="quiz-btn primary">Submit</button>
            </div>
            <div class="quiz-nav">
                <div>
                    <button id="prevBtn" class="quiz-btn ghost" disabled>⟨ Sebelumnya</button>
                </div>
                <div style="flex:1;text-align:center;">
                    <span id="questionCounter"></span>
                </div>
                <div>
                    <button id="nextBtn" class="quiz-btn secondary">Berikutnya ⟩</button>
                </div>
            </div>
        `;

        const area = document.getElementById('questionArea');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const counter = document.getElementById('questionCounter');
        const submitBtn = document.getElementById('submitBtn');
        const exitBtn = document.getElementById('exitBtn');

        // helper to normalize answers for comparison
        function normalize(v) {
            if (v === null || v === undefined) return '';
            if (Array.isArray(v)) return v.map(x => String(x).trim().toLowerCase()).join('|');
            return String(v).trim().toLowerCase();
        }

        function renderQuestion(index) {
            const q = questions[index];
            // use either q.text or q.question_text depending on API
            const text = q.text ?? q.question_text ?? q.question ?? '';
                    area.innerHTML = `
                        <div class="question-box">
                            <div class="question-text"><strong>${index + 1}.</strong> ${escapeHtml(text)}</div>
                            ${generateQuestionOptions(q)}
                        </div>
                    `;

            // populate previously selected answer (if any)
            const inputs = area.querySelectorAll('input[name^="q"]');
            if (inputs && inputs.length) {
                inputs.forEach(inp => {
                    // radio
                    if (inp.type === 'radio') {
                        if (answers[index] !== null && normalize(answers[index]) === normalize(inp.value)) {
                            inp.checked = true;
                        }
                        inp.addEventListener('change', () => {
                            answers[index] = inp.value;
                        });
                    } else if (inp.type === 'text') {
                        inp.value = answers[index] ?? '';
                        inp.addEventListener('input', (e) => {
                            answers[index] = e.target.value;
                        });
                    }
                });
            }

            counter.textContent = `Soal ${index + 1} dari ${questions.length}`;
            prevBtn.disabled = index === 0;
            nextBtn.disabled = index === questions.length - 1;
        }

        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                renderQuestion(currentIndex);
            }
        });

        nextBtn.addEventListener('click', () => {
            if (currentIndex < questions.length - 1) {
                currentIndex++;
                renderQuestion(currentIndex);
            }
        });

            document.getElementById('backToModules').addEventListener('click', async () => {
                // Pause timer, save remaining seconds to progress, then return
                const t = activeTimers.get(moduleId);
                let remaining = null;
                if (t) {
                    t.pause();
                    remaining = t.remainingSeconds;
                }
                const userId = getCurrentUserId();
                if (userId) {
                    try {
                        await fetch(`/api/modules/${moduleId}/progress`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ user_id: userId, status: 'paused', remaining_seconds: remaining })
                        });
                    } catch (e) { /* ignore */ }
                }
                // backup answers
                try { localStorage.setItem(`module_${moduleId}_answers`, JSON.stringify(answers)); } catch (e) {}
                loadModules();
            });

        // Exit button: pause timer, save progress (paused) with remaining seconds, then return
        exitBtn.addEventListener('click', async () => {
            if (!confirm('Keluar dari modul? Progress akan disimpan dan kamu dapat melanjutkan nanti.')) return;
            const t = activeTimers.get(moduleId);
            let remaining = null;
            if (t) { t.pause(); remaining = t.remainingSeconds; }
            const userId = getCurrentUserId();
            if (userId) {
                try {
                    await fetch(`/api/modules/${moduleId}/progress`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: userId, status: 'paused', remaining_seconds: remaining })
                    });
                } catch (e) { /* ignore */ }
            }
            try { localStorage.setItem(`module_${moduleId}_answers`, JSON.stringify(answers)); } catch (e) {}
            loadModules();
        });

        // Submit button: confirm, grade, send completed progress
        submitBtn.addEventListener('click', async () => {
            if (!confirm('Kirim semua jawaban dan selesaikan modul? Setelah submit, modul akan diberi status "Selesai".')) return;

            // grade
            let correctCount = 0;
            const details = [];
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                const userAns = answers[i];
                const correct = q.correct_answer ?? q.answer ?? q.correct ?? null;
                const isCorrect = correct !== null && normalize(userAns) === normalize(correct);
                if (isCorrect) correctCount++;
                details.push({ question: q, userAns, correct, isCorrect });
            }

            // stop timer if running
            const t = activeTimers.get(moduleId);
            let remaining = null;
            if (t) {
                remaining = t.remainingSeconds;
                t.stop();
                activeTimers.delete(moduleId);
            }

            // mark progress completed on server
            const userId = getCurrentUserId();
            if (userId) {
                try {
                    await fetch(`/api/modules/${moduleId}/progress`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: userId, status: 'completed', remaining_seconds: remaining })
                    });
                } catch (err) {
                    console.warn('Gagal menyimpan progress selesai:', err);
                }
            }

                    // show summary (styled)
                    container.innerHTML = `
                        <div class="quiz-summary">
                            <h3>Hasil: ${correctCount} / ${questions.length}</h3>
                            <p class="muted">Skor: ${Math.round((correctCount / questions.length) * 100)}%</p>
                            <div id="detailArea" class="detail-list"></div>
                            <div style="margin-top:1rem;display:flex;gap:.5rem;justify-content:center;">
                                <button id="backToModulesAfterSubmit" class="quiz-btn secondary">Kembali ke Modul</button>
                            </div>
                        </div>
                    `;

                    const detailArea = document.getElementById('detailArea');
                    detailArea.innerHTML = details.map((d, i) => {
                        const qtext = escapeHtml(d.question.text ?? d.question.question_text ?? '');
                        const user = escapeHtml(d.userAns ?? '-');
                        const corr = escapeHtml(d.correct ?? '-');
                        const mark = d.isCorrect ? '✅' : '❌';
                        return `<div class="detail-item">
                                            <div><strong>Soal ${i+1}.</strong> ${qtext}</div>
                                            <div style="margin-top:.25rem;color:var(--muted,#ddd);">Jawaban kamu: ${user} — Kunci: ${corr} ${mark}</div>
                                        </div>`;
                    }).join('');

                    document.getElementById('backToModulesAfterSubmit').addEventListener('click', () => {
                        loadModules();
                    });
        });

        // Pause otomatis saat tab diganti / halaman berpindah (saves via Timer.pause if running)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                const t = activeTimers.get(moduleId);
                if (t) t.pause();
            }
        });

        // try to restore saved answers from localStorage (optional)
        try {
            const saved = JSON.parse(localStorage.getItem(`module_${moduleId}_answers`) || 'null');
            if (Array.isArray(saved) && saved.length === questions.length) {
                for (let i=0;i<saved.length;i++) answers[i] = saved[i];
            }
        } catch (e) {}

        renderQuestion(currentIndex);
    } catch (err) {
        console.error(err);
        container.innerHTML = `<p style="text-align:center;color:red;">Terjadi kesalahan saat memuat soal.</p>`;
    }
}

/**
 * Generate HTML for question options based on type (robust)
 */
function generateQuestionOptions(question) {
    // default safe values
    const qid = question.id ?? Math.random().toString(36).slice(2, 9);
    const type = (question.type || 'multiple_choice').toLowerCase();

    if (type === 'multiple_choice' && Array.isArray(question.options) && question.options.length > 0) {
        return `
            <div class="options">
                ${question.options.map((opt, idx) => `
                    <label>
                        <input type="radio" name="q${qid}" value="${escapeHtml(String(opt))}"> ${escapeHtml(String(opt))}
                    </label>
                `).join('')}
            </div>
        `;
    } else if (type === 'true_false') {
        return `
            <div class="options">
                <label><input type="radio" name="q${qid}" value="true"> True</label>
                <label><input type="radio" name="q${qid}" value="false"> False</label>
            </div>
        `;
    } else {
        // short answer fallback
        return `
            <div class="answer-box">
                <input class="text-input" type="text" name="q${qid}" placeholder="Jawaban kamu...">
            </div>
        `;
    }
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', async function() {
    showLoading();
    
    const modules = await fetchModules();
    await generateModuleBoxes(modules);
});

/**
 * Helper to reload modules list (used in multiple places)
 */
async function loadModules() {
    showLoading();
    const modules = await fetchModules();
    await generateModuleBoxes(modules);
}

