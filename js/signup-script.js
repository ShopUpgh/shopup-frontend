// /js/signup-script.js
// ShopUp Signup with Supabase Integration (window.supabase from /js/supabase-init.js)

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signupForm');

  if (!signupForm) {
    console.error('❌ signupForm not found');
    return;
  }

  // ✅ Ensure Supabase is ready BEFORE allowing submit
  waitForSupabaseReady()
    .then(() => {
      console.log('✅ Supabase ready!');
      setupValidation();

      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleSignup();
      });
    })
    .catch((err) => {
      console.error('❌ Supabase init failed:', err);
      showToast('❌ Connection error. Please refresh the page.');
      disableSubmit(true);
    });
});

/**
 * Wait for window.supabase to exist (module might load slightly after DOMContentLoaded)
 */
function waitForSupabaseReady(timeoutMs = 6000, intervalMs = 50) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const check = () => {
      if (window.supabase) return resolve(window.supabase);

      if (Date.now() - start > timeoutMs) {
        return reject(new Error('Supabase not available on window within timeout'));
      }

      setTimeout(check, intervalMs);
    };

    check();
  });
}

/**
 * Disable/enable submit button
 */
function disableSubmit(disabled) {
  const btn =
    document.querySelector('.btn-submit') ||
    document.querySelector('button[type="submit"]');

  if (btn) btn.disabled = disabled;
}

// Handle signup with Supabase
async function handleSignup() {
  const supabase = window.supabase; // ✅ Always use window.supabase

  if (!supabase) {
    showToast('❌ Connection not ready. Please refresh the page.');
    return;
  }

  const submitBtn =
    document.querySelector('.btn-submit') ||
    document.querySelector('button[type="submit"]');

  if (!submitBtn) {
    console.error('❌ Submit button not found');
    showToast('❌ Form error. Please refresh the page.');
    return;
  }

  const originalText = submitBtn.textContent;

  // Disable button
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating your store...';

  try {
    // Get form data
    const formData = {
      email: document.getElementById('email')?.value.trim() || '',
      password: document.getElementById('password')?.value || '',
      confirmPassword: document.getElementById('confirmPassword')?.value || '',
      businessName: document.getElementById('businessName')?.value.trim() || '',
      firstName: document.getElementById('firstName')?.value.trim() || '',
      lastName: document.getElementById('lastName')?.value.trim() || '',
      phone: document.getElementById('phone')?.value.trim() || '',
      city: document.getElementById('city')?.value.trim() || '',
      region: document.getElementById('region')?.value || '',
      businessCategory: document.getElementById('businessCategory')?.value || ''
    };

    // Validate
    if (!validateForm(formData)) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }

    console.log('Attempting signup with:', formData.email);

    // Step 1: Create auth user with Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          business_name: formData.businessName,
          first_name: formData.firstName,
          last_name: formData.lastName
        }
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      showToast('❌ ' + authError.message);
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }

    if (!authData.session) {
      showToast("✅ Account created! Please check your email to verify, then login.");
      setTimeout(() => (window.location.href = "login.html"), 1500);
      return;
    }

    const userId = authData?.user?.id;

    // IMPORTANT NOTE:
    // If email confirmation is ON, user may exist but session may be null.
    // That’s okay — we can still insert using the userId if policies allow.
    if (!userId) {
      showToast('❌ Signup created, but user ID missing. Check Supabase auth settings.');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }

    console.log('Auth user created:', userId);

    // Step 2: Create seller profile in database
    const storeSlug = slugify(formData.businessName);

    const { data: sellerData, error: sellerError } = await supabase
      .from('sellers')
      .insert([{
        id: userId,
        email: formData.email,
        // ⚠️ Never store real password hashes client-side.
        // Keep placeholder only if your table requires it:
        password_hash: 'managed-by-supabase-auth',
        business_name: formData.businessName,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        city: formData.city,
        region: formData.region,
        business_category: formData.businessCategory,
        store_slug: storeSlug,
        status: 'active'
      }])
      .select()
      .single();

    if (sellerError) {
      console.error('Seller profile error:', sellerError);
      showToast('❌ Failed to create seller profile: ' + sellerError.message);
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }

    console.log('Seller profile created:', sellerData);

    // Store seller data locally (optional)
    const sellerInfo = {
      id: sellerData.id,
      email: sellerData.email,
      businessName: sellerData.business_name,
      firstName: sellerData.first_name,
      lastName: sellerData.last_name,
      phone: sellerData.phone,
      city: sellerData.city,
      region: sellerData.region,
      businessCategory: sellerData.business_category,
      storeSlug: sellerData.store_slug
    };

    localStorage.setItem('shopup_seller', JSON.stringify(sellerInfo));

    // Success
    showToast('✓ Account created successfully!');

    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);

  } catch (error) {
    console.error('Signup error:', error);
    showToast('❌ An error occurred. Please try again.');
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// Validate form
function validateForm(data) {
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    showToast('Please enter a valid email address');
    return false;
  }

  // Password validation
  if (data.password.length < 8) {
    showToast('Password must be at least 8 characters');
    return false;
  }

  // Confirm password match
  if (data.confirmPassword !== data.password) {
    showToast('Passwords do not match');
    return false;
  }

  // Phone validation (Ghana)
  const phoneRegex = /^0[0-9]{9}$/;
  if (!phoneRegex.test(data.phone)) {
    showToast('Please enter a valid Ghana phone number (e.g., 0244123456)');
    return false;
  }

  // Required fields
  if (!data.businessName || !data.firstName || !data.lastName || !data.city) {
    showToast('Please fill in all required fields');
    return false;
  }

  // Dropdown required
  if (!data.region || !data.businessCategory) {
    showToast('Please select your region and business category');
    return false;
  }

  return true;
}

// Slug helper
function slugify(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Setup real-time validation
function setupValidation() {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const phoneInput = document.getElementById('phone');

  if (emailInput) {
    emailInput.addEventListener('blur', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      emailInput.style.borderColor =
        emailInput.value && !emailRegex.test(emailInput.value) ? '#e53935' : '#e0e0e0';
    });
  }

  if (confirmPasswordInput && passwordInput) {
    confirmPasswordInput.addEventListener('input', () => {
      confirmPasswordInput.style.borderColor =
        confirmPasswordInput.value && confirmPasswordInput.value !== passwordInput.value
          ? '#e53935'
          : '#e0e0e0';
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener('blur', () => {
      const phoneRegex = /^0[0-9]{9}$/;
      phoneInput.style.borderColor =
        phoneInput.value && !phoneRegex.test(phoneInput.value) ? '#e53935' : '#e0e0e0';
    });
  }
}

// Show toast notification
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  if (!toast || !toastMessage) {
    alert(message);
    return;
  }

  toastMessage.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

console.log('✅ Signup script loaded (module-friendly)');
