const CORRECT_CODE = '874925613';
let currentEntry = '';

const display = document.getElementById('display');
const message = document.getElementById('message');
const numButtons = document.querySelectorAll('.num-btn');
const clearBtn = document.getElementById('clearBtn');
const submitBtn = document.getElementById('submitBtn');

function updateDisplay() {
  if (currentEntry.length === 0) {
    display.textContent = '---------';
  } else {
    display.textContent = currentEntry.padEnd(9, '·');
  }
}

const leftPanel = document.getElementById('leftPanel');
const dragOverlay = document.getElementById('dragOverlay');
let dragState = { active: false, startX: 0, startY: 0, origX: 0, origY: 0 };

function onDragStart(event) {
  if (event.button !== undefined && event.button !== 0) return;
  const pointerX = event.clientX || event.touches?.[0]?.clientX;
  const pointerY = event.clientY || event.touches?.[0]?.clientY;
  if (pointerX == null || pointerY == null) return;

  dragState.active = true;
  dragOverlay.classList.add('dragging');
  dragState.startX = pointerX;
  dragState.startY = pointerY;
  dragState.origX = parseInt(dragOverlay.style.left || 20, 10);
  dragState.origY = parseInt(dragOverlay.style.top || 20, 10);
  event.preventDefault();
}

function onDragMove(event) {
  if (!dragState.active) return;
  const pointerX = event.clientX || event.touches?.[0]?.clientX;
  const pointerY = event.clientY || event.touches?.[0]?.clientY;
  if (pointerX == null || pointerY == null) return;

  const deltaX = pointerX - dragState.startX;
  const deltaY = pointerY - dragState.startY;

  const panelRect = leftPanel.getBoundingClientRect();
  const overlayRect = dragOverlay.getBoundingClientRect();

  let nextX = dragState.origX + deltaX;
  let nextY = dragState.origY + deltaY;

  nextX = Math.max(0, Math.min(nextX, panelRect.width - overlayRect.width));
  nextY = Math.max(0, Math.min(nextY, panelRect.height - overlayRect.height));

  dragOverlay.style.left = `${nextX}px`;
  dragOverlay.style.top = `${nextY}px`;
  event.preventDefault();
}

function onDragEnd() {
  dragState.active = false;
  dragOverlay.classList.remove('dragging');
}

let messageTimeout = null;

function setMessage(text, type) {
  message.textContent = text;
  message.className = type ? `message ${type}` : 'message';
}

function clearMessageAfter(timeout) {
  if (messageTimeout) {
    clearTimeout(messageTimeout);
  }
  messageTimeout = setTimeout(() => {
    setMessage('', '');
    messageTimeout = null;
  }, timeout);
}

numButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (currentEntry.length >= 9) return;
    currentEntry += btn.dataset.num;
    updateDisplay();
    setMessage('', '');
  });
});

clearBtn.addEventListener('click', () => {
  currentEntry = '';
  updateDisplay();
  setMessage('Input cleared', '');
  clearMessageAfter(2500);
});

submitBtn.addEventListener('click', () => {
  if (currentEntry.length !== 9) {
    setMessage('Please enter 9 digits before submitting.', 'error');
    return;
  }

  if (currentEntry === CORRECT_CODE) {
    setMessage('Pin Correct');
    clearMessageAfter(2500);
  } else {
    setMessage('Pin Incorrect');
    currentEntry = '';
    updateDisplay();
    clearMessageAfter(2500);
  }
});

if (dragOverlay && leftPanel) {
  dragOverlay.addEventListener('mousedown', onDragStart);
  window.addEventListener('mousemove', onDragMove);
  window.addEventListener('mouseup', onDragEnd);
  dragOverlay.addEventListener('touchstart', onDragStart, { passive: false });
  window.addEventListener('touchmove', onDragMove, { passive: false });
  window.addEventListener('touchend', onDragEnd);
}

updateDisplay();