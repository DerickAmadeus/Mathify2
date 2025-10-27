/**
 * Modules Page - Fetch and display practice modules from database
 */

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
        let isCompleted = progress && progress.status === 'completed';
        let completedBadge = '';
        let scoreDisplay = '';
        
        // If completed, show results and disable button
        if (isCompleted) {
            buttonText = 'Selesai';
            buttonIcon = 'M5 13l4 4L19 7';
            completedBadge = `
                <span class="soal-badge" style="background: #10b981; margin-left: 0.5rem;">
                    ✓ Completed
                </span>
            `;
            
            // Show score if available
            if (progress.right_answer !== null || progress.wrong_answer !== null) {
                const rightCount = progress.right_answer;
                const wrongCount = progress.wrong_answer;
                let totalQuestions = rightCount + wrongCount;
                const percentage = ((rightCount / totalQuestions) * 100);
                scoreDisplay = `
                    <div class="soal-score" style="margin-top: 0.75rem; padding: 0.75rem; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 0.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <span style="color: rgba(255,255,255,0.7); font-size: 0.85rem;">Hasil Quiz</span>
                            <span style="color: #10b981; font-weight: bold; font-size: 1rem;">${percentage}%</span>
                        </div>
                        <div style="display: flex; gap: 1rem; font-size: 0.85rem;">
                            <span style="color: #10b981;">✓ Benar: ${rightCount}</span>
                            <span style="color: #ef4444;">✗ Salah: ${wrongCount}</span>
                        </div>
                    </div>
                `;
            }
        }
        
        box.innerHTML = `
            <div class="soal-header">
                <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                    <h3 class="soal-judul">${escapeHtml(module.title)}</h3>
                    ${completedBadge}
                </div>
                <span class="soal-badge" style="background: ${difficultyColor}">
                    ${escapeHtml(module.difficulty || 'Medium')}
                </span>
            </div>
            <div class="soal-body">
                ${module.description ? `<p class="soal-description" style="margin-bottom: 1rem; color: rgba(255,255,255,0.7); font-size: 0.9rem;">${escapeHtml(module.description)}</p>` : ''}
                <div class="soal-info">
                    <!-- jumlah soal dihapus sesuai permintaan -->
                    <div class="soal-timer">
                        <svg xmlns="http://www.w3.org/2000/svg" class="soal-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span id="${timerId}">${timerDisplay}</span>
                    </div>
                </div>
                ${scoreDisplay}
                <button class="soal-btn ${isCompleted ? 'completed' : ''}" id="${buttonId}" 
                    onclick="handleModuleButton(${module.id}, ${module.duration_minutes}, '${timerId}', '${buttonId}', ${progress ? progress.remaining_seconds : null}, ${isCompleted})"
                    ${isCompleted ? 'disabled' : ''}>
                    <span>${buttonText}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${buttonIcon}" />
                    </svg>
                </button>
            </div>
        `;
        
        container.appendChild(box);
        // Update jumlah soal di card modul jika window.questions tersedia
        if (window.questions && Array.isArray(window.questions)) {
            const countSpan = box.querySelector(`#question-count-${module.id}`);
            if (countSpan) {
                countSpan.textContent = `${window.questions.length} Soal`;
            }
        }
    }
}

/**
 * Handle module button click (start quiz - redirect to quiz page)
 */
async function handleModuleButton(moduleId, durationMinutes, timerId, buttonId, remainingSeconds = null, isCompleted = false) {
    const userId = getCurrentUserId();
    if (!userId) {
        alert('Silakan login terlebih dahulu');
        return;
    }

    // Block access if already completed
    if (isCompleted) {
        alert('Anda sudah menyelesaikan quiz ini! Lihat hasil Anda di card module.');
        return;
    }

    // Confirm before starting quiz
    const confirmed = confirm(
        'Memulai quiz?\n\n' +
        'Perhatian:\n' +
        '- Quiz tidak dapat di-pause\n' +
        '- Anda tidak dapat meninggalkan halaman selama quiz berlangsung\n' +
        '- Timer akan berjalan terus tanpa henti'
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

