/**
* PHP Email Form Validation - v3.11
* URL: https://bootstrapmade.com/php-email-form/
* Author: BootstrapMade.com
*/
(function () {
  "use strict";

  let forms = document.querySelectorAll('.php-email-form');

  forms.forEach( function(e) {
    e.addEventListener('submit', function(event) {
      event.preventDefault();

      let thisForm = this;
      
      // Safely show/hide loading and message elements
      const loadingEl = thisForm.querySelector('.loading');
      const errorEl = thisForm.querySelector('.error-message');
      const sentEl = thisForm.querySelector('.sent-message');
      
      if (loadingEl) loadingEl.classList.add('d-block');
      if (errorEl) errorEl.classList.remove('d-block');
      if (sentEl) sentEl.classList.remove('d-block');

      // Submit form directly using async function
      php_email_form_submit(thisForm).catch(error => {
        console.error('Form submission error:', error);
      });
    });
  });

  async function php_email_form_submit(thisForm) {
    const loadingEl = thisForm.querySelector('.loading');
    const errorEl = thisForm.querySelector('.error-message');
    const sentEl = thisForm.querySelector('.sent-message');
    
    try {
      // Get form field values
      const nameInput = thisForm.querySelector('[name="name"]');
      const emailInput = thisForm.querySelector('[name="email"]');
      const subjectInput = thisForm.querySelector('[name="subject"]');
      const messageInput = thisForm.querySelector('[name="message"]');

      // Validate that form fields exist
      if (!nameInput || !emailInput || !subjectInput || !messageInput) {
        throw new Error('Form fields are missing. Please refresh the page and try again.');
      }

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const subject = subjectInput.value.trim();
      const message = messageInput.value.trim();

      // Basic validation
      if (!name || !email || !subject || !message) {
        throw new Error('Please fill in all required fields.');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address.');
      }

      // Prepare email API payload
      const emailPayload = {
        "subject": subject || "Contact Form Submission",
        "from": "johnmfula360@gmail.com",
        "to": "johnmfula360@gmail.com",
        "smtp_server": "smtp.gmail.com",
        "smtp_port": "587",
        "smtp_username": "johnmfula360@gmail.com",
        "smtp_password": "test",
        "body": `Contact Form Submission\n\nFull Name: ${name}\nEmail Address: ${email}\n\nMessage:\n${message}`
      };

      // Use the email API endpoint
      const apiEndpoint = 'https://loan-schedule-api.rains.toolzm.com/api/send/otp';

      // Try multiple methods to send the request
      let success = false;
      let lastError = null;

      // Method 1: Try direct fetch first
      try {
        const response = await sendWithFetch(apiEndpoint, emailPayload);
        if (response) {
          success = true;
          handleSuccess(thisForm, response);
        }
      } catch (fetchError) {
        lastError = fetchError;
        console.log('Direct fetch failed, trying with CORS proxy...', fetchError);
        
        // Method 2: Try with CORS proxy
        try {
          const proxyResponse = await sendWithCorsProxy(apiEndpoint, emailPayload);
          if (proxyResponse) {
            success = true;
            handleSuccess(thisForm, proxyResponse);
          }
        } catch (proxyError) {
          lastError = proxyError;
          console.log('CORS proxy method failed, trying XMLHttpRequest...', proxyError);
          
          // Method 3: Fallback to XMLHttpRequest
          try {
            const xhrSuccess = await sendWithXHR(apiEndpoint, emailPayload);
            if (xhrSuccess) {
              success = true;
              handleSuccess(thisForm, xhrSuccess);
            }
          } catch (xhrError) {
            lastError = xhrError;
            console.log('XMLHttpRequest method also failed', xhrError);
          }
        }
      }

      if (!success) {
        throw lastError || new Error('All request methods failed. Please try again later.');
      }

    } catch (error) {
      // Handle all errors
      if (loadingEl) loadingEl.classList.remove('d-block');
      displayError(thisForm, error.message || 'An unexpected error occurred. Please try again.');
    }
  }

  // Method 1: Send with fetch using async/await (direct)
  async function sendWithFetch(apiEndpoint, emailPayload) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload),
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText || `Server error: ${response.status}` };
        }
        throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
      }

      const responseText = await response.text();
      try {
        return JSON.parse(responseText);
      } catch (e) {
        return { success: true, message: responseText };
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  }

  // Method 2: Send with CORS proxy to bypass CORS restrictions
  async function sendWithCorsProxy(apiEndpoint, emailPayload) {
    // Try multiple CORS proxy approaches
    const proxyMethods = [
      // Method 2a: allorigins proxy
      async () => {
        const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(apiEndpoint);
        const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload)
        });
        if (response.ok) {
          const text = await response.text();
          try {
            return JSON.parse(text);
          } catch (e) {
            return { success: true, message: text };
          }
        }
        throw new Error(`Status: ${response.status}`);
      },
      // Method 2b: corsproxy.io
      async () => {
        const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(apiEndpoint);
        const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload)
        });
        if (response.ok) {
          const text = await response.text();
          try {
            return JSON.parse(text);
          } catch (e) {
            return { success: true, message: text };
          }
        }
        throw new Error(`Status: ${response.status}`);
      },
      // Method 2c: Using Yacdn.org proxy
      async () => {
        const proxyUrl = 'https://yacdn.org/proxy/' + apiEndpoint;
        const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload)
        });
        if (response.ok) {
          const text = await response.text();
          try {
            return JSON.parse(text);
          } catch (e) {
            return { success: true, message: text };
          }
        }
        throw new Error(`Status: ${response.status}`);
      }
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    for (let i = 0; i < proxyMethods.length; i++) {
      try {
        const result = await Promise.race([
          proxyMethods[i](),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 25000)
          )
        ]);
        clearTimeout(timeoutId);
        return result;
      } catch (proxyError) {
        console.log(`Proxy method ${i + 1} failed:`, proxyError);
        if (i === proxyMethods.length - 1) {
          clearTimeout(timeoutId);
          throw new Error('All CORS proxy methods failed. The API server may need to enable CORS.');
        }
        continue;
      }
    }

    clearTimeout(timeoutId);
    throw new Error('All CORS proxy methods failed.');
  }

  // Method 2: Send with XMLHttpRequest (fallback)
  function sendWithXHR(apiEndpoint, emailPayload) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let timeoutId = setTimeout(() => {
        xhr.abort();
        reject(new Error('Request timed out. Please try again.'));
      }, 30000);

      xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          clearTimeout(timeoutId);
          
          if (xhr.status === 200 || xhr.status === 201) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (e) {
              resolve({ success: true, message: xhr.responseText });
            }
          } else if (xhr.status === 0) {
            reject(new Error('CORS or network error. The server may not allow cross-origin requests.'));
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.message || errorData.error || `Server error: ${xhr.status}`));
            } catch (e) {
              reject(new Error(`Server error: ${xhr.status} ${xhr.statusText}`));
            }
          }
        }
      };

      xhr.onerror = function() {
        clearTimeout(timeoutId);
        reject(new Error('Network error. Please check your internet connection.'));
      };

      xhr.ontimeout = function() {
        clearTimeout(timeoutId);
        reject(new Error('Request timed out. Please try again.'));
      };

      xhr.timeout = 30000;
      xhr.open('POST', apiEndpoint, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(emailPayload));
    });
  }

  // Handle successful response
  function handleSuccess(thisForm, data) {
    const loadingEl = thisForm.querySelector('.loading');
    const sentEl = thisForm.querySelector('.sent-message');
    
    if (loadingEl) loadingEl.classList.remove('d-block');
    
    if (data && (data.success === false || data.error)) {
      displayError(thisForm, data.error || data.message || 'Email sending failed. Please try again.');
    } else {
      if (sentEl) sentEl.classList.add('d-block');
      thisForm.reset();
    }
  }

  function displayError(thisForm, error) {
    thisForm.querySelector('.loading').classList.remove('d-block');
    const errorElement = thisForm.querySelector('.error-message');
    if (errorElement) {
      // Convert newlines to <br> for better display
      const formattedError = String(error).replace(/\n/g, '<br>');
      errorElement.innerHTML = formattedError;
      errorElement.classList.add('d-block');
      
      // Log error to console for debugging
      console.error('Form submission error:', error);
    }
  }

})();
