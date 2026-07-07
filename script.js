import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDZnoGbQ3LtPJSi9fm8h1hAXRMzqmsYsSg",
  authDomain: "vythos.firebaseapp.com",
  databaseURL: "https://vythos-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "vythos",
  storageBucket: "vythos.firebasestorage.app",
  messagingSenderId: "866948522913",
  appId: "1:866948522913:web:d601ca585aedfe7486a1e0",
  measurementId: "G-S49LYZVZ9T"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function init() {
  const html = document.documentElement;
  const langToggle = document.querySelector('[data-lang-toggle]');
  const langDropdown = document.querySelector('.lang-dropdown');
  const reservationTrigger = document.querySelector('.reservation-trigger');
  const reservationModal = document.getElementById('reservationModal');
  const modalClose = document.querySelector('[data-modal-close]');
  const reservationForm = document.getElementById('reservationForm');
  const reservationSubmitBtn = document.getElementById('reservationSubmitBtn');
  const reservationStatus = document.getElementById('reservationStatus');

  function getLangFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get('lang');
    return ['el', 'en', 'de'].includes(lang) ? lang : 'el';
  }

  function updateUrlLang(lang) {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function updateInternalLinks(lang) {
    document.querySelectorAll('a[href]').forEach((link) => {
      const rawHref = link.getAttribute('href');
      if (!rawHref) return;

      if (
        rawHref.startsWith('#') ||
        rawHref.startsWith('mailto:') ||
        rawHref.startsWith('tel:') ||
        rawHref.startsWith('javascript:')
      ) {
        return;
      }

      const url = new URL(rawHref, window.location.origin);

      if (url.origin !== window.location.origin) return;

      url.searchParams.set('lang', lang);

      const finalHref = `${url.pathname}${url.search}${url.hash}`;
      link.setAttribute('href', finalHref);
    });
  }

  function updateText(lang) {
    document.querySelectorAll('[data-lang]').forEach((el) => {
      el.hidden = el.getAttribute('data-lang') !== lang;
    });
  }

  function updatePlaceholders(lang) {
    document
      .querySelectorAll('[data-placeholder-en][data-placeholder-el][data-placeholder-de]')
      .forEach((el) => {
        el.placeholder =
          lang === 'en'
            ? el.getAttribute('data-placeholder-en')
            : lang === 'de'
            ? el.getAttribute('data-placeholder-de')
            : el.getAttribute('data-placeholder-el');
      });

    document
      .querySelectorAll('[data-placeholder-en][data-placeholder-el]:not([data-placeholder-de])')
      .forEach((el) => {
        el.placeholder =
          lang === 'en'
            ? el.getAttribute('data-placeholder-en')
            : el.getAttribute('data-placeholder-el');
      });
  }

  function renderLangMenu() {
    const langMenu = document.querySelector('.lang-menu');
    if (!langMenu) return;

    langMenu.innerHTML = `
      <button type="button" class="lang-option" data-set-lang="el">
        <img src="greek.jpg" alt="Ελληνικά" class="option-flag" />
        <span>Ελληνικά</span>
      </button>
      <button type="button" class="lang-option" data-set-lang="en">
        <img src="english.jpg" alt="English" class="option-flag" />
        <span>English</span>
      </button>
      <button type="button" class="lang-option" data-set-lang="de">
        <img src="german.jpg" alt="Deutsch" class="option-flag" />
        <span>Deutsch</span>
      </button>
    `;

    bindLangOptions();
  }

  function updateLanguage(lang) {
    if (!['el', 'en', 'de'].includes(lang)) lang = 'el';

    html.setAttribute('data-lang', lang);
    html.lang = lang;

    updateText(lang);
    updatePlaceholders(lang);
    updateUrlLang(lang);
    updateInternalLinks(lang);

    const currentFlag = document.querySelector('.lang-current-flag');
    if (currentFlag) {
      currentFlag.src =
        lang === 'el' ? 'greek.jpg' : lang === 'en' ? 'english.jpg' : 'german.jpg';
      currentFlag.alt =
        lang === 'el' ? 'Ελληνικά' : lang === 'en' ? 'English' : 'Deutsch';
    }

    renderLangMenu();
  }

  function bindLangOptions() {
    document.querySelectorAll('.lang-option').forEach((btn) => {
      btn.onclick = () => {
        const lang = btn.getAttribute('data-set-lang');
        updateLanguage(lang);
        langDropdown?.classList.remove('open');
      };
    });
  }

  function openModal() {
    reservationModal?.classList.add('open');
    clearReservationStatus();
  }

  function closeModal() {
    reservationModal?.classList.remove('open');
  }

  function getCurrentLang() {
    return document.documentElement.getAttribute('data-lang') || 'el';
  }

  function getStatusMessage(type) {
    const lang = getCurrentLang();

    const messages = {
      success: {
        el: 'Το αίτημά σας καταχωρήθηκε με επιτυχία. Θα επικοινωνήσουμε σύντομα μαζί σας για επιβεβαίωση.',
        en: 'Your reservation request was submitted successfully. We will contact you shortly for confirmation.',
        de: 'Ihre Reservierungsanfrage wurde erfolgreich gesendet. Wir werden uns in Kürze zur Bestätigung bei Ihnen melden.'
      },
      error: {
        el: 'Η αποστολή απέτυχε. Ελέγξτε τα στοιχεία σας και δοκιμάστε ξανά.',
        en: 'Sending failed. Please check your details and try again.',
        de: 'Das Senden ist fehlgeschlagen. Bitte prüfen Sie Ihre Angaben und versuchen Sie es erneut.'
      }
    };

    return messages[type][lang] || messages[type].el;
  }

  function setReservationStatus(type, message) {
    if (!reservationStatus) return;

    reservationStatus.hidden = false;
    reservationStatus.className = `form-status is-${type}`;
    reservationStatus.textContent = message;

    if (type === 'error') {
      reservationStatus.setAttribute('role', 'alert');
      reservationStatus.setAttribute('aria-live', 'assertive');
    } else {
      reservationStatus.setAttribute('role', 'status');
      reservationStatus.setAttribute('aria-live', 'polite');
    }

    reservationStatus.setAttribute('aria-atomic', 'true');
  }

  function clearReservationStatus() {
    if (!reservationStatus) return;

    reservationStatus.hidden = true;
    reservationStatus.className = 'form-status';
    reservationStatus.textContent = '';
    reservationStatus.removeAttribute('role');
    reservationStatus.removeAttribute('aria-live');
    reservationStatus.removeAttribute('aria-atomic');
  }

  function setReservationLoading(isLoading) {
    if (!reservationSubmitBtn) return;

    reservationSubmitBtn.disabled = isLoading;
    reservationSubmitBtn.classList.toggle('is-loading', isLoading);
    reservationSubmitBtn.setAttribute('aria-busy', isLoading ? 'true' : 'false');
  }

  langToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    langDropdown?.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (langDropdown && !langDropdown.contains(e.target)) {
      langDropdown.classList.remove('open');
    }
  });

  reservationTrigger?.addEventListener('click', openModal);
  modalClose?.addEventListener('click', closeModal);

  reservationModal?.addEventListener('click', (e) => {
    if (e.target === reservationModal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && reservationModal?.classList.contains('open')) {
      closeModal();
    }
  });

  reservationForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!reservationForm.reportValidity()) return;

    clearReservationStatus();
    setReservationLoading(true);

    const formData = new FormData(reservationForm);

    const reservationData = {
      name: (formData.get('name') || '').toString().trim(),
      phone: (formData.get('phone') || '').toString().trim(),
      email: (formData.get('email') || '').toString().trim(),
      date: (formData.get('date') || '').toString().trim(),
      time: (formData.get('time') || '').toString().trim(),
      people: Number(formData.get('people') || 0),
      details: (formData.get('details') || '').toString().trim(),
      status: 'pending',
      createdAt: Date.now()
    };

    try {
      await push(ref(db, 'reservations'), reservationData);

      await emailjs.sendForm(
        'service_cjawqmc',
        'template_vzeiizj',
        reservationForm,
        {
          publicKey: 'grBG2EDy7Drg5LiNq'
        }
      );

      setReservationStatus('success', getStatusMessage('success'));
      reservationForm.reset();

      setTimeout(() => {
        clearReservationStatus();
        closeModal();
      }, 2200);
    } catch (error) {
      console.error('Reservation submit error:', error);
      setReservationStatus('error', getStatusMessage('error'));
    } finally {
      setReservationLoading(false);
    }
  });

  updateLanguage(getLangFromUrl());

  const galleryImages = Array.from(document.querySelectorAll('.gallery-img'));

  if (galleryImages.length) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
      <button class="close-lightbox" aria-label="Close">×</button>
      <button class="lightbox-prev" aria-label="Previous image">‹</button>
      <img src="" alt="Expanded image" />
      <button class="lightbox-next" aria-label="Next image">›</button>
    `;

    document.body.appendChild(lightbox);

    const lightboxImg = lightbox.querySelector('img');
    const closeBtn = lightbox.querySelector('.close-lightbox');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    let currentIndex = 0;

    function showImage(index) {
      currentIndex = (index + galleryImages.length) % galleryImages.length;
      lightboxImg.src = galleryImages[currentIndex].src;
      lightboxImg.alt = galleryImages[currentIndex].alt || 'Expanded image';
      lightbox.classList.add('open');
    }

    galleryImages.forEach((img, index) => {
      img.addEventListener('click', () => showImage(index));
    });

    const closeLightbox = () => lightbox.classList.remove('open');
    const showPrev = () => showImage(currentIndex - 1);
    const showNext = () => showImage(currentIndex + 1);

    closeBtn?.addEventListener('click', closeLightbox);
    prevBtn?.addEventListener('click', showPrev);
    nextBtn?.addEventListener('click', showNext);

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}