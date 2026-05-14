// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
    });
  }

  // Close mobile menu when clicking a link
  const navLinks = document.querySelectorAll('.nav-menu a');
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      navMenu.classList.remove('active');
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // WhatsApp button animation
  const whatsappBtn = document.querySelector('.whatsapp-float');
  if (whatsappBtn) {
    whatsappBtn.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.1) rotate(10deg)';
    });

    whatsappBtn.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1) rotate(0deg)';
    });
  }

  // Event tracking functions
  function trackWhatsAppClick() {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'contact', {
        'event_category': 'engagement',
        'event_label': 'whatsapp',
        'value': 1
      });
    }
    if (typeof fbq !== 'undefined') {
      fbq('track', 'Contact');
    }
  }

  function trackPhoneClick() {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'contact', {
        'event_category': 'engagement',
        'event_label': 'phone',
        'value': 1
      });
    }
    if (typeof fbq !== 'undefined') {
      fbq('track', 'Contact');
    }
  }

  function trackEmailClick() {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'contact', {
        'event_category': 'engagement',
        'event_label': 'email',
        'value': 1
      });
    }
  }

  // Auto-attach event tracking to WhatsApp links
  document.querySelectorAll('a[href^="https://wa.me"], a[href^="https://web.whatsapp.com"]').forEach(link => {
    link.addEventListener('click', trackWhatsAppClick);
  });

  // Auto-attach event tracking to phone links
  document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.addEventListener('click', trackPhoneClick);
  });

  // Auto-attach event tracking to email links
  document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
    link.addEventListener('click', trackEmailClick);
  });

  // Make functions globally available for inline onclick handlers
  window.trackWhatsAppClick = trackWhatsAppClick;
  window.trackPhoneClick = trackPhoneClick;
  window.trackEmailClick = trackEmailClick;

  // Hero Slider Functionality
  const heroSlider = document.querySelector('.hero-slider');
  if (heroSlider) {
    const slides = heroSlider.querySelectorAll('.hero-slide');
    const dots = heroSlider.querySelectorAll('.slider-dot');
    let currentSlide = 0;
    const slideInterval = 5000; // 5 seconds

    function showSlide(index) {
      slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
      });
      currentSlide = index;
    }

    function nextSlide() {
      currentSlide = (currentSlide + 1) % slides.length;
      showSlide(currentSlide);
    }

    // Auto-advance slides
    const intervalId = setInterval(nextSlide, slideInterval);

    // Click handlers for dots
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        clearInterval(intervalId);
        showSlide(index);
        setInterval(nextSlide, slideInterval);
      });
    });
  }

});
