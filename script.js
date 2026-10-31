// ============================================================
//  MORSE CODE COMPILER — Full Interactive Engine
// ============================================================

// ===== Morse Code Dictionary =====
const MORSE_CODE = {
    'A': '.-',    'B': '-...',  'C': '-.-.',  'D': '-..',
    'E': '.',     'F': '..-.',  'G': '--.',   'H': '....',
    'I': '..',    'J': '.---',  'K': '-.-',   'L': '.-..',
    'M': '--',    'N': '-.',    'O': '---',   'P': '.--.',
    'Q': '--.-',  'R': '.-.',   'S': '...',   'T': '-',
    'U': '..-',   'V': '...-',  'W': '.--',   'X': '-..-',
    'Y': '-.--',  'Z': '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--',
    '4': '....-', '5': '.....', '6': '-....', '7': '--...',
    '8': '---..', '9': '----.',
    '.': '.-.-.-',  ',': '--..--',  '?': '..--..',
    "'": '.----.', '!': '-.-.--',  '/': '-..-.',
    '(': '-.--.',  ')': '-.--.-',  '&': '.-...',
    ':': '---...', ';': '-.-.-.', '=': '-...-',
    '+': '.-.-.',  '-': '-....-', '_': '..--.-',
    '"': '.-..-.', '$': '...-..-','@': '.--.-.',
};

// Reverse lookup: morse → char
const MORSE_REVERSE = {};
for (const [char, code] of Object.entries(MORSE_CODE)) {
    MORSE_REVERSE[code] = char;
}

// ===== Audio Engine =====
class AudioEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.frequency = 700; // Hz
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    beep(durationMs) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(this.frequency, this.ctx.currentTime);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.005);
        gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + durationMs / 1000 - 0.005);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + durationMs / 1000);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + durationMs / 1000);
    }

    startContinuous() {
        if (!this.enabled || !this.ctx) return;
        this.stopContinuous();
        this.contOsc = this.ctx.createOscillator();
        this.contGain = this.ctx.createGain();
        this.contOsc.type = 'sine';
        this.contOsc.frequency.setValueAtTime(this.frequency, this.ctx.currentTime);
        this.contGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.contGain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.01);
        this.contOsc.connect(this.contGain);
        this.contGain.connect(this.ctx.destination);
        this.contOsc.start();
    }

    stopContinuous() {
        if (this.contOsc) {
            try {
                this.contGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.01);
                this.contOsc.stop(this.ctx.currentTime + 0.02);
            } catch(e) {}
            this.contOsc = null;
            this.contGain = null;
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

const audio = new AudioEngine();

// ===== Toast Notification System =====
function showToast(message, type = 'error', durationMs = 4000) {
    // Remove existing toast if any
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;

    const icons = {
        error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    document.body.appendChild(toast);

    // Trigger entrance animation
    requestAnimationFrame(() => toast.classList.add('visible'));

    // Auto-dismiss
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, durationMs);
}

// ===== Input Validation =====
function findUnsupportedChars(text) {
    const unsupported = [];
    const seen = new Set();
    for (const ch of text) {
        const upper = ch.toUpperCase();
        if (ch === ' ') continue; // spaces are fine
        if (!MORSE_CODE[upper] && !seen.has(ch)) {
            unsupported.push(ch);
            seen.add(ch);
        }
    }
    return unsupported;
}

function isEmoji(char) {
    // Detect emoji via unicode ranges
    const code = char.codePointAt(0);
    return code > 0x1F600 || // Emoticons & beyond
           (code >= 0x2600 && code <= 0x27BF) || // Misc symbols
           (code >= 0xFE00 && code <= 0xFE0F) || // Variation selectors
           (code >= 0x200D); // ZWJ sequences fallback — high codepoint
}

// ===== DOM Elements =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Mode
const encoderTab = $('#encoderTab');
const decoderTab = $('#decoderTab');
const encoderPanel = $('#encoderPanel');
const decoderPanel = $('#decoderPanel');

// Encoder
const textInput = $('#textInput');
const charCount = $('#charCount');
const encodeBtn = $('#encodeBtn');
const stopBtn = $('#stopBtn');
const clearEncoderBtn = $('#clearEncoderBtn');
const speedSlider = $('#speedSlider');
const speedLabel = $('#speedLabel');
const bulb = $('#bulb');
const bulbGlow = $('#bulbGlow');
const bulbReflection = $('#bulbReflection');
const signalChar = $('#signalChar');
const signalMorse = $('#signalMorse');
const morseOutput = $('#morseOutput');
const encoderStatus = $('#encoderStatus');

// Decoder
const telegraphArm = $('#telegraphArm');
const telegraphKnob = $('#telegraphKnob');
const telegraphContact = $('#telegraphContact');
const pressBar = $('#pressBar');
const morseInputDisplay = $('#morseInputDisplay');
const backspaceBtn = $('#backspaceBtn');
const clearDecoderBtn = $('#clearDecoderBtn');
const decoderSpeedSlider = $('#decoderSpeedSlider');
const decoderSpeedLabel = $('#decoderSpeedLabel');
const messageCanvas = $('#messageCanvas');
const clearCanvasBtn = $('#clearCanvasBtn');
const decoderStatus = $('#decoderStatus');

// Reference
const referenceToggle = $('#referenceToggle');
const referenceGrid = $('#referenceGrid');

// Audio
const audioToggle = $('#audioToggle');

// ===== Mode Switching =====
function setMode(mode) {
    if (mode === 'encoder') {
        encoderTab.classList.add('active');
        decoderTab.classList.remove('active');
        encoderPanel.classList.add('active');
        decoderPanel.classList.remove('active');
    } else {
        decoderTab.classList.add('active');
        encoderTab.classList.remove('active');
        decoderPanel.classList.add('active');
        encoderPanel.classList.remove('active');
        initCanvas();
    }
}

encoderTab.addEventListener('click', () => setMode('encoder'));
decoderTab.addEventListener('click', () => setMode('decoder'));

// ===== Encoder Logic =====
let isPlaying = false;
let playAbort = null;

function getUnitDuration() {
    // Speed 1 = 200ms, speed 10 = 40ms
    const speed = parseInt(speedSlider.value);
    return 240 - (speed * 20);
}

function textToMorse(text) {
    return text.toUpperCase().split('').map(ch => {
        if (ch === ' ') return ' / ';
        return MORSE_CODE[ch] || '';
    }).filter(Boolean).join(' ');
}

// Sanitize input: strip unsupported chars and return cleaned text
function sanitizeInput(text) {
    return Array.from(text).filter(ch => ch === ' ' || MORSE_CODE[ch.toUpperCase()]).join('');
}

// Update char count
textInput.addEventListener('input', () => {
    const len = textInput.value.length;
    charCount.textContent = `${len} / 200`;
});

// Speed label update
speedSlider.addEventListener('input', () => {
    speedLabel.textContent = `${speedSlider.value}x`;
});

// Encode & Play
encodeBtn.addEventListener('click', async () => {
    const rawText = textInput.value.trim();
    if (!rawText || isPlaying) return;

    // Validate input
    const unsupported = findUnsupportedChars(rawText);
    const cleanText = sanitizeInput(rawText);

    if (unsupported.length > 0) {
        const emojiChars = unsupported.filter(c => isEmoji(c));
        const otherChars = unsupported.filter(c => !isEmoji(c));

        let msg = '';
        if (emojiChars.length > 0 && otherChars.length > 0) {
            msg = `Emojis <strong>${emojiChars.join(' ')}</strong> and characters <strong>${otherChars.map(c => `"${c}"`).join(', ')}</strong> have no Morse code equivalent — they will be skipped.`;
        } else if (emojiChars.length > 0) {
            msg = `Emojis <strong>${emojiChars.join(' ')}</strong> have no Morse code equivalent — they will be skipped.`;
        } else {
            msg = `Characters <strong>${otherChars.map(c => `"${c}"`).join(', ')}</strong> have no Morse code equivalent — they will be skipped.`;
        }
        showToast(msg, 'warning', 5000);
    }

    if (!cleanText) {
        showToast('No valid Morse code characters found in your input. Only A-Z, 0-9, and common punctuation are supported.', 'error', 5000);
        return;
    }

    const text = cleanText;

    audio.init();
    isPlaying = true;
    playAbort = { cancelled: false };
    encodeBtn.disabled = true;
    stopBtn.disabled = false;
    encoderStatus.className = 'status-indicator playing';
    encoderStatus.querySelector('span:last-child').textContent = 'Playing';

    const morse = textToMorse(text);
    renderMorseOutput(text, morse);

    try {
        await playMorse(text, morse, playAbort);
    } catch(e) {
        // Aborted
    }

    bulbOff();
    isPlaying = false;
    encodeBtn.disabled = false;
    stopBtn.disabled = true;
    encoderStatus.className = 'status-indicator active';
    encoderStatus.querySelector('span:last-child').textContent = 'Complete';
    signalChar.textContent = '✓';
    signalMorse.textContent = '';
});

// Stop
stopBtn.addEventListener('click', () => {
    if (playAbort) playAbort.cancelled = true;
});

// Clear
clearEncoderBtn.addEventListener('click', () => {
    textInput.value = '';
    charCount.textContent = '0 / 200';
    morseOutput.innerHTML = '<span class="morse-placeholder">Morse code will appear here...</span>';
    signalChar.textContent = '—';
    signalMorse.textContent = '';
    bulbOff();
    encoderStatus.className = 'status-indicator';
    encoderStatus.querySelector('span:last-child').textContent = 'Ready';
});

function renderMorseOutput(text, morse) {
    morseOutput.innerHTML = '';
    const chars = text.toUpperCase().split('');
    chars.forEach((ch, i) => {
        if (ch === ' ') {
            const space = document.createElement('span');
            space.className = 'morse-space';
            space.textContent = '   ';
            space.dataset.index = i;
            morseOutput.appendChild(space);
        } else {
            const code = MORSE_CODE[ch];
            if (code) {
                const span = document.createElement('span');
                span.className = 'morse-char';
                span.textContent = code;
                span.dataset.index = i;
                morseOutput.appendChild(span);
                // Add space between chars
                if (i < chars.length - 1 && chars[i + 1] !== ' ') {
                    morseOutput.appendChild(document.createTextNode('  '));
                }
            }
        }
    });
}

function bulbOn() {
    bulb.classList.add('on');
    bulbGlow.classList.add('on');
    bulbReflection.classList.add('on');
}

function bulbOff() {
    bulb.classList.remove('on');
    bulbGlow.classList.remove('on');
    bulbReflection.classList.remove('on');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function playMorse(text, morse, abort) {
    const unit = getUnitDuration();
    const chars = text.toUpperCase().split('');

    for (let i = 0; i < chars.length; i++) {
        if (abort.cancelled) throw new Error('Aborted');

        const ch = chars[i];
        const code = MORSE_CODE[ch];

        // Highlight current char in output
        const allMorseChars = morseOutput.querySelectorAll('.morse-char, .morse-space');
        allMorseChars.forEach(el => {
            const idx = parseInt(el.dataset.index);
            if (idx < i) el.classList.add('completed');
            else el.classList.remove('completed');
            el.classList.remove('active');
        });

        if (ch === ' ') {
            signalChar.textContent = '⎵';
            signalMorse.textContent = '';
            await sleep(unit * 7); // Word gap
            continue;
        }

        if (!code) continue;

        signalChar.textContent = ch;
        signalMorse.textContent = code;

        // Find the current element and make it active
        const currentEl = morseOutput.querySelector(`.morse-char[data-index="${i}"]`);
        if (currentEl) currentEl.classList.add('active');

        for (let j = 0; j < code.length; j++) {
            if (abort.cancelled) throw new Error('Aborted');

            const symbol = code[j];
            const duration = symbol === '.' ? unit : unit * 3;

            bulbOn();
            audio.beep(duration);
            await sleep(duration);
            bulbOff();

            // Gap between symbols in the same character
            if (j < code.length - 1) {
                await sleep(unit);
            }
        }

        if (currentEl) {
            currentEl.classList.remove('active');
            currentEl.classList.add('completed');
        }

        // Gap between characters
        if (i < chars.length - 1 && chars[i + 1] !== ' ') {
            await sleep(unit * 3);
        }
    }

    // Mark all as completed
    morseOutput.querySelectorAll('.morse-char').forEach(el => el.classList.add('completed'));
}


// ===== DECODER LOGIC =====

let decoderState = {
    isKeyDown: false,
    keyDownTime: 0,
    lastKeyUpTime: 0,
    currentMorse: '',       // Current building morse sequence (dots and dashes)
    decodedChars: [],       // Array of {char, isError, morse} objects
    letterTimeout: null,
    wordTimeout: null,
    pressAnimFrame: null,
};

// Helper: get plain text from decodedChars
function getDecodedText() {
    return decoderState.decodedChars.map(c => c.char).join('');
}

function getDecoderUnit() {
    const speed = parseInt(decoderSpeedSlider.value);
    return 280 - (speed * 24);
}

decoderSpeedSlider.addEventListener('input', () => {
    decoderSpeedLabel.textContent = `${decoderSpeedSlider.value}x`;
});

function keyDown() {
    if (decoderState.isKeyDown) return;
    audio.init();

    decoderState.isKeyDown = true;
    decoderState.keyDownTime = Date.now();

    // Clear timeouts — user is still inputting
    clearTimeout(decoderState.letterTimeout);
    clearTimeout(decoderState.wordTimeout);

    // Visual feedback
    telegraphArm.classList.add('pressed');
    telegraphContact.classList.add('active');

    // Audio
    audio.startContinuous();

    // Start press bar animation
    animatePressBar();

    decoderStatus.className = 'status-indicator playing';
    decoderStatus.querySelector('span:last-child').textContent = 'Signal Active';
}

function keyUp() {
    if (!decoderState.isKeyDown) return;

    decoderState.isKeyDown = false;
    const duration = Date.now() - decoderState.keyDownTime;
    decoderState.lastKeyUpTime = Date.now();

    // Visual feedback
    telegraphArm.classList.remove('pressed');
    telegraphContact.classList.remove('active');

    // Audio
    audio.stopContinuous();

    // Reset press bar
    cancelAnimationFrame(decoderState.pressAnimFrame);
    pressBar.style.width = '0%';

    const unit = getDecoderUnit();

    // Determine dot or dash
    if (duration < unit * 2) {
        decoderState.currentMorse += '.';
    } else {
        decoderState.currentMorse += '-';
    }

    updateMorseInputDisplay();

    decoderStatus.className = 'status-indicator active';
    decoderStatus.querySelector('span:last-child').textContent = 'Listening';

    // Set letter timeout — if no new input for 3 units, commit the letter
    clearTimeout(decoderState.letterTimeout);
    decoderState.letterTimeout = setTimeout(() => {
        commitLetter();

        // Set word timeout — if no new input for 7 units after letter, add space
        clearTimeout(decoderState.wordTimeout);
        decoderState.wordTimeout = setTimeout(() => {
            const chars = decoderState.decodedChars;
            if (chars.length > 0 && chars[chars.length - 1].char !== ' ') {
                chars.push({ char: ' ', isError: false, morse: '' });
                drawCanvas();
            }
        }, unit * 4);
    }, unit * 3);
}

function animatePressBar() {
    if (!decoderState.isKeyDown) return;
    const elapsed = Date.now() - decoderState.keyDownTime;
    const unit = getDecoderUnit();
    const maxMs = unit * 4;
    const pct = Math.min((elapsed / maxMs) * 100, 100);
    pressBar.style.width = pct + '%';

    // Change color based on dot/dash threshold
    if (elapsed < unit * 2) {
        pressBar.style.background = 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))';
    } else {
        pressBar.style.background = 'linear-gradient(90deg, var(--warning), #f59e0b)';
    }

    decoderState.pressAnimFrame = requestAnimationFrame(animatePressBar);
}

function commitLetter() {
    if (!decoderState.currentMorse) return;

    const char = MORSE_REVERSE[decoderState.currentMorse];
    if (!char) {
        showToast(`Unknown Morse sequence <strong>"${decoderState.currentMorse}"</strong> — no matching character found.`, 'warning', 3500);
        decoderState.decodedChars.push({ char: '?', isError: true, morse: decoderState.currentMorse });
    } else {
        decoderState.decodedChars.push({ char: char, isError: false, morse: decoderState.currentMorse });
    }
    decoderState.currentMorse = '';

    updateMorseInputDisplay();
    drawCanvas();
}

function updateMorseInputDisplay() {
    if (decoderState.currentMorse === '' && decoderState.decodedChars.length === 0) {
        morseInputDisplay.innerHTML = '<span class="morse-placeholder">Input signals here...</span>';
        return;
    }

    let html = '';
    if (decoderState.decodedChars.length > 0) {
        // Render each char — errors get red styling with tooltip
        html += decoderState.decodedChars.map(entry => {
            if (entry.isError) {
                return `<span class="decoded-error" title="Unknown: ${entry.morse}">?</span>`;
            }
            return `<span style="color: var(--text-muted); font-size: 0.8em;">${entry.char}</span>`;
        }).join('');
    }
    if (decoderState.currentMorse) {
        html += ` <span style="color: var(--bulb-on); font-size: 1.4em; text-shadow: 0 0 8px var(--bulb-glow);">${decoderState.currentMorse}</span>`;
    }
    morseInputDisplay.innerHTML = html;
}

// Backspace
backspaceBtn.addEventListener('click', () => {
    if (decoderState.currentMorse.length > 0) {
        decoderState.currentMorse = decoderState.currentMorse.slice(0, -1);
    } else if (decoderState.decodedChars.length > 0) {
        decoderState.decodedChars.pop();
        drawCanvas();
    }
    updateMorseInputDisplay();
});

// Clear Decoder
clearDecoderBtn.addEventListener('click', () => {
    decoderState.currentMorse = '';
    decoderState.decodedChars = [];
    clearTimeout(decoderState.letterTimeout);
    clearTimeout(decoderState.wordTimeout);
    updateMorseInputDisplay();
    drawCanvas();
});

// Clear Canvas
clearCanvasBtn.addEventListener('click', () => {
    decoderState.decodedChars = [];
    decoderState.currentMorse = '';
    updateMorseInputDisplay();
    drawCanvas();
});

// Telegraph mouse/touch events
telegraphArm.addEventListener('mousedown', (e) => { e.preventDefault(); keyDown(); });
telegraphKnob.addEventListener('mousedown', (e) => { e.preventDefault(); keyDown(); });
document.addEventListener('mouseup', () => { if (decoderState.isKeyDown) keyUp(); });

telegraphArm.addEventListener('touchstart', (e) => { e.preventDefault(); keyDown(); });
telegraphKnob.addEventListener('touchstart', (e) => { e.preventDefault(); keyDown(); });
document.addEventListener('touchend', () => { if (decoderState.isKeyDown) keyUp(); });

// Keyboard events for decoder
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && decoderPanel.classList.contains('active')) {
        e.preventDefault();
        if (!e.repeat) keyDown();
    }
    if ((e.code === 'Backspace' || e.code === 'Delete') && decoderPanel.classList.contains('active')) {
        e.preventDefault();
        backspaceBtn.click();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'Space' && decoderPanel.classList.contains('active')) {
        e.preventDefault();
        keyUp();
    }
});


// ===== Canvas Renderer =====
let canvasCtx = null;

function initCanvas() {
    const canvas = messageCanvas;
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;

    canvasCtx = canvas.getContext('2d');
    canvasCtx.scale(dpr, dpr);

    drawCanvas();
}

function drawCanvas() {
    if (!canvasCtx) initCanvas();

    const canvas = messageCanvas;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    // Clear
    canvasCtx.clearRect(0, 0, w, h);

    // Background gradient
    const bgGrad = canvasCtx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#1e1e2a');
    bgGrad.addColorStop(1, '#16161f');
    canvasCtx.fillStyle = bgGrad;
    canvasCtx.fillRect(0, 0, w, h);

    // Grid lines (subtle)
    canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    canvasCtx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
        canvasCtx.beginPath();
        canvasCtx.moveTo(x, 0);
        canvasCtx.lineTo(x, h);
        canvasCtx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
        canvasCtx.beginPath();
        canvasCtx.moveTo(0, y);
        canvasCtx.lineTo(w, y);
        canvasCtx.stroke();
    }

    const decodedChars = decoderState.decodedChars;
    const text = getDecodedText();
    if (!text) {
        // Empty state
        canvasCtx.font = '500 16px Inter, sans-serif';
        canvasCtx.fillStyle = 'rgba(144, 144, 168, 0.4)';
        canvasCtx.textAlign = 'center';
        canvasCtx.textBaseline = 'middle';
        canvasCtx.fillText('Decoded message will appear here...', w / 2, h / 2);
        return;
    }

    // Render decoded text
    const padding = 24;
    const maxWidth = w - padding * 2;

    // Dynamic font sizing
    let fontSize = 32;
    if (text.length > 30) fontSize = 24;
    if (text.length > 60) fontSize = 18;
    if (text.length > 100) fontSize = 14;

    canvasCtx.font = `700 ${fontSize}px 'Outfit', sans-serif`;
    canvasCtx.textBaseline = 'top';
    canvasCtx.textAlign = 'left';

    // Word-wrap into lines of char-objects
    const lines = wordWrapChars(canvasCtx, decodedChars, maxWidth);
    const lineHeight = fontSize * 1.5;
    const totalHeight = lines.length * lineHeight;
    let startY = Math.max(padding, (h - totalHeight) / 2);

    // Draw each character individually so errors get distinct styling
    lines.forEach((lineChars, lineIdx) => {
        const y = startY + lineIdx * lineHeight;
        let x = padding;

        lineChars.forEach(entry => {
            const ch = entry.char;

            if (entry.isError) {
                // Error character: red with red glow + dashed underline
                canvasCtx.shadowColor = 'rgba(248, 113, 113, 0.6)';
                canvasCtx.shadowBlur = 10;
                canvasCtx.fillStyle = '#f87171';
                canvasCtx.fillText(ch, x, y);

                // Dashed underline
                canvasCtx.shadowColor = 'transparent';
                canvasCtx.shadowBlur = 0;
                const charW = canvasCtx.measureText(ch).width;
                canvasCtx.strokeStyle = '#f87171';
                canvasCtx.lineWidth = 2;
                canvasCtx.setLineDash([3, 3]);
                canvasCtx.beginPath();
                canvasCtx.moveTo(x, y + fontSize + 2);
                canvasCtx.lineTo(x + charW, y + fontSize + 2);
                canvasCtx.stroke();
                canvasCtx.setLineDash([]);

                x += charW;
            } else {
                // Normal character: white with purple glow
                canvasCtx.shadowColor = 'rgba(139, 92, 246, 0.5)';
                canvasCtx.shadowBlur = 12;
                canvasCtx.fillStyle = '#e8e8f0';
                canvasCtx.fillText(ch, x, y);

                canvasCtx.shadowColor = 'transparent';
                canvasCtx.shadowBlur = 0;

                x += canvasCtx.measureText(ch).width;
            }
        });
    });

    // Blinking cursor
    const lastLineChars = lines[lines.length - 1];
    const lastLineText = lastLineChars.map(c => c.char).join('');
    const lastLineWidth = canvasCtx.measureText(lastLineText).width;
    const cursorY = startY + (lines.length - 1) * lineHeight;

    if (Date.now() % 1000 < 500) {
        canvasCtx.fillStyle = '#a78bfa';
        canvasCtx.fillRect(padding + lastLineWidth + 4, cursorY + 2, 3, fontSize);
    }

    // Start cursor blink animation
    requestAnimationFrame(drawCursorBlink);
}

function drawCursorBlink() {
    if (decoderPanel.classList.contains('active')) {
        drawCanvas();
    }
}

function wordWrap(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    });

    if (currentLine) lines.push(currentLine);
    return lines.length ? lines : [''];
}

// Word-wrap for char-object arrays (preserves isError metadata per char)
function wordWrapChars(ctx, charObjs, maxWidth) {
    if (charObjs.length === 0) return [[]];

    // Split into words (arrays of char objects) on space chars
    const words = [];
    let currentWord = [];
    charObjs.forEach(entry => {
        if (entry.char === ' ') {
            if (currentWord.length > 0) words.push(currentWord);
            words.push([entry]); // space as its own "word"
            currentWord = [];
        } else {
            currentWord.push(entry);
        }
    });
    if (currentWord.length > 0) words.push(currentWord);

    const lines = [];
    let currentLine = [];

    words.forEach(word => {
        // Skip standalone spaces at start of line
        if (word.length === 1 && word[0].char === ' ' && currentLine.length === 0) return;

        const testLine = [...currentLine, ...word];
        const testText = testLine.map(c => c.char).join('');
        const metrics = ctx.measureText(testText);

        if (metrics.width > maxWidth && currentLine.length > 0) {
            lines.push(currentLine);
            // Don't start new line with a space
            if (word.length === 1 && word[0].char === ' ') {
                currentLine = [];
            } else {
                currentLine = [...word];
            }
        } else {
            currentLine = testLine;
        }
    });

    if (currentLine.length > 0) lines.push(currentLine);
    return lines.length ? lines : [[]];
}


// ===== Morse Code Reference =====
function buildReference() {
    const entries = Object.entries(MORSE_CODE);
    referenceGrid.innerHTML = entries.map(([char, code]) => `
        <div class="ref-item" title="${char}: ${code}">
            <span class="ref-char">${char}</span>
            <span class="ref-morse">${code}</span>
        </div>
    `).join('');
}

referenceToggle.addEventListener('click', () => {
    referenceToggle.classList.toggle('open');
    referenceGrid.classList.toggle('open');
});

buildReference();


// ===== Audio Toggle =====
audioToggle.addEventListener('click', () => {
    const enabled = audio.toggle();
    audioToggle.querySelector('.audio-on').style.display = enabled ? 'block' : 'none';
    audioToggle.querySelector('.audio-off').style.display = enabled ? 'none' : 'block';
});


// ===== Canvas resize handler =====
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (decoderPanel.classList.contains('active')) {
            initCanvas();
        }
    }, 200);
});


// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    // Set initial status
    encoderStatus.className = 'status-indicator';
    decoderStatus.className = 'status-indicator active';
});
