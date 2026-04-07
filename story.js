// revealing as u scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      
      if (entry.target.querySelector('.clock-time')) {
        animateClock();
      }
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.lines, .panel, .scene-action, .document, .chapter-break').forEach(el => {
  observer.observe(el);
});

// clock animation function
function animateClock() {
  const clockTimes = document.querySelectorAll('.clock-time');
  const beeps = document.querySelectorAll('.beep-sound');
  
  // showing time with 800ms interval, replacing the previous one like a real clock
  clockTimes.forEach((time, index) => {
    setTimeout(() => {
      // Hide previous time if exists
      if (index > 0) {
        clockTimes[index - 1].classList.add('hidden');
      }
      time.classList.remove('hidden');
    }, index * 800);
  });
  
  // showing beeps overlapping with the last time
  beeps.forEach((beep, index) => {
    setTimeout(() => {
      beep.classList.remove('hidden');
    }, (clockTimes.length - 1) * 800 + index * 300);
  });
}