/* ============================================================
   [COMPANY NAME] — NEMT Website Script
   Vanilla JS, no dependencies.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Sticky header shrink ---------- */
  const header = document.getElementById('siteHeader');
  const onScroll = () => {
    if (window.scrollY > 12) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  const hamburger = document.getElementById('hamburgerBtn');
  const mobileNav = document.getElementById('mobileNav');

  function setMobileNav(open) {
    mobileNav.dataset.open = String(open);
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  hamburger.addEventListener('click', () => {
    setMobileNav(mobileNav.dataset.open !== 'true');
  });
  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMobileNav(false));
  });

  /* ---------- Scroll reveal (fade-up) ---------- */
  const revealItems = document.querySelectorAll('.fade-up');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealItems.forEach((el) => io.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add('in-view'));
  }

  /* ---------- Animated stat counters ---------- */
  const statNumbers = document.querySelectorAll('.stat-number[data-count]');
  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      el.textContent = value.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window && statNumbers.length) {
    const statIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            statIo.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    statNumbers.forEach((el) => statIo.observe(el));
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.accordion-trigger').forEach((trigger) => {
    const panel = trigger.nextElementSibling;
    trigger.addEventListener('click', () => {
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';
      // Close all
      document.querySelectorAll('.accordion-trigger').forEach((t) => {
        t.setAttribute('aria-expanded', 'false');
        t.nextElementSibling.style.maxHeight = null;
      });
      if (!isOpen) {
        trigger.setAttribute('aria-expanded', 'true');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });

  /* ---------- Gallery lightbox ---------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxInner = document.getElementById('lightboxInner');
  const lightboxClose = document.getElementById('lightboxClose');

  document.querySelectorAll('.gallery-item').forEach((item) => {
    item.addEventListener('click', () => {
      const svg = item.querySelector('svg');
      lightboxInner.innerHTML = svg ? svg.outerHTML : '';
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
    });
  });
  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
  });

  /* ============================================================
     RIDE ESTIMATOR
     ------------------------------------------------------------
     This is a placeholder pricing model only. Replace calculateFare()
     with the company's real pricing rules (e.g. via a backend API call
     to a pricing service, a mileage-lookup API, and confirmed base
     rates) before using this in production.
     ============================================================ */
  const estimatorForm = document.getElementById('estimatorForm');
  const estimateEmpty = document.getElementById('estimateEmpty');
  const estimateContent = document.getElementById('estimateContent');
  const estimateAmount = document.getElementById('estimateAmount');
  const estimateDistance = document.getElementById('estimateDistance');
  const estimateTripType = document.getElementById('estimateTripType');
  const estimatePassengerType = document.getElementById('estimatePassengerType');

  // INTEGRATION POINT: replace this with a real distance lookup
  // (e.g. Google Distance Matrix API) instead of a randomized placeholder.
  function estimateDistanceMiles(pickup, dropoff) {
    let seed = 0;
    const str = (pickup + dropoff).toLowerCase();
    for (let i = 0; i < str.length; i++) seed += str.charCodeAt(i);
    return 3 + (seed % 22); // 3–24 placeholder miles, deterministic per input
  }

  // INTEGRATION POINT: replace with the company's confirmed pricing rules.
  const PRICING = {
    baseFare: 15,
    perMile: 2.5,
    passengerMultiplier: { ambulatory: 1, wheelchair: 1.25, stretcher: 1.6 },
    roundTripMultiplier: 1.85,
    wheelchairAssistFee: 10,
    waitTimeFee: 15,
    additionalPassengerFee: 8,
  };

  function calculateFare(data, miles) {
    let fare = PRICING.baseFare + miles * PRICING.perMile;
    fare *= PRICING.passengerMultiplier[data.passengerType] || 1;
    if (data.tripType === 'round-trip') fare *= PRICING.roundTripMultiplier;
    if (data.wheelchairAssist) fare += PRICING.wheelchairAssistFee;
    if (data.waitTime) fare += PRICING.waitTimeFee;
    if (data.additionalPassenger) fare += PRICING.additionalPassengerFee;
    return fare;
  }

  const passengerLabels = { ambulatory: 'Ambulatory', wheelchair: 'Wheelchair', stretcher: 'Stretcher' };
  const tripLabels = { 'one-way': 'One-Way', 'round-trip': 'Round Trip' };

  if (estimatorForm) {
    estimatorForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(estimatorForm);
      const data = {
        pickup: formData.get('pickup'),
        dropoff: formData.get('dropoff'),
        date: formData.get('date'),
        time: formData.get('time'),
        passengerType: formData.get('passengerType'),
        tripType: formData.get('tripType'),
        wheelchairAssist: formData.get('wheelchairAssist') === 'on',
        waitTime: formData.get('waitTime') === 'on',
        additionalPassenger: formData.get('additionalPassenger') === 'on',
      };

      if (!data.pickup || !data.dropoff) {
        estimatorForm.reportValidity();
        return;
      }

      const miles = estimateDistanceMiles(data.pickup, data.dropoff);
      const fare = calculateFare(data, miles);

      estimateAmount.textContent = '$' + fare.toFixed(2);
      estimateDistance.textContent = miles + ' miles (approx.)';
      estimateTripType.textContent = tripLabels[data.tripType] || data.tripType;
      estimatePassengerType.textContent = passengerLabels[data.passengerType] || data.passengerType;

      estimateEmpty.hidden = true;
      estimateContent.hidden = false;
      estimateContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  /* ============================================================
     BOOKING FORM
     ------------------------------------------------------------
     INTEGRATION POINT: replace the mock handleBookingSubmit body with
     a real fetch() POST to your endpoint of choice, for example:

     fetch('https://your-endpoint.example.com/api/book', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(data)
     })

     Compatible targets include Google Forms (via a hidden iframe POST),
     Formspree, a CRM such as GoHighLevel, or an automation tool such as
     Zapier / Make.com using their provided webhook URL.
     ============================================================ */
  const bookingForm = document.getElementById('bookingForm');
  const bookingSuccess = document.getElementById('bookingSuccess');

  function handleBookingSubmit(data) {
    // Placeholder: log the payload. Replace with a real network request.
    console.log('Booking request payload:', data);
    return Promise.resolve({ ok: true });
  }

  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!bookingForm.checkValidity()) {
        bookingForm.reportValidity();
        return;
      }
      const data = Object.fromEntries(new FormData(bookingForm).entries());
      const submitBtn = bookingForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      try {
        await handleBookingSubmit(data);
        bookingForm.reset();
        bookingSuccess.hidden = false;
        bookingSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (err) {
        console.error('Booking submission failed:', err);
        alert('Something went wrong sending your request. Please call us directly to book your ride.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Request Transportation';
      }
    });
  }

  /* ---------- Facility inquiry form ---------- */
  const facilityForm = document.getElementById('facility-form');
  const facilitySuccess = document.getElementById('facilitySuccess');
  if (facilityForm) {
    facilityForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!facilityForm.checkValidity()) {
        facilityForm.reportValidity();
        return;
      }
      const data = Object.fromEntries(new FormData(facilityForm).entries());
      // INTEGRATION POINT: same options as handleBookingSubmit above.
      console.log('Facility inquiry payload:', data);
      facilityForm.reset();
      facilitySuccess.hidden = false;
    });
  }
})();
