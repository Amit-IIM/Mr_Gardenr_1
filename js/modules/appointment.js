export function initAppointmentBooking() {
  // ==========================================================================
  // 1. INLINE FORM INITIALIZATION
  // ==========================================================================
  const inlineForm = document.getElementById('appointmentForm');
  const inlineSuccessBlock = document.getElementById('bookingSuccessBlock');
  const inlineDateInput = document.getElementById('book-date');
  const inlineReceipt = document.getElementById('successReceipt');
  const inlineBtnReset = document.getElementById('btnResetBooking');

  if (inlineForm && inlineSuccessBlock) {
    // A. Constrain date field
    if (inlineDateInput) {
      const today = new Date().toISOString().split('T')[0];
      inlineDateInput.min = today;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      inlineDateInput.value = tomorrow.toISOString().split('T')[0];
    }

    // B. Custom Submit Handling
    inlineForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const btnSubmit = document.getElementById('btnBookSubmit');
      if (!btnSubmit) return;

      const name = document.getElementById('book-name').value;
      const phone = document.getElementById('book-phone').value;
      const email = document.getElementById('book-email').value;
      const service = document.getElementById('book-service').value;
      const dateVal = inlineDateInput.value;
      const selectedRadio = inlineForm.querySelector('input[name="book-time"]:checked');
      const timeSlot = selectedRadio ? selectedRadio.value : 'Morning (10:00 AM - 1:00 PM)';

      // Show loader
      const originalText = btnSubmit.innerHTML;
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Request...';

      setTimeout(() => {
        const randomID = Math.floor(1000 + Math.random() * 9000);
        const bookingRef = `MRG-${new Date().getFullYear()}-${randomID}`;
        const formattedDate = new Date(dateVal).toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        if (inlineReceipt) {
          inlineReceipt.innerHTML = `
            <div class="receipt-row">
              <div class="receipt-label">Booking Reference</div>
              <div class="receipt-value" style="color: var(--primary); font-weight: 700;">${bookingRef}</div>
            </div>
            <div class="receipt-row">
              <div class="receipt-label">Service Chosen</div>
              <div class="receipt-value">${service}</div>
            </div>
            <div class="receipt-row">
              <div class="receipt-label">Appointment Date</div>
              <div class="receipt-value">${formattedDate}</div>
            </div>
            <div class="receipt-row">
              <div class="receipt-label">Time Slot</div>
              <div class="receipt-value">${timeSlot}</div>
            </div>
            <div class="receipt-row">
              <div class="receipt-label">Client Name</div>
              <div class="receipt-value">${name}</div>
            </div>
            <div class="receipt-row">
              <div class="receipt-label">Status</div>
              <div class="receipt-value"><span style="background: rgba(91, 165, 133, 0.15); color: var(--primary); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;"><i class="fas fa-check-circle"></i> Confirmed</span></div>
            </div>
          `;
        }

        inlineForm.style.opacity = '0';
        setTimeout(() => {
          inlineForm.style.display = 'none';
          inlineSuccessBlock.style.display = 'block';
          inlineSuccessBlock.style.opacity = '1';
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = originalText;
        }, 300);
      }, 1200);
    });

    // C. Reset Action
    if (inlineBtnReset) {
      inlineBtnReset.addEventListener('click', function () {
        inlineSuccessBlock.style.display = 'none';
        inlineForm.style.display = 'flex';
        inlineForm.style.opacity = '1';
        inlineForm.reset();
        if (inlineDateInput) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          inlineDateInput.value = tomorrow.toISOString().split('T')[0];
        }
      });
    }
  }

  // ==========================================================================
  // 2. DYNAMIC MODAL FORM INITIALIZATION
  // ==========================================================================
  const modal = document.getElementById('appointmentModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalForm = document.getElementById('appointmentModalForm');
  const modalSuccessBlock = document.getElementById('bookingModalSuccessBlock');
  const modalDateInput = document.getElementById('modal-book-date');
  const modalReceipt = document.getElementById('modal-successReceipt');
  const modalBtnReset = document.getElementById('modal-btnResetBooking');
  
  const popTriggers = document.querySelectorAll('a[href="#contact"], a[href="#booking"], .btn-book-trigger');

  if (modal && modalForm && modalSuccessBlock) {
    
    // A. Constrain date field
    if (modalDateInput) {
      const today = new Date().toISOString().split('T')[0];
      modalDateInput.min = today;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      modalDateInput.value = tomorrow.toISOString().split('T')[0];
    }

    // B. Modal toggling handlers
    function openModal() {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      
      // Smoothly reset the form to standard inputs when hidden
      setTimeout(() => {
        modalSuccessBlock.style.display = 'none';
        modalForm.style.display = 'flex';
        modalForm.style.opacity = '1';
        modalForm.reset();
        if (modalDateInput) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          modalDateInput.value = tomorrow.toISOString().split('T')[0];
        }
      }, 400);
    }

    // Hook all buttons on the page to trigger modal pop-up
    popTriggers.forEach(trigger => {
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        openModal();
      });
    });

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closeModal);
    }

    // Close when clicking overlay backdrop
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });

    // C. Modal Form Submit Handling
    modalForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const btnSubmit = document.getElementById('modal-btnBookSubmit');
      if (!btnSubmit) return;

      const name = document.getElementById('modal-book-name').value;
      const phone = document.getElementById('modal-book-phone').value;
      const email = document.getElementById('modal-book-email').value;
      const service = document.getElementById('modal-book-service').value;
      const dateVal = modalDateInput.value;
      const selectedRadio = modalForm.querySelector('input[name="modal-book-time"]:checked');
      const timeSlot = selectedRadio ? selectedRadio.value : 'Morning (10:00 AM - 1:00 PM)';

      // Show loader
      const originalText = btnSubmit.innerHTML;
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Request...';

      setTimeout(() => {
        const randomID = Math.floor(1000 + Math.random() * 9000);
        const bookingRef = `MRG-${new Date().getFullYear()}-${randomID}`;
        const formattedDate = new Date(dateVal).toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        if (modalReceipt) {
          modalReceipt.innerHTML = `
            <div class="receipt-row">
              <div class="receipt-label">Booking Reference</div>
              <div class="receipt-value" style="color: var(--primary); font-weight: 700;">${bookingRef}</div>
            </div>
            <div class="receipt-row">
              <div class="receipt-label">Service Chosen</div>
              <div class="receipt-value">${service}</div>
            </div>
            <div class="receipt-row">
              <div class="receipt-label">Appointment Date</div>
              <div class="receipt-value">${formattedDate}</div>
            </div>
            <div class="receipt-row">
              <div class="receipt-label">Time Slot</div>
              <div class="receipt-value">${timeSlot}</div>
            </div>
            <div class="receipt-row">
              <div class="receipt-label">Client Name</div>
              <div class="receipt-value">${name}</div>
            </div>
            <div class="receipt-row">
              <div class="receipt-label">Status</div>
              <div class="receipt-value"><span style="background: rgba(91, 165, 133, 0.15); color: var(--primary); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;"><i class="fas fa-check-circle"></i> Confirmed</span></div>
            </div>
          `;
        }

        modalForm.style.opacity = '0';
        setTimeout(() => {
          modalForm.style.display = 'none';
          modalSuccessBlock.style.display = 'block';
          modalSuccessBlock.style.opacity = '1';
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = originalText;
        }, 300);
      }, 1200);
    });

    // D. Modal Reset Action
    if (modalBtnReset) {
      modalBtnReset.addEventListener('click', closeModal);
    }
  }
}

// Add to window object for modular support
window.initAppointmentBooking = initAppointmentBooking;
