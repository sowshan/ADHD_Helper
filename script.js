// Core App State Configuration
let mainTask = "";
let substeps = [];

// DOM Element Registry
const dumpPhase = document.getElementById('dump-phase');
const focusPhase = document.getElementById('focus-phase');
const rawInput = document.getElementById('raw-input');
const aiBtn = document.getElementById('ai-btn');
const loadingMsg = document.getElementById('loading-msg');
const currentTaskDisplay = document.getElementById('current-task-display');
const substepsContainer = document.getElementById('substeps-container');
const doneBtn = document.getElementById('done-btn');

// --- AUTO-LOAD PREVIOUS UNFINISHED TASK ON BOOT ---
window.addEventListener('DOMContentLoaded', () => {
    try {
        const savedTask = localStorage.getItem("adhd_main_task");
        const savedSteps = localStorage.getItem("adhd_substeps");

        if (savedTask && savedSteps) {
            const parsedSteps = JSON.parse(savedSteps);
            // Validation step: Only auto-load if structural arrays are functional
            if (Array.isArray(parsedSteps) && parsedSteps.length > 0) {
                mainTask = savedTask;
                substeps = parsedSteps;
                startFocusPhase(false); // Restore without overwriting storage states
            }
        }
    } catch (error) {
        console.error("Storage corruption verified. Wiping state cleanly.", error);
        clearApplicationStorage();
    }
});

// AI Processing Pipeline
async function getAISubsteps() {
    const inputData = rawInput.value.trim();
    if (!inputData) return alert("Please type your task or thought first!");

    mainTask = inputData;
    aiBtn.disabled = true;
    loadingMsg.classList.remove('hidden');

    const systemPrompt = `You are an ADHD executive function coach. The user will give you a task or a chaotic mind dump. Break down the primary goal into exactly 3 to 5 incredibly small, non-overwhelming physical steps. Make each step short, explicit, and start with an action verb. Return ONLY the steps as a numbered list. Do not include any introductory or concluding text.`;

    try {
        const response = await fetch("https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                inputs: `<|system|>\n${systemPrompt}</s>\n<|user|>\n${mainTask}</s>\n<|assistant|>\n`,
                parameters: { max_new_tokens: 250, return_full_text: false }
            })
        });

        const result = await response.json();
        let aiText = "";
        
        if (Array.isArray(result) && result[0]?.generated_text) {
            aiText = result[0].generated_text;
        } else if (result.generated_text) {
            aiText = result.generated_text;
        } else {
            throw new Error("Unexpected API return scheme");
        }

        substeps = aiText.split('\n')
            .map(line => line.replace(/^\d+[\.\-\s]*/, '').trim())
            .filter(line => line.length > 3)
            .map(stepText => ({ text: stepText, completed: false })); // Unified object layout

        if (substeps.length === 0) {
            throw new Error("No items successfully parsed");
        }

        startFocusPhase(true); // Save freshly isolated items

    } catch (error) {
        console.error("AI Generation Error, rolling back to responsive local defaults:", error);
        substeps = [
            { text: "Open up your workspace or look at the target task area.", completed: false },
            { text: "Set a timer for exactly 5 minutes and commit to stopping when it rings.", completed: false },
            { text: "Do the absolute easiest, single smallest physical action to begin.", completed: false }
        ];
        startFocusPhase(true);
    } finally {
        aiBtn.disabled = false;
        loadingMsg.classList.add('hidden');
    }
}

// UI Transition Manager
function startFocusPhase(shouldSaveStorage = true) {
    dumpPhase.classList.add('hidden');
    focusPhase.classList.remove('hidden');
    currentTaskDisplay.innerText = mainTask;
    
    // Lock states into memory instantly
    if (shouldSaveStorage) {
        localStorage.setItem("adhd_main_task", mainTask);
        localStorage.setItem("adhd_substeps", JSON.stringify(substeps));
    }
    
    renderSubsteps();
}

// Consolidated Touch Row Manager (Fixes double-triggering conflicts)
function renderSubsteps() {
    substepsContainer.innerHTML = "";
    
    substeps.forEach((stepObj, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = `step-item ${stepObj.completed ? 'completed' : ''}`;
        
        // Single unified click registration for the entire row surface area
        itemDiv.onclick = () => {
            substeps[index].completed = !substeps[index].completed;
            
            if (substeps[index].completed) {
                playTickSound();
            }
            
            // Sync current list tracking state back to browser memory
            localStorage.setItem("adhd_substeps", JSON.stringify(substeps));
            renderSubsteps();
        };

        const checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        checkbox.className = "step-checkbox";
        checkbox.checked = stepObj.completed;
        checkbox.onclick = (e) => e.preventDefault(); // Terminate default browser double flips

        const label = document.createElement('span');
        label.innerText = stepObj.text; // Explicit safe plaintext assignment (XSS Proof)

        itemDiv.appendChild(checkbox);
        itemDiv.appendChild(label);
        substepsContainer.appendChild(itemDiv);
    });
    
    checkCompletionState();
}

function checkCompletionState() {
    const total = substeps.length;
    const checked = substeps.filter(s => s.completed).length;

    if (total > 0 && checked === total) {
        doneBtn.disabled = false;
        doneBtn.className = "btn-success";
    } else {
        doneBtn.disabled = true;
        doneBtn.className = "btn-secondary";
    }
}

function completeMainTask() {
    playDopamineSound();
    alert("🔥 Mission Complete! Brilliant job hacking through that goal.");
    clearApplicationStorage();
    restartApp();
}

function clearApplicationStorage() {
    localStorage.removeItem("adhd_main_task");
    localStorage.removeItem("adhd_substeps");
}

function restartApp() {
    clearApplicationStorage();
    
    // Clear functional state blocks completely
    mainTask = "";
    substeps = [];
    rawInput.value = "";
    
    focusPhase.classList.add('hidden');
    dumpPhase.classList.remove('hidden');
}

// Audio API Engine Sound Synthesizers
function playTickSound() {
    try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.frequency.setValueAtTime(523.25, context.currentTime); // C5 Tone
        gain.gain.setValueAtTime(0.04, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(context.destination);
        osc.start();
        osc.stop(context.currentTime + 0.05);
    } catch(e) { console.log("Audio node block bypassed"); }
}

function playDopamineSound() {
    try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const osc1 = context.createOscillator();
        const gain1 = context.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(783.99, context.currentTime); // G5
        gain1.gain.setValueAtTime(0.08, context.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.25);
        osc1.connect(gain1);
        gain1.connect(context.destination);
        osc1.start();
        osc1.stop(context.currentTime + 0.25);

        setTimeout(() => {
            const osc2 = context.createOscillator();
            const gain2 = context.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1046.50, context.currentTime); // C6 Resolve
            gain2.gain.setValueAtTime(0.12, context.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.35);
            osc2.connect(gain2);
            gain2.connect(context.destination);
            osc2.start();
            osc2.stop(context.currentTime + 0.35);
        }, 70);
    } catch(e) { console.log("Audio node block bypassed"); }
}