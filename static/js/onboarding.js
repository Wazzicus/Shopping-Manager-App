// onboarding.js
let currentSlide = 0;
const totalSlides = 4;
const ONBOARDING_KEY = 'shopping_manager_onboarding_completed';

function hasCompletedOnboarding() {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

function completeOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    hideOnboarding();
}

function hideOnboarding() {
    const container = document.getElementById('onboardingContainer');
    container.style.transform = 'translateY(-100vh)';
    container.style.opacity = '0';
            
    setTimeout(() => {
        container.classList.add('hidden');
        window.location.href = '/dashboard';
    }, 500);
}

function skipOnboarding() {
    completeOnboarding();
}

function updateSlide(direction = 'next') {
    const wrapper = document.getElementById('carouselWrapper');
    const cards = document.querySelectorAll('.slide-card');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (!wrapper || !cards || !dots || !prevBtn || !nextBtn) {
        console.error("Required elements for onboarding not found.");
        return;
    }

    wrapper.style.transform = `translateX(-${currentSlide * 100}%)`;

    const progress = ((currentSlide + 1) / totalSlides) * 100;
    
    function updateProgressBar() {
        const progressTrackElement = listHeader?.querySelector('.custom-progress-track');
        const filledSegment = progressTrackElement?.querySelector('.custom-progress-filled');
        const gapSegment = progressTrackElement?.querySelector('.custom-progress-gap');
        const unfilledSegment = progressTrackElement?.querySelector('.custom-progress-unfilled');
        const GAP_WIDTH_PX = 4;
        if (!progressTrackElement || !filledSegment || !gapSegment || !unfilledSegment) { return; }

        let percentage = `${progress}%`;
        percentage = Math.min(100, Math.max(0, percentage));
        const percentageInt = Math.round(percentage);

        progressTrackElement.setAttribute('aria-valuenow', percentageInt);
        filledSegment.style.width = percentage + '%';
        filledSegment.style.flexBasis = percentage + '%';

        if (percentage >= 100) {
            gapSegment.style.display = 'none';
            unfilledSegment.style.width = '0%';
            unfilledSegment.style.flexBasis = '0%';
            unfilledSegment.classList.add('is-empty');
        } else if (percentage <= 0) {
            gapSegment.style.display = 'none';
            filledSegment.style.width = '0%';
            filledSegment.style.flexBasis = '0%';
            unfilledSegment.style.width = '100%';
            unfilledSegment.style.flexBasis = '100%';
            unfilledSegment.classList.remove('is-empty');
        } else {
            gapSegment.style.display = 'block';
            gapSegment.style.width = `${GAP_WIDTH_PX}px`;
            gapSegment.style.flexBasis = `${GAP_WIDTH_PX}px`;
            const unfilledBasis = `calc(100% - ${percentage}% - ${GAP_WIDTH_PX}px)`;
            unfilledSegment.style.width = unfilledBasis;
            unfilledSegment.style.flexBasis = unfilledBasis;
            unfilledSegment.classList.remove('is-empty');
        }
    }

    updateProgressBar();

    dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentSlide);
    });

    cards.forEach((card, index) => {
        card.classList.remove('active', 'slide-enter-right', 'slide-enter-left');
        if (index === currentSlide) {
            setTimeout(() => {
                card.classList.add('active');
                card.classList.add(direction === 'next' ? 'slide-enter-right' : 'slide-enter-left');
            }, 100);
        }
    });

    prevBtn.disabled = currentSlide === 0;
    prevBtn.classList.toggle('invisible', currentSlide === 0);
            
    if (currentSlide === totalSlides - 1) {
        nextBtn.textContent = "Let's Go!";
        nextBtn.classList.add('btn-primary');
    } else {
        nextBtn.textContent = 'Next';
        nextBtn.classList.add('btn-primary');
    }
}

function nextSlide() {
    if (currentSlide < totalSlides - 1) {
        currentSlide++;
        updateSlide('next');
    } else {
        completeOnboarding();
    }
}

function previousSlide() {
    if (currentSlide > 0) {
        currentSlide--;
        updateSlide('prev');
    }
}

let touchStartX = 0;
let touchEndX = 0;

function handleTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
}

function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0 && currentSlide < totalSlides - 1) {
            nextSlide();
        } else if (diff < 0 && currentSlide > 0) {
            previousSlide();
        }
    }
}

let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

document.addEventListener('DOMContentLoaded', function() {
    if (hasCompletedOnboarding()) {
        hideOnboarding();
        return;
    }

    const container = document.getElementById('onboardingContainer');
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    updateSlide();
    setInterval(() => {
        if (currentSlide < totalSlides - 1) {
            nextSlide();
        }
    }, 5000);
});

// document.addEventListener('keydown', function(e) {
//     if (e.key === 'ArrowRight' || e.key === ' ') {
//         e.preventDefault();
//         nextSlide();
//     } else if (e.key === 'ArrowLeft') {
//         e.preventDefault();
//         previousSlide();
//     } else if (e.key === 'Escape') {
//         skipOnboarding();
//     }
// });