// tutorial.js

let tutorialOverlay, tutorialHighlight, tutorialModal, tutorialTitle, tutorialText;
let tutorialStepCounter, tutorialDots, tutorialPrev, tutorialNext, tutorialSkip;
let tutorialGhost, tutorialAchievement, tutorialTask, tutorialTaskText, tutorialDemoContainer;
let tutorialMedia, tutorialVideo, tutorialContent;
let componentMenu, sidebar, sidebarTitle, sidebarContent;

let currentTutorialStep = 0;
let tutorialWaitingForAction = false;
let connectionAnimationInterval = null;
let taskPollInterval = null;
let hintTimer = null;
let progressBarFill = null;
let smartHintEl = null;
let skipTaskBtn = null;

const TUTORIAL_PROGRESS_KEY = 'nodecraft-tutorial-progress';
const TUTORIAL_MODE_KEY = 'nodecraft-tutorial-mode';
const TUTORIAL_COMPLETED_KEY = 'nodecraft-tutorial-completed';

let getNodes = () => [];
let getConnections = () => [];
let assignSlotCallback = null;
let activeConfigNodeIdGetter = () => null;
let tutorialMode = 'guided';

const taskState = {
    nodeCountBefore: 0,
    connectionCountBefore: 0
};

const tutorialSteps = [
    {
        id: 'welcome',
        title: 'Welcome to NodeCraft!',
        text: 'You are about to build your first mini-circuit. Choose your tutorial style to begin.',
        highlight: null,
        modalPosition: 'center',
        modePicker: true
    },
    {
        id: 'tab-menu',
        title: 'Component Menu',
        text: 'Press <span class="highlight-key">TAB</span> to open the component menu. It contains logic, memory, math, and utility components.',
        highlight: '#component-menu',
        modalPosition: 'right',
        transparent: true,
        openMenu: true,
        canSkipInFast: false
    },
    {
        id: 'quick-bar',
        title: 'Quick Access Bar',
        text: 'Drag components to the quick bar for fast placement. Slots map to keys <span class="highlight-key">1</span> to <span class="highlight-key">0</span>.',
        highlight: '#quick-access-bar',
        modalPosition: 'above',
        transparent: true,
        openMenu: true,
        showDragAnimation: true,
        canSkipInFast: true
    },
    {
        id: 'place-switch-light',
        title: 'Mission 1: Place Components',
        text: 'I loaded slot <span class="highlight-key">1</span> = Switch and slot <span class="highlight-key">2</span> = Light. Place both on the workspace.',
        highlight: '#workspace',
        modalPosition: 'top-right',
        transparent: true,
        interactive: true,
        task: 'Place a Switch and a Light',
        hint: 'Press 1, click workspace. Then press 2, click workspace.',
        setupAction: 'setupSwitchLightPlacement'
    },
    {
        id: 'connection-demo',
        title: 'Connect Pins',
        text: 'Drag from the Switch output pin (right) to the Light input pin (left).',
        highlight: null,
        modalPosition: 'top-right',
        transparent: true,
        videoUrl: 'assets/videos/connection_demo.mp4',
        showConnectionAnimation: true,
        canSkipInFast: true
    },
    {
        id: 'connect-task',
        title: 'Mission 2: Wire it',
        text: 'Create one valid wire connection between placed nodes.',
        highlight: '#workspace',
        modalPosition: 'top-right',
        transparent: true,
        interactive: true,
        task: 'Create 1 wire connection',
        hint: 'Output pin is on the right side, input pin is on the left side.',
        setupAction: 'setupConnectionTask'
    },
    {
        id: 'toggle-task',
        title: 'Mission 3: Run Signal',
        text: 'Toggle your Switch to send signal through the wire and light up output.',
        highlight: '#workspace',
        modalPosition: 'top-right',
        transparent: true,
        interactive: true,
        task: 'Toggle any Switch ON',
        hint: 'Click the switch control on the Switch node.',
        setupAction: 'setupToggleTask'
    },
    {
        id: 'config-task',
        title: 'Mission 4: Open Configuration',
        text: 'Open node settings by clicking a gear icon or double-clicking a configurable node.',
        highlight: '#config-sidebar',
        modalPosition: 'left',
        transparent: true,
        interactive: true,
        task: 'Open the configuration sidebar',
        hint: 'Try double-clicking a node like Switch/Light.',
        setupAction: 'setupOpenConfigTask'
    },
    {
        id: 'finish',
        title: 'You are Ready!',
        text: 'Great work. You can now build, simulate, and save circuits with confidence. Have fun building! ⚡',
        highlight: '#top-bar',
        modalPosition: 'below',
        transparent: true
    }
];

function currentStep() {
    return tutorialSteps[currentTutorialStep];
}

function setProgress(stepIndex) {
    localStorage.setItem(TUTORIAL_PROGRESS_KEY, String(stepIndex));
    localStorage.setItem(TUTORIAL_MODE_KEY, tutorialMode);
}

function getSavedProgress() {
    const completed = localStorage.getItem(TUTORIAL_COMPLETED_KEY) === 'true';
    const mode = localStorage.getItem(TUTORIAL_MODE_KEY) || 'guided';
    const rawStep = parseInt(localStorage.getItem(TUTORIAL_PROGRESS_KEY) || '0', 10);
    const step = Number.isNaN(rawStep) ? 0 : Math.max(0, Math.min(rawStep, tutorialSteps.length - 1));
    return { completed, mode, step };
}

function getNextStepIndex(fromIndex) {
    let idx = fromIndex + 1;
    if (tutorialMode !== 'fast') return idx;
    while (idx < tutorialSteps.length && tutorialSteps[idx].canSkipInFast) {
        idx += 1;
    }
    return idx;
}

function getPrevStepIndex(fromIndex) {
    let idx = fromIndex - 1;
    if (tutorialMode !== 'fast') return idx;
    while (idx >= 0 && tutorialSteps[idx].canSkipInFast) {
        idx -= 1;
    }
    return idx;
}

function injectEnhancements() {
    tutorialContent = tutorialModal.querySelector('.tutorial-content');
    if (!tutorialContent) return;

    if (!progressBarFill) {
        const header = tutorialModal.querySelector('.tutorial-header');
        const track = document.createElement('div');
        track.className = 'tutorial-progress-track';
        const fill = document.createElement('div');
        fill.className = 'tutorial-progress-fill';
        track.appendChild(fill);
        header.appendChild(track);
        progressBarFill = fill;
    }

    if (!smartHintEl) {
        smartHintEl = document.createElement('div');
        smartHintEl.className = 'tutorial-smart-hint hidden';
        smartHintEl.innerHTML = '<span class="hint-badge">Hint</span><span class="hint-text"></span>';
        tutorialOverlay.appendChild(smartHintEl);
    }

    if (!skipTaskBtn) {
        skipTaskBtn = document.createElement('button');
        skipTaskBtn.className = 'tutorial-skip-task-btn';
        skipTaskBtn.innerText = 'Skip this task';
        skipTaskBtn.addEventListener('click', () => {
            if (!tutorialWaitingForAction) return;
            completeTutorialTask(true);
        });
        tutorialTask.appendChild(skipTaskBtn);
    }
}

export function initTutorial(getNodesFunc, assignSlotCb, activeConfigIdGetter, getConnectionsFunc) {
    getNodes = getNodesFunc || (() => []);
    getConnections = getConnectionsFunc || (() => []);
    assignSlotCallback = assignSlotCb;
    activeConfigNodeIdGetter = activeConfigIdGetter || (() => null);

    tutorialOverlay = document.getElementById('tutorial-overlay');
    tutorialHighlight = document.getElementById('tutorial-highlight');
    tutorialModal = document.getElementById('tutorial-modal');
    tutorialTitle = document.getElementById('tutorial-title');
    tutorialText = document.getElementById('tutorial-text');
    tutorialStepCounter = document.getElementById('tutorial-step-counter');
    tutorialDots = document.getElementById('tutorial-dots');
    tutorialPrev = document.getElementById('tutorial-prev');
    tutorialNext = document.getElementById('tutorial-next');
    tutorialSkip = document.getElementById('tutorial-skip');
    tutorialGhost = document.getElementById('tutorial-ghost');
    tutorialAchievement = document.getElementById('tutorial-achievement');
    tutorialTask = document.getElementById('tutorial-task');
    tutorialTaskText = document.getElementById('tutorial-task-text');
    tutorialDemoContainer = document.getElementById('tutorial-demo-container');
    tutorialMedia = document.getElementById('tutorial-media');
    tutorialVideo = document.getElementById('tutorial-video');

    componentMenu = document.getElementById('component-menu');
    sidebar = document.getElementById('config-sidebar');
    sidebarTitle = document.getElementById('sidebar-title');
    sidebarContent = document.getElementById('sidebar-content');

    injectEnhancements();

    tutorialPrev.addEventListener('click', () => {
        if (tutorialWaitingForAction) return;
        const prev = getPrevStepIndex(currentTutorialStep);
        if (prev >= 0) showStep(prev);
    });

    tutorialNext.addEventListener('click', () => {
        if (tutorialWaitingForAction) return;
        const next = getNextStepIndex(currentTutorialStep);
        if (next < tutorialSteps.length) showStep(next);
        else endTutorial();
    });

    tutorialSkip.addEventListener('click', endTutorial);

    window.addEventListener('resize', () => {
        const step = currentStep();
        if (step) positionModalForStep(step);
    });

    // Demo behavior requested: always reset tutorial state on page reload.
    localStorage.removeItem(TUTORIAL_PROGRESS_KEY);
    localStorage.removeItem(TUTORIAL_MODE_KEY);
    localStorage.removeItem(TUTORIAL_COMPLETED_KEY);
    tutorialMode = 'guided';
    startTutorial(0);
}

export function startTutorial(startAt = 0) {
    currentTutorialStep = startAt;
    tutorialOverlay.classList.remove('hidden');
    generateDots();
    showStep(currentTutorialStep);
}

function resetTransientState() {
    tutorialOverlay.classList.remove('interactive', 'transparent');
    tutorialHighlight.classList.remove('no-shadow');
    tutorialGhost.classList.remove('animating');
    tutorialTask.style.display = 'none';
    tutorialTask.classList.remove('completed', 'waiting');
    tutorialDemoContainer.style.display = 'none';
    tutorialMedia.classList.add('hidden');
    tutorialVideo.pause();
    tutorialWaitingForAction = false;
    tutorialNext.classList.remove('waiting');

    if (smartHintEl) {
        smartHintEl.classList.add('hidden');
    }

    if (connectionAnimationInterval) {
        clearInterval(connectionAnimationInterval);
        connectionAnimationInterval = null;
    }
    if (taskPollInterval) {
        clearInterval(taskPollInterval);
        taskPollInterval = null;
    }
    if (hintTimer) {
        clearTimeout(hintTimer);
        hintTimer = null;
    }
}

function endTutorial() {
    resetTransientState();
    tutorialOverlay.classList.add('hidden');
    tutorialAchievement.classList.remove('show');

    if (!componentMenu.classList.contains('hidden')) {
        componentMenu.classList.add('hidden');
    }

    localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
    localStorage.setItem(TUTORIAL_PROGRESS_KEY, String(tutorialSteps.length - 1));
    localStorage.setItem(TUTORIAL_MODE_KEY, tutorialMode);

    if (!activeConfigNodeIdGetter()) {
        sidebar.classList.add('hidden');
    }
}

function generateDots() {
    tutorialDots.innerHTML = '';
    tutorialSteps.forEach((step, index) => {
        const dot = document.createElement('div');
        dot.className = 'tutorial-dot';
        dot.addEventListener('click', () => {
            if (tutorialWaitingForAction) return;
            if (tutorialMode === 'fast' && step.canSkipInFast) return;
            showStep(index);
        });
        tutorialDots.appendChild(dot);
    });
}

function updateDots() {
    const dots = tutorialDots.querySelectorAll('.tutorial-dot');
    dots.forEach((dot, index) => {
        dot.classList.remove('active', 'completed', 'skipped');
        if (index === currentTutorialStep) dot.classList.add('active');
        else if (index < currentTutorialStep) {
            if (tutorialMode === 'fast' && tutorialSteps[index].canSkipInFast) dot.classList.add('skipped');
            else dot.classList.add('completed');
        }
    });
}

function updateProgressBar() {
    if (!progressBarFill) return;
    const ratio = (currentTutorialStep + 1) / tutorialSteps.length;
    progressBarFill.style.width = `${Math.max(4, ratio * 100)}%`;
}

function showModePicker() {
    const wrapper = document.createElement('div');
    wrapper.className = 'tutorial-mode-picker';

    const guidedBtn = document.createElement('button');
    guidedBtn.className = 'tutorial-mode-btn guided';
    guidedBtn.innerHTML = '<span class="mode-title">Guided</span><span class="mode-sub">Full walkthrough with demos</span>';

    const fastBtn = document.createElement('button');
    fastBtn.className = 'tutorial-mode-btn fast';
    fastBtn.innerHTML = '<span class="mode-title">Fast-track</span><span class="mode-sub">Interactive missions only</span>';

    guidedBtn.addEventListener('click', () => {
        tutorialMode = 'guided';
        localStorage.setItem(TUTORIAL_MODE_KEY, tutorialMode);
        const next = getNextStepIndex(currentTutorialStep);
        if (next < tutorialSteps.length) showStep(next);
    });

    fastBtn.addEventListener('click', () => {
        tutorialMode = 'fast';
        localStorage.setItem(TUTORIAL_MODE_KEY, tutorialMode);
        const next = getNextStepIndex(currentTutorialStep);
        if (next < tutorialSteps.length) showStep(next);
    });

    wrapper.appendChild(guidedBtn);
    wrapper.appendChild(fastBtn);
    tutorialContent.appendChild(wrapper);
    tutorialNext.disabled = true;
}

function showStep(stepIndex) {
    currentTutorialStep = stepIndex;
    const step = tutorialSteps[stepIndex];
    resetTransientState();

    if (step.transparent) {
        tutorialOverlay.classList.add('transparent');
        tutorialHighlight.classList.add('no-shadow');
    }

    if (step.openMenu) {
        componentMenu.classList.remove('hidden');
        componentMenu.style.display = 'flex';
    } else if (!componentMenu.classList.contains('hidden')) {
        componentMenu.classList.add('hidden');
    }

    tutorialTitle.innerText = step.title;
    tutorialText.innerHTML = step.text;
    tutorialStepCounter.innerText = `Step ${stepIndex + 1} of ${tutorialSteps.length}`;
    updateDots();
    updateProgressBar();

    tutorialContent.querySelectorAll('.tutorial-mode-picker').forEach(el => el.remove());

    tutorialPrev.disabled = stepIndex === 0;
    tutorialNext.disabled = false;
    tutorialNext.innerText = stepIndex === tutorialSteps.length - 1 ? 'Finish' : 'Next';

    if (step.modePicker) {
        showModePicker();
    }

    if (step.showSidebar) {
        sidebar.classList.remove('hidden');
        sidebarTitle.innerText = 'Example Config';
        sidebarContent.innerHTML = '<p style="color: #bdc3c7; font-size: 13px;">Configure gate parameters here when you select a configurable gate.</p>';
    } else if (!activeConfigNodeIdGetter()) {
        sidebar.classList.add('hidden');
    }

    if (step.showDragAnimation) startDragAnimationFromMenu();
    if (step.videoUrl) {
        tutorialMedia.classList.remove('hidden');
        tutorialVideo.onerror = () => {
            tutorialMedia.classList.add('hidden');
            if (step.showConnectionAnimation) {
                startConnectionAnimation();
            }
        };
        tutorialVideo.src = step.videoUrl;
        tutorialVideo.load();
        tutorialVideo.play().catch(() => null);
    } else if (step.showConnectionAnimation) {
        startConnectionAnimation();
    }

    if (step.interactive) setupInteractiveStep(step);

    if (step.showSidebar) setTimeout(() => positionModalForStep(step), 250);
    else positionModalForStep(step);

    setProgress(stepIndex);
}

function positionModalForStep(step) {
    const padding = 20;

    tutorialModal.style.left = '';
    tutorialModal.style.right = '';
    tutorialModal.style.top = '';
    tutorialModal.style.bottom = '';
    tutorialModal.style.transform = '';

    if (step.highlight) {
        const targetEl = document.querySelector(step.highlight);
        if (targetEl) {
            const rect = targetEl.getBoundingClientRect();
            tutorialHighlight.classList.remove('hidden');
            tutorialHighlight.style.left = `${rect.left - 5}px`;
            tutorialHighlight.style.top = `${rect.top - 5}px`;
            tutorialHighlight.style.width = `${rect.width + 10}px`;
            tutorialHighlight.style.height = `${rect.height + 10}px`;
        } else {
            tutorialHighlight.classList.add('hidden');
        }
    } else {
        tutorialHighlight.classList.add('hidden');
    }

    switch (step.modalPosition) {
        case 'top-right':
            tutorialModal.style.top = `${60 + padding}px`;
            tutorialModal.style.right = `${padding}px`;
            break;
        case 'top-left':
            tutorialModal.style.top = `${60 + padding}px`;
            tutorialModal.style.left = `${padding}px`;
            break;
        case 'bottom-right':
            tutorialModal.style.bottom = `${100 + padding}px`;
            tutorialModal.style.right = `${padding}px`;
            break;
        case 'above': {
            const targetEl = step.highlight ? document.querySelector(step.highlight) : null;
            if (targetEl) {
                const rect = targetEl.getBoundingClientRect();
                tutorialModal.style.left = `${Math.max(padding, rect.left + rect.width / 2 - 200)}px`;
                tutorialModal.style.bottom = `${window.innerHeight - rect.top + padding}px`;
            }
            break;
        }
        case 'below': {
            const targetEl = step.highlight ? document.querySelector(step.highlight) : null;
            if (targetEl) {
                const rect = targetEl.getBoundingClientRect();
                tutorialModal.style.left = `${Math.max(padding, rect.left + rect.width / 2 - 200)}px`;
                tutorialModal.style.top = `${rect.bottom + padding}px`;
            }
            break;
        }
        case 'left': {
            const targetEl = step.highlight ? document.querySelector(step.highlight) : null;
            if (targetEl) {
                const rect = targetEl.getBoundingClientRect();
                const modalWidth = 420;
                const spaceOnLeft = rect.left - padding * 2;
                if (spaceOnLeft >= modalWidth) {
                    tutorialModal.style.right = `${window.innerWidth - rect.left + padding}px`;
                    tutorialModal.style.top = `${Math.max(padding + 60, rect.top)}px`;
                } else {
                    tutorialModal.style.left = `${padding}px`;
                    tutorialModal.style.top = `${Math.max(padding + 60, Math.min(rect.top, window.innerHeight / 2 - 150))}px`;
                }
            } else {
                tutorialModal.style.left = `${padding}px`;
                tutorialModal.style.top = '50%';
                tutorialModal.style.transform = 'translateY(-50%)';
            }
            break;
        }
        case 'right': {
            const targetEl = step.highlight ? document.querySelector(step.highlight) : null;
            if (targetEl) {
                const rect = targetEl.getBoundingClientRect();
                tutorialModal.style.left = `${rect.right + padding}px`;
                tutorialModal.style.top = `${Math.max(padding + 60, rect.top)}px`;
            } else {
                tutorialModal.style.right = `${padding}px`;
                tutorialModal.style.top = '50%';
                tutorialModal.style.transform = 'translateY(-50%)';
            }
            break;
        }
        case 'center':
        default:
            tutorialModal.style.left = '50%';
            tutorialModal.style.top = '50%';
            tutorialModal.style.transform = 'translate(-50%, -50%)';
            break;
    }

    requestAnimationFrame(() => {
        const modalRect = tutorialModal.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        if (step.modalPosition === 'center') return;

        let needsRepositioning = false;
        let newLeft = modalRect.left;
        let newTop = modalRect.top;

        if (modalRect.right > viewportWidth - padding) {
            newLeft = viewportWidth - modalRect.width - padding;
            needsRepositioning = true;
        }
        if (modalRect.left < padding) {
            newLeft = padding;
            needsRepositioning = true;
        }
        if (modalRect.bottom > viewportHeight - padding) {
            newTop = viewportHeight - modalRect.height - padding;
            needsRepositioning = true;
        }
        const minTop = 60 + padding;
        if (modalRect.top < minTop) {
            newTop = minTop;
            needsRepositioning = true;
        }

        if (needsRepositioning) {
            tutorialModal.style.right = '';
            tutorialModal.style.bottom = '';
            tutorialModal.style.transform = '';
            tutorialModal.style.left = `${Math.max(padding, newLeft)}px`;
            tutorialModal.style.top = `${Math.max(minTop, newTop)}px`;
        }

        if (smartHintEl && !smartHintEl.classList.contains('hidden')) {
            smartHintEl.style.left = `${tutorialModal.getBoundingClientRect().left}px`;
            smartHintEl.style.top = `${tutorialModal.getBoundingClientRect().bottom + 8}px`;
        }
    });
}

function startDragAnimationFromMenu() {
    const menuItem = document.querySelector('.menu-item[data-type="AND"]');
    const firstSlot = document.querySelector('.qa-slot[data-slot="1"]');
    if (!menuItem || !firstSlot) return;

    const menuRect = menuItem.getBoundingClientRect();
    const slotRect = firstSlot.getBoundingClientRect();
    const dragX = slotRect.left - menuRect.left + slotRect.width / 2 - menuRect.width / 2;
    const dragY = slotRect.top - menuRect.top;

    tutorialGhost.style.left = `${menuRect.left + menuRect.width / 2 - 30}px`;
    tutorialGhost.style.top = `${menuRect.top + menuRect.height / 2 - 30}px`;
    tutorialGhost.style.setProperty('--drag-x', `${dragX}px`);
    tutorialGhost.style.setProperty('--drag-y', `${dragY}px`);
    tutorialGhost.classList.add('animating');
}

function startConnectionAnimation() {
    const demoContainer = tutorialDemoContainer;
    const node1 = document.getElementById('demo-node-1');
    const node2 = document.getElementById('demo-node-2');
    const wireEl = document.getElementById('demo-wire');
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    node1.style.left = `${centerX - 180}px`;
    node1.style.top = `${centerY - 35}px`;
    node2.style.left = `${centerX + 80}px`;
    node2.style.top = `${centerY - 35}px`;
    demoContainer.style.display = 'block';

    const animateWire = () => {
        const pin1 = node1.querySelector('.demo-pin.output');
        const pin2 = node2.querySelector('.demo-pin.input');
        const r1 = pin1.getBoundingClientRect();
        const r2 = pin2.getBoundingClientRect();
        const x1 = r1.left + r1.width / 2;
        const y1 = r1.top + r1.height / 2;
        const x2 = r2.left + r2.width / 2;
        const y2 = r2.top + r2.height / 2;
        const dist = Math.abs(x2 - x1) * 0.4;
        const d = `M ${x1} ${y1} C ${x1 + dist} ${y1}, ${x2 - dist} ${y2}, ${x2} ${y2}`;

        wireEl.style.left = '0';
        wireEl.style.top = '0';
        wireEl.style.width = '100vw';
        wireEl.style.height = '100vh';

        const path = wireEl.querySelector('path');
        path.classList.remove('flowing');
        path.setAttribute('d', d);
        path.style.animation = 'none';
        path.offsetHeight;
        path.style.animation = 'draw-wire 1s ease-out forwards';
        setTimeout(() => path.classList.add('flowing'), 900);
    };

    animateWire();
    connectionAnimationInterval = setInterval(animateWire, 2800);
}

function showSmartHint(text) {
    if (!smartHintEl || !text) return;
    const hintText = smartHintEl.querySelector('.hint-text');
    hintText.innerText = text;
    const modalRect = tutorialModal.getBoundingClientRect();
    smartHintEl.style.left = `${modalRect.left}px`;
    smartHintEl.style.top = `${modalRect.bottom + 8}px`;
    smartHintEl.classList.remove('hidden');
}

function setupInteractiveStep(step) {
    tutorialWaitingForAction = true;
    tutorialOverlay.classList.add('interactive');
    tutorialNext.classList.add('waiting');
    tutorialTask.style.display = 'flex';
    tutorialTask.classList.remove('completed');
    tutorialTask.classList.add('waiting');
    tutorialTaskText.innerText = step.task;

    if (step.setupAction === 'setupSwitchLightPlacement') {
        const slot1 = document.querySelector('.qa-slot[data-slot="1"]');
        const slot2 = document.querySelector('.qa-slot[data-slot="2"]');
        if (slot1 && assignSlotCallback) assignSlotCallback(slot1, 'Switch');
        if (slot2 && assignSlotCallback) assignSlotCallback(slot2, 'Light');
        taskState.nodeCountBefore = getNodes().length;
        taskState.connectionCountBefore = getConnections().length;
    }

    if (step.setupAction === 'setupConnectionTask') {
        taskState.connectionCountBefore = getConnections().length;
    }

    if (step.setupAction === 'setupToggleTask') {
        // No baseline needed; check for any switch on-state.
    }

    if (step.setupAction === 'setupOpenConfigTask') {
        sidebar.classList.add('hidden');
    }

    taskPollInterval = setInterval(checkTutorialTaskCompletion, 250);
    hintTimer = setTimeout(() => showSmartHint(step.hint), 7000);
}

function evaluateTask(step) {
    if (!step || !step.setupAction) return false;

    if (step.setupAction === 'setupSwitchLightPlacement') {
        const nodes = getNodes();
        const hasSwitch = nodes.some(n => n.type === 'Switch');
        const hasLight = nodes.some(n => n.type === 'Light');
        return hasSwitch && hasLight && nodes.length >= taskState.nodeCountBefore + 2;
    }

    if (step.setupAction === 'setupConnectionTask') {
        return getConnections().length > taskState.connectionCountBefore;
    }

    if (step.setupAction === 'setupToggleTask') {
        return !!document.querySelector('.node .toggle-switch.on');
    }

    if (step.setupAction === 'setupOpenConfigTask') {
        return !!activeConfigNodeIdGetter();
    }

    return false;
}

export function checkTutorialTaskCompletion() {
    if (!tutorialWaitingForAction) return;
    if (evaluateTask(currentStep())) {
        completeTutorialTask(false);
    }
}

function completeTutorialTask(skipped) {
    tutorialWaitingForAction = false;
    tutorialOverlay.classList.remove('interactive');
    tutorialNext.classList.remove('waiting');
    tutorialTask.classList.remove('waiting');
    tutorialTask.classList.add('completed');
    tutorialTaskText.innerText = skipped ? 'Task skipped.' : 'Task completed!';

    if (taskPollInterval) {
        clearInterval(taskPollInterval);
        taskPollInterval = null;
    }
    if (hintTimer) {
        clearTimeout(hintTimer);
        hintTimer = null;
    }
    if (smartHintEl) smartHintEl.classList.add('hidden');

    if (!skipped) {
        showAchievement();
    } else {
        setTimeout(() => {
            const next = getNextStepIndex(currentTutorialStep);
            if (next < tutorialSteps.length) showStep(next);
            else endTutorial();
        }, 400);
    }
}

function showAchievement() {
    createConfetti();
    tutorialAchievement.classList.add('show');
    setTimeout(() => {
        tutorialAchievement.classList.remove('show');
        setTimeout(() => {
            const next = getNextStepIndex(currentTutorialStep);
            if (next < tutorialSteps.length) showStep(next);
            else endTutorial();
        }, 250);
    }, 1300);
}

function createConfetti() {
    const colors = ['#4da9d1', '#bf7a56', '#2ecc71', '#e74c3c', '#f1c40f', '#7bc8ea'];
    const confettiCount = 32;
    for (let i = 0; i < confettiCount; i += 1) {
        const confetti = document.createElement('div');
        confetti.className = `confetti ${Math.random() > 0.5 ? 'square' : 'circle'}`;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = `${50 + (Math.random() - 0.5) * 40}%`;
        confetti.style.top = '40%';
        confetti.style.animation = `confetti-fall ${1 + Math.random()}s ease-out forwards`;
        confetti.style.animationDelay = `${Math.random() * 0.25}s`;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 2200);
    }
}
