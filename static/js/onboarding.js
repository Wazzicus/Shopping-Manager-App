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
                window.location.href = '/auth';
            }, 500);
        }

        function skipOnboarding() {
            completeOnboarding();
        }

        function animateLogoSlide() {
            setTimeout(() => {
                document.getElementById('appLogo').classList.add('animate');
            }, 300);
            
            setTimeout(() => {
                document.getElementById('appTitle').classList.add('animate');
            }, 500);
            
            setTimeout(() => {
                document.getElementById('appSubtitle').classList.add('animate');
            }, 700);
            
            setTimeout(() => {
                document.getElementById('navigationButtons').classList.add('animate');
            }, 900);
        }

        function updateProgressBar() {
            const progressStops = document.querySelectorAll('.progress-stop');
            const progressTracks = document.querySelectorAll('.progress-track');
            
            progressStops.forEach((stop, index) => {
                stop.classList.remove('active', 'completed');
                if (index < currentSlide) {
                    stop.classList.add('completed');
                } else if (index === currentSlide) {
                    stop.classList.add('active');
                }
            });

            progressTracks.forEach((track, index) => {
                const fill = track.querySelector('.progress-fill');
                if (index < currentSlide) {
                    fill.style.width = '100%';
                } else {
                    fill.style.width = '0%';
                }
            });
        }

function updateSlide(direction = 'next') {
    const wrapper = document.getElementById('carouselWrapper');
    const cards = document.querySelectorAll('.slide-card');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    wrapper.style.transform = `translateX(-${currentSlide * 100}%)`;

    updateProgressBar();

    if (currentSlide > 0) {
        cards.forEach((card, index) => {
            card.classList.remove('active', 'slide-enter-right', 'slide-enter-left');
            if (index === currentSlide - 1) {
                setTimeout(() => {
                    card.classList.add('active');
                    card.classList.add(direction === 'next' ? 'slide-enter-right' : 'slide-enter-left');
                }, 100);
            }
        });
    }

    prevBtn.disabled = currentSlide === 0;
    prevBtn.classList.toggle('invisible', currentSlide === 0);
    
    if (currentSlide === totalSlides - 1) {
        nextBtn.textContent = "Let's Go!";
        nextBtn.classList.add('primary');
    } else {
        nextBtn.textContent = 'Next';
        nextBtn.classList.add('primary');
    }

    // Animate logo slide if we're on it
    if (currentSlide === 0) {
        animateLogoSlide();
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

// Touch/swipe handling
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

// Prevent zoom on double tap
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Initialize onboarding
document.addEventListener('DOMContentLoaded', function() {
    // Check if onboarding should be shown
    if (hasCompletedOnboarding()) {
        hideOnboarding();
        return;
    }

    // Add touch event listeners
    const container = document.getElementById('onboardingContainer');
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Initialize first slide
    updateSlide();
});

// // Keyboard navigation
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