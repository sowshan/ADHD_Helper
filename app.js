// --- Core App State ---
let mainTask = "";
let substeps = [];

// --- Main Function (The one that was "Not Defined") ---
async function getAISubsteps() {
    const rawInput = document.getElementById('raw-input');
    const aiBtn = document.getElementById('ai-btn');
    const loadingMsg = document.getElementById('loading-msg');
    
    const inputData = rawInput.value.trim();
    if (!inputData) {
        alert("Please type your task or thought first!");
        return;
    }

    mainTask = inputData;
    aiBtn.disabled = true;
    loadingMsg.classList.remove('hidden');

    // Simple AI prompt
    const systemPrompt = "Break this task into 3-5 tiny, actionable steps.";

    try {
        // Mocking the AI call for immediate testing
        // Replace this block with your actual fetch() if your API is configured
        console.log("AI is processing:", mainTask);
        
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulating delay

        substeps = [
            { text: "Step 1: Get started on " + mainTask, completed: false },
            { text: "Step 2: Do the next small piece", completed: false },
            { text: "Step 3: Celebrate finishing", completed: false }
        ];

        startFocusPhase(true);
    } catch (error) {
        console.error("AI Error:", error);
    } finally {
        aiBtn.disabled = false;
        loadingMsg.classList.add('hidden');
    }
}

// --- Navigation ---
function startFocusPhase(shouldSave) {
    document.getElementById('dump-phase').classList.add('hidden');
    document.getElementById('focus-phase').classList.remove('hidden');
    document.getElementById('current-task-display').innerText = mainTask;
    renderSubsteps();
}

function renderSubsteps() {
    const container = document.getElementById('substeps-container');
    container.innerHTML = "";
    substeps.forEach((step, index) => {
        const div = document.createElement('div');
        div.className = 'step-item';
        div.innerHTML = `<input type="checkbox"> <span>${step.text}</span>`;
        div.onclick = () => {
            step.completed = !step.completed;
            div.classList.toggle('completed');
        };
        container.appendChild(div);
    });
}
