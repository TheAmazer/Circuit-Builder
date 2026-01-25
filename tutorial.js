// tutorial.js

let tutorialOverlay, tutorialHighlight, tutorialModal, tutorialTitle, tutorialText;
let tutorialStepCounter, tutorialDots, tutorialPrev, tutorialNext, tutorialSkip;
let tutorialGhost, tutorialAchievement, tutorialTask, tutorialTaskText, tutorialDemoContainer;
let tutorialMedia, tutorialVideo;
let componentMenu, sidebar, sidebarTitle, sidebarContent;

let currentTutorialStep = 0;
let tutorialWaitingForAction = false;
let tutorialNodeCountBefore = 0;
let connectionAnimationInterval = null;
const TUTORIAL_STORAGE_KEY = 'circuit-builder-tutorial-seen';
let getNodes = null;

let assignSlotCallback = null;
let activeConfigNodeIdGetter = null;

const tutorialSteps = [
    {
        title: "Welcome to Logic Gate Circuit Builder!",
        text: "This is an interactive visual circuit designer where you can build and simulate logic circuits. Let's take a quick tour of the interface!",
        highlight: null,
        modalPosition: 'center'
    },
    {
        title: "Opening the Component Menu",
        text: 'Press <span class="highlight-key">TAB</span> on your keyboard to open the full component menu. Here you can browse all available gates, memory components, and math operations.',
        highlight: '#component-menu',
        modalPosition: 'right',
        transparent: true,
        openMenu: true
    },
    {
        title: "Quick Access Bar",
        text: 'Drag components from the menu to the <span class="highlight-text">Quick Access Bar</span> below for quick placement. Use the <span class="highlight-key">1</span> - <span class="highlight-key">0</span> keys to instantly select!',
        highlight: '#quick-access-bar',
        modalPosition: 'above',
        transparent: true,
        openMenu: true,
        showDragAnimation: true
    },
    {
        title: "Try It: Place a Gate!",
        text: 'I have added an <span class="highlight-text">AND gate</span> to slot 1. Press <span class="highlight-key">1</span>, then <span class="highlight-text">click on the workspace</span> to place it.',
        highlight: null,
        modalPosition: 'top-right',
        transparent: true,
        interactive: true,
        task: "Press 1, then click on the workspace to place a gate",
        setupAction: 'setupPlacementTask'
    },
    {
        title: "Navigation and Canvas",
        text: 'The workspace is an <span class="highlight-text">infinite canvas</span>! Hold <span class="highlight-key">Middle Mouse Button</span> and drag to pan around. You can also drag-select multiple gates.',
        highlight: null,
        modalPosition: 'top-right',
        transparent: true
    },
    {
        title: "Making Connections",
        text: 'To wire gates together, <span class="highlight-text">click and drag</span> from an output pin (right) to an input pin (left). Watch the demo!',
        highlight: null,
        modalPosition: 'top-right',
        transparent: true,
        videoUrl: 'connection_demo.mp4'
    },
    {
        title: "Configuring Gates",
        text: 'Some gates like <span class="highlight-text">Lever</span>, <span class="highlight-text">Threshold</span>, <span class="highlight-text">Function</span>, and <span class="highlight-text">Memory Register</span> have settings. Click the <span class="highlight-text">gear icon</span> to configure.',
        highlight: '#config-sidebar',
        modalPosition: 'left',
        showSidebar: true,
        transparent: true
    },
    {
        title: "You are Ready!",
        text: 'That is everything! Use <span class="highlight-key">Save</span>/<span class="highlight-key">Load</span> buttons for your circuits. Press <span class="highlight-key">Delete</span> to remove gates. Have fun building!',
        highlight: '#top-bar',
        modalPosition: 'below',
        transparent: true
    }
];

export function initTutorial(getNodesFunc, assignSlotCb, activeConfigIdGetter) {
    getNodes = getNodesFunc;
    assignSlotCallback = assignSlotCb;
    activeConfigNodeIdGetter = activeConfigIdGetter;

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

    tutorialPrev.addEventListener('click', function () {
        if (!tutorialWaitingForAction && currentTutorialStep > 0) {
            showStep(currentTutorialStep - 1);
        }
    });

    tutorialNext.addEventListener('click', function () {
        if (tutorialWaitingForAction) return;

        if (currentTutorialStep < tutorialSteps.length - 1) {
            showStep(currentTutorialStep + 1);
        } else {
            endTutorial();
        }
    });

    tutorialSkip.addEventListener('click', function () {
        endTutorial();
    });

    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    startTutorial();
}

export function startTutorial() {
    currentTutorialStep = 0;
    tutorialOverlay.classList.remove('hidden');
    generateDots();
    showStep(0);
}

function endTutorial() {
    tutorialOverlay.classList.add('hidden');
    tutorialOverlay.classList.remove('interactive', 'transparent');
    tutorialHighlight.classList.remove('no-shadow');
    tutorialGhost.classList.remove('animating');
    tutorialTask.style.display = 'none';
    tutorialAchievement.classList.remove('show');
    tutorialDemoContainer.style.display = 'none';
    tutorialMedia.classList.add('hidden');
    tutorialVideo.pause();
    tutorialWaitingForAction = false;
    tutorialNext.classList.remove('waiting');

    if (!componentMenu.classList.contains('hidden')) {
        componentMenu.classList.add('hidden');
    }

    if (connectionAnimationInterval) {
        clearInterval(connectionAnimationInterval);
        connectionAnimationInterval = null;
    }

    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');

    if (!activeConfigNodeIdGetter()) {
        sidebar.classList.add('hidden');
    }
}

function generateDots() {
    tutorialDots.innerHTML = '';
    tutorialSteps.forEach(function (step, index) {
        var dot = document.createElement('div');
        dot.className = 'tutorial-dot';
        dot.addEventListener('click', function () {
            if (!tutorialWaitingForAction) {
                showStep(index);
            }
        });
        tutorialDots.appendChild(dot);
    });
}

function updateDots() {
    var dots = tutorialDots.querySelectorAll('.tutorial-dot');
    dots.forEach(function (dot, index) {
        dot.classList.remove('active', 'completed');
        if (index === currentTutorialStep) {
            dot.classList.add('active');
        } else if (index < currentTutorialStep) {
            dot.classList.add('completed');
        }
    });
}

function showStep(stepIndex) {
    currentTutorialStep = stepIndex;
    var step = tutorialSteps[stepIndex];

    tutorialOverlay.classList.remove('interactive', 'transparent');
    tutorialHighlight.classList.remove('no-shadow');
    tutorialGhost.classList.remove('animating');
    tutorialTask.style.display = 'none';
    tutorialDemoContainer.style.display = 'none';
    tutorialMedia.classList.add('hidden');
    tutorialVideo.pause();
    tutorialWaitingForAction = false;
    tutorialNext.classList.remove('waiting');

    if (connectionAnimationInterval) {
        clearInterval(connectionAnimationInterval);
        connectionAnimationInterval = null;
    }

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
    tutorialStepCounter.innerText = 'Step ' + (stepIndex + 1) + ' of ' + tutorialSteps.length;
    updateDots();

    tutorialPrev.disabled = stepIndex === 0;
    tutorialNext.innerText = stepIndex === tutorialSteps.length - 1 ? 'Finish' : 'Next';

    if (step.showSidebar) {
        sidebar.classList.remove('hidden');
        sidebarTitle.innerText = 'Example Config';
        sidebarContent.innerHTML = '<p style="color: #bdc3c7; font-size: 13px;">Configure gate parameters here when you select a configurable gate.</p>';
    } else if (!activeConfigNodeIdGetter()) {
        sidebar.classList.add('hidden');
    }

    if (step.showDragAnimation) {
        startDragAnimationFromMenu();
    }

    if (step.showConnectionAnimation) {
        startConnectionAnimation();
    }

    if (step.videoUrl) {
        tutorialMedia.classList.remove('hidden');
        tutorialVideo.src = step.videoUrl;
        tutorialVideo.play().catch(e => console.log('Autoplay failed', e));
    }

    if (step.interactive) {
        setupInteractiveStep(step);
    }

    if (step.showSidebar) {
        setTimeout(function () { positionModalForStep(step); }, 350);
    } else {
        positionModalForStep(step);
    }
}

function positionModalForStep(step) {
    var padding = 20;

    tutorialModal.style.left = '';
    tutorialModal.style.right = '';
    tutorialModal.style.top = '';
    tutorialModal.style.bottom = '';
    tutorialModal.style.transform = '';

    if (step.highlight) {
        var targetEl = document.querySelector(step.highlight);
        if (targetEl) {
            var rect = targetEl.getBoundingClientRect();
            tutorialHighlight.classList.remove('hidden');
            tutorialHighlight.style.left = (rect.left - 5) + 'px';
            tutorialHighlight.style.top = (rect.top - 5) + 'px';
            tutorialHighlight.style.width = (rect.width + 10) + 'px';
            tutorialHighlight.style.height = (rect.height + 10) + 'px';
        } else {
            tutorialHighlight.classList.add('hidden');
        }
    } else {
        tutorialHighlight.classList.add('hidden');
    }

    switch (step.modalPosition) {
        case 'top-right':
            tutorialModal.style.top = (60 + padding) + 'px';
            tutorialModal.style.right = padding + 'px';
            break;
        case 'top-left':
            tutorialModal.style.top = (60 + padding) + 'px';
            tutorialModal.style.left = padding + 'px';
            break;
        case 'bottom-right':
            tutorialModal.style.bottom = (100 + padding) + 'px';
            tutorialModal.style.right = padding + 'px';
            break;
        case 'above':
            if (step.highlight) {
                var targetEl = document.querySelector(step.highlight);
                if (targetEl) {
                    var rect = targetEl.getBoundingClientRect();
                    tutorialModal.style.left = Math.max(padding, rect.left + rect.width / 2 - 200) + 'px';
                    tutorialModal.style.bottom = (window.innerHeight - rect.top + padding) + 'px';
                }
            }
            break;
        case 'below':
            if (step.highlight) {
                var targetEl = document.querySelector(step.highlight);
                if (targetEl) {
                    var rect = targetEl.getBoundingClientRect();
                    tutorialModal.style.left = Math.max(padding, rect.left + rect.width / 2 - 200) + 'px';
                    tutorialModal.style.top = (rect.bottom + padding) + 'px';
                }
            }
            break;
        case 'left':
            if (step.highlight) {
                var targetEl = document.querySelector(step.highlight);
                if (targetEl) {
                    var rect = targetEl.getBoundingClientRect();
                    var modalWidth = 400;
                    var spaceOnLeft = rect.left - padding * 2;
                    if (spaceOnLeft >= modalWidth) {
                        tutorialModal.style.right = (window.innerWidth - rect.left + padding) + 'px';
                        tutorialModal.style.top = Math.max(padding + 60, rect.top) + 'px';
                    } else {
                        tutorialModal.style.left = padding + 'px';
                        tutorialModal.style.top = Math.max(padding + 60, Math.min(rect.top, window.innerHeight / 2 - 150)) + 'px';
                    }
                }
            } else {
                tutorialModal.style.left = padding + 'px';
                tutorialModal.style.top = '50%';
                tutorialModal.style.transform = 'translateY(-50%)';
            }
            break;
        case 'right':
            if (step.highlight) {
                var targetEl = document.querySelector(step.highlight);
                if (targetEl) {
                    var rect = targetEl.getBoundingClientRect();
                    tutorialModal.style.left = (rect.right + padding) + 'px';
                    tutorialModal.style.top = Math.max(padding + 60, rect.top) + 'px';
                }
            } else {
                tutorialModal.style.right = padding + 'px';
                tutorialModal.style.top = '50%';
                tutorialModal.style.transform = 'translateY(-50%)';
            }
            break;
        case 'center':
        default:
            tutorialModal.style.left = '50%';
            tutorialModal.style.top = '50%';
            tutorialModal.style.transform = 'translate(-50%, -50%)';
            break;
    }

    requestAnimationFrame(function () {
        var modalRect = tutorialModal.getBoundingClientRect();
        var viewportWidth = window.innerWidth;
        var viewportHeight = window.innerHeight;
        if (step.modalPosition === 'center') return;
        var needsRepositioning = false;
        var newLeft = modalRect.left;
        var newTop = modalRect.top;
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
        var minTop = 60 + padding;
        if (modalRect.top < minTop) {
            newTop = minTop;
            needsRepositioning = true;
        }
        if (needsRepositioning) {
            tutorialModal.style.right = '';
            tutorialModal.style.bottom = '';
            tutorialModal.style.transform = '';
            tutorialModal.style.left = Math.max(padding, newLeft) + 'px';
            tutorialModal.style.top = Math.max(minTop, newTop) + 'px';
        }
    });
}

function startDragAnimationFromMenu() {
    var menuItem = document.querySelector('.menu-item[data-type="AND"]');
    var firstSlot = document.querySelector('.qa-slot[data-slot="1"]');
    if (menuItem && firstSlot) {
        var menuRect = menuItem.getBoundingClientRect();
        var slotRect = firstSlot.getBoundingClientRect();
        var dragX = slotRect.left - menuRect.left + slotRect.width / 2 - menuRect.width / 2;
        var dragY = slotRect.top - menuRect.top;
        tutorialGhost.style.left = (menuRect.left + menuRect.width / 2 - 30) + 'px';
        tutorialGhost.style.top = (menuRect.top + menuRect.height / 2 - 30) + 'px';
        tutorialGhost.style.setProperty('--drag-x', dragX + 'px');
        tutorialGhost.style.setProperty('--drag-y', dragY + 'px');
        tutorialGhost.classList.add('animating');
    }
}

function startConnectionAnimation() {
    var demoContainer = tutorialDemoContainer;
    var node1 = document.getElementById('demo-node-1');
    var node2 = document.getElementById('demo-node-2');
    var wireEl = document.getElementById('demo-wire');
    var centerX = window.innerWidth / 2;
    var centerY = window.innerHeight / 2;
    node1.style.left = (centerX - 180) + 'px';
    node1.style.top = (centerY - 35) + 'px';
    node2.style.left = (centerX + 80) + 'px';
    node2.style.top = (centerY - 35) + 'px';
    demoContainer.style.display = 'block';

    function animateWire() {
        var pin1 = node1.querySelector('.demo-pin.output');
        var pin2 = node2.querySelector('.demo-pin.input');
        var r1 = pin1.getBoundingClientRect();
        var r2 = pin2.getBoundingClientRect();
        var x1 = r1.left + r1.width / 2;
        var y1 = r1.top + r1.height / 2;
        var x2 = r2.left + r2.width / 2;
        var y2 = r2.top + r2.height / 2;
        var dist = Math.abs(x2 - x1) * 0.4;
        var d = 'M ' + x1 + ' ' + y1 + ' C ' + (x1 + dist) + ' ' + y1 + ', ' + (x2 - dist) + ' ' + y2 + ', ' + x2 + ' ' + y2;
        wireEl.style.left = '0';
        wireEl.style.top = '0';
        wireEl.style.width = '100vw';
        wireEl.style.height = '100vh';
        var path = wireEl.querySelector('path');
        path.classList.remove('flowing');
        path.setAttribute('d', d);
        path.style.animation = 'none';
        path.offsetHeight;
        path.style.animation = 'draw-wire 1s ease-out forwards';
        setTimeout(function () { path.classList.add('flowing'); }, 1000);
    }
    animateWire();
    connectionAnimationInterval = setInterval(function () { animateWire(); }, 3000);
}

function setupInteractiveStep(step) {
    tutorialWaitingForAction = true;
    tutorialOverlay.classList.add('interactive');
    tutorialNext.classList.add('waiting');
    tutorialTask.style.display = 'flex';
    tutorialTask.classList.remove('completed');
    tutorialTask.classList.add('waiting');
    tutorialTaskText.innerText = step.task;

    if (step.setupAction === 'setupPlacementTask') {
        if (!componentMenu.classList.contains('hidden')) {
            componentMenu.classList.add('hidden');
        }
        var slot1 = document.querySelector('.qa-slot[data-slot="1"]');
        if (slot1 && assignSlotCallback) {
            assignSlotCallback(slot1, 'AND');
        }
        tutorialNodeCountBefore = getNodes().length;
    }
}

export function checkTutorialTaskCompletion() {
    if (!tutorialWaitingForAction) return;
    var step = tutorialSteps[currentTutorialStep];
    if (step.setupAction === 'setupPlacementTask') {
        if (getNodes().length > tutorialNodeCountBefore) {
            completeTutorialTask();
        }
    }
}

function completeTutorialTask() {
    tutorialWaitingForAction = false;
    tutorialOverlay.classList.remove('interactive');
    tutorialNext.classList.remove('waiting');
    tutorialTask.classList.remove('waiting');
    tutorialTask.classList.add('completed');
    tutorialTaskText.innerText = 'Task completed!';
    showAchievement();
}

function showAchievement() {
    createConfetti();
    tutorialAchievement.classList.add('show');
    setTimeout(function () {
        tutorialAchievement.classList.remove('show');
        setTimeout(function () {
            if (currentTutorialStep < tutorialSteps.length - 1) {
                showStep(currentTutorialStep + 1);
            }
        }, 300);
    }, 1500);
}

function createConfetti() {
    var colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
    var confettiCount = 30;
    for (var i = 0; i < confettiCount; i++) {
        var confetti = document.createElement('div');
        confetti.className = 'confetti ' + (Math.random() > 0.5 ? 'square' : 'circle');
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = (50 + (Math.random() - 0.5) * 40) + '%';
        confetti.style.top = '40%';
        confetti.style.animation = 'confetti-fall ' + (1 + Math.random() * 1) + 's ease-out forwards';
        confetti.style.animationDelay = (Math.random() * 0.3) + 's';
        document.body.appendChild(confetti);
        setTimeout(function () { confetti.remove(); }, 2500);
    }
}
