const pieces    = document.querySelectorAll('.piece');
const frame     = document.getElementById('frame');
const SNAP_DIST = 40; // how close (in px) the piece needs to be to its target before it snaps in

// creates a glowing div at each piece's target position so players can see where things go
// uses the frame's actual pixel position to convert the 0-1 data-target values into real coordinates
function createGlowSpots() {
  const frameRect = frame.getBoundingClientRect();
  const areaRect  = document.getElementById('puzzle-area').getBoundingClientRect();

  pieces.forEach(piece => {
    const spot = document.createElement('div');
    spot.classList.add('glow-spot');
    spot.dataset.pieceId = piece.id;

    // x and y target positions are fractions of the frame size, so u multiply by width/height to get px
    const tx = frameRect.left - areaRect.left + parseFloat(piece.dataset.targetX) * frameRect.width;
    const ty = frameRect.top  - areaRect.top  + parseFloat(piece.dataset.targetY) * frameRect.height;

    spot.style.left = tx + 'px';
    spot.style.top  = ty + 'px';

    document.getElementById('puzzle-area').appendChild(spot);
  });
}

// getBoundingClientRect only works once the image has rendered and has a real size
// so we wait for the load event if it hasnt finished yet
const frameImg = document.getElementById('frame-img');
if (frameImg.complete) {
  createGlowSpots();
} else {
  frameImg.addEventListener('load', createGlowSpots);
}

// scatters pieces randomly across the left third of the screen on startup
// keeps them away from the frame so theres room to drag without things feeling cramped
const spawnWidth = window.innerWidth / 3 - 100;

pieces.forEach((piece, i) => {
  piece.style.left   = (20 + Math.random() * Math.max(10, spawnWidth)) + 'px';
  piece.style.top    = (30 + Math.random() * (window.innerHeight - 220)) + 'px';
  piece.style.zIndex = 10 + i; // stagger the z so they dont all sit on exactly the same layer
});

// drag state   only one piece can be active at a time
let active  = null;
let offsetX = 0;
let offsetY = 0;
let topZ    = 20; // tracks the highest z-index so newly grabbed pieces always come to the front

// attach drag listeners to every piece, touchstart needs passive:false so we can call preventDefault
pieces.forEach(piece => {
  piece.addEventListener('mousedown', onDown);
  piece.addEventListener('touchstart', onDown, { passive: false });
});

function onDown(e) {
  // snapped pieces are locked in place so skip them
  if (e.currentTarget.classList.contains('snapped')) return;
  e.preventDefault();

  active = e.currentTarget;
  active.classList.add('dragging');
  topZ++;
  active.style.zIndex = topZ; // bring it above everything else

  // store where the cursor hit the piece so it doesnt jump to the corner on pickup
  const point = e.touches ? e.touches[0] : e;
  const rect  = active.getBoundingClientRect();
  offsetX = point.clientX - rect.left;
  offsetY = point.clientY - rect.top;
}

document.addEventListener('mousemove', onMove);
document.addEventListener('touchmove',  onMove, { passive: false });

function onMove(e) {
  if (!active) return;
  e.preventDefault();
  const point = e.touches ? e.touches[0] : e;
  active.style.left = (point.clientX - offsetX) + 'px';
  active.style.top  = (point.clientY - offsetY) + 'px';
  // flash white when hovering near the target position
  const frameRect = frame.getBoundingClientRect();
  const tx = frameRect.left + parseFloat(active.dataset.targetX) * frameRect.width;
  const ty = frameRect.top  + parseFloat(active.dataset.targetY) * frameRect.height;
  const rect = active.getBoundingClientRect();
  active.classList.toggle('near-target', Math.hypot(rect.left - tx, rect.top - ty) < SNAP_DIST);
}

document.addEventListener('mouseup',  onUp);
document.addEventListener('touchend', onUp);

function onUp(e) {
  if (!active) return;
  active.classList.remove('dragging');
  active.classList.remove('near-target'); // clean up flash state on drop

  // pass the final drop position to trySnap to check if it landed close enough
  const point = e.changedTouches ? e.changedTouches[0] : e;
  trySnap(active, point.clientX, point.clientY);

  active = null;
}

// checks if the piece is close enough to its target to snap in
// uses straight-line distance from the piece's top-left corner to the target point
function trySnap(piece, dropX, dropY) {
  const frameRect = frame.getBoundingClientRect();
  const areaRect  = document.getElementById('puzzle-area').getBoundingClientRect();
  const fw = frameRect.width;
  const fh = frameRect.height;

  // converts the fractional target coords back into page pixels
  const tx = frameRect.left + parseFloat(piece.dataset.targetX) * fw;
  const ty = frameRect.top  + parseFloat(piece.dataset.targetY) * fh;

  const rect = piece.getBoundingClientRect();
  const dist = Math.hypot(rect.left - tx, rect.top - ty);

  if (dist < SNAP_DIST) {
    // snap it exactly onto the target, then lock it so it cant be dragged again
    piece.style.left = (tx - areaRect.left) + 'px';
    piece.style.top  = (ty - areaRect.top)  + 'px';
    piece.classList.add('snapped');
    piece.style.zIndex = 5;

    // hide the glow spot for this piece since its done
    const spot = document.querySelector(`.glow-spot[data-piece-id="${piece.id}"]`);
    if (spot) spot.style.opacity = '0';

    // check if thats the last piece, and if so kick off the win sequence
    const total   = document.querySelectorAll('.piece').length;
    const snapped = document.querySelectorAll('.piece.snapped').length;
    if (snapped === total) {
      // short delay so the final snap animation plays before the screen fades
      setTimeout(() => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
          position: fixed; inset: 0; background: #000;
          opacity: 0; z-index: 9999; pointer-events: none;
          transition: opacity 1.5s ease;
        `;
        document.body.appendChild(overlay);
        // forces the browser to register the initial opacity before transitioning
        requestAnimationFrame(() => {
          requestAnimationFrame(() => { overlay.style.opacity = '1'; });
        });
        setTimeout(() => {
          window.location.href = 'cutscene.html';
        }, 2500);
      }, 1000);
    }
  }
}

// debug helper   logs each piece's current position as a fraction of the frame on every mouseup
// useful for tuning the data-target values in the html without having to guess
document.addEventListener('mouseup', () => {
  pieces.forEach(piece => {
    const frameRect = frame.getBoundingClientRect();
    const pieceRect = piece.getBoundingClientRect();
    const x = ((pieceRect.left - frameRect.left) / frameRect.width).toFixed(3);
    const y = ((pieceRect.top  - frameRect.top)  / frameRect.height).toFixed(3);
    console.log(piece.id, '→ x:', x, 'y:', y);
  });
});