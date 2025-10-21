// Soal Configuration
const soalData = [
    { judul: "Matematika Dasar", totalSoal: 20, durasi: 30 },
    { judul: "Aljabar Linear", totalSoal: 15, durasi: 25 },
    { judul: "Kalkulus", totalSoal: 20, durasi: 40 },
    { judul: "Geometri", totalSoal: 18, durasi: 35 },
    { judul: "Statistika", totalSoal: 20, durasi: 30 },
    { judul: "Trigonometri", totalSoal: 16, durasi: 28 }
];

// Timer class for countdown
class Timer {
    constructor(minutes) {
        this.totalSeconds = minutes * 60;
        this.remainingSeconds = this.totalSeconds;
        this.intervalId = null;
    }

    start(callback) {
        this.intervalId = setInterval(() => {
            this.remainingSeconds--;
            if (this.remainingSeconds <= 0) {
                this.stop();
            }
            if (callback) callback(this.getFormattedTime());
        }, 1000);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    getFormattedTime() {
        const minutes = Math.floor(this.remainingSeconds / 60);
        const seconds = this.remainingSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}

// Generate soal boxes
function generateSoalBoxes() {
    const container = document.getElementById('soalContainer');
    if (!container) return;

    soalData.forEach((soal, index) => {
        const box = document.createElement('div');
        box.className = 'soal-box';
        
        const timer = new Timer(soal.durasi);
        const timerId = `timer-${index}`;
        
        box.innerHTML = `
            <div class="soal-header">
                <h3 class="soal-judul">Judul #${index + 1}</h3>
                <span class="soal-badge">${soal.judul}</span>
            </div>
            <div class="soal-body">
                <div class="soal-info">
                    <div class="soal-progress">
                        <svg xmlns="http://www.w3.org/2000/svg" class="soal-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Soal 1/${soal.totalSoal}</span>
                    </div>
                    <div class="soal-timer">
                        <svg xmlns="http://www.w3.org/2000/svg" class="soal-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span id="${timerId}">Waktu tersisa: ${timer.getFormattedTime()}</span>
                    </div>
                </div>
                <button class="soal-btn" onclick="startSoal(${index})">
                    Mulai Soal
                    <svg xmlns="http://www.w3.org/2000/svg" class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </button>
            </div>
        `;
        
        container.appendChild(box);
        
        // Store timer reference for later use
        box.dataset.timerId = timerId;
        box.dataset.timerIndex = index;
    });
}

// Start soal function
function startSoal(index) {
    const soal = soalData[index];
    const timerId = `timer-${index}`;
    const timerElement = document.getElementById(timerId);
    
    if (!timerElement) return;
    
    // Create new timer and start countdown
    const timer = new Timer(soal.durasi);
    timer.start((timeString) => {
        timerElement.textContent = `Waktu tersisa: ${timeString}`;
    });
    
    // Update button to show "Sedang Berlangsung"
    const button = event.target.closest('button');
    if (button) {
        button.textContent = 'Sedang Berlangsung';
        button.classList.add('active');
        button.disabled = true;
    }
    
    console.log(`Started: ${soal.judul}`);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    generateSoalBoxes();
});
