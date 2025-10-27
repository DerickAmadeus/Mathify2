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

        let timerDisplay = `${module.duration_minutes} menit`;
        let buttonText = 'Mulai Quiz';
        let buttonIcon = 'M13 7l5 5m0 0l-5 5m5-5H6';
        
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
    }
}

/**
 * Handle module button click (start quiz directly - redirect to quiz page)
 */
async function handleModuleButton(moduleId, durationMinutes, timerId, buttonId, remainingSeconds = null) {
    const userId = getCurrentUserId();
    if (!userId) {
        alert('Silakan login terlebih dahulu');
        return;
    }

    // Confirm before starting quiz
    const confirmed = confirm(
        'Memulai quiz?\n\n' +
        'Perhatian:\n' +
        '- Quiz tidak dapat dipause\n' +
        '- Anda tidak dapat meninggalkan halaman selama quiz berlangsung\n' +
        '- Timer akan berjalan terus'
    );
    
    if (confirmed) {
        // Store module info in sessionStorage
        sessionStorage.setItem('currentModule', JSON.stringify({
            id: moduleId,
            durationMinutes: durationMinutes,
            remainingSeconds: remainingSeconds
        }));
        
        // Redirect to quiz page
        window.location.href = '/quiz';
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

