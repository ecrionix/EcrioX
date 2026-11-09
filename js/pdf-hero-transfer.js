/**
 * EcrioX PDF Hero File Transfer & Autoload Controller
 * Enables multi-file drag & drop on the homepage and seamless batch transfer to dedicated PDF tools.
 * Uses client-side IndexedDB for zero-size-limit local file transfer.
 */

(function () {
  'use strict';

  const DB_NAME = 'ecriox_pdf_db';
  const STORE_NAME = 'transfer_files';

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 2);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function storeFiles(files) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const fileArr = Array.isArray(files) ? files : [files];
        store.put(fileArr, 'hero_uploaded_pdfs');
        store.put(fileArr[0], 'hero_uploaded_pdf'); // backwards compatibility
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('IndexedDB store failed, falling back:', e);
      return false;
    }
  }

  async function storeFile(file) {
    return storeFiles([file]);
  }

  async function getStoredFiles() {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get('hero_uploaded_pdfs');
        req.onsuccess = () => {
          if (req.result && Array.isArray(req.result) && req.result.length > 0) {
            resolve(req.result);
          } else {
            // fallback to single file key
            const singleReq = store.get('hero_uploaded_pdf');
            singleReq.onsuccess = () => {
              resolve(singleReq.result ? [singleReq.result] : []);
            };
            singleReq.onerror = () => resolve([]);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB retrieve failed:', e);
      return [];
    }
  }

  async function getStoredFile() {
    const list = await getStoredFiles();
    return list.length > 0 ? list[0] : null;
  }

  async function clearStoredFiles() {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete('hero_uploaded_pdfs');
        store.delete('hero_uploaded_pdf');
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      return false;
    }
  }

  window.EcrioXTransfer = {
    storeFiles,
    storeFile,
    getStoredFiles,
    getStoredFile,
    clearStoredFile: clearStoredFiles,
    clearStoredFiles
  };

  // 1. Homepage Dropzone & Quick Action Logic
  document.addEventListener('DOMContentLoaded', () => {
    const dropzone = document.getElementById('heroPdfDropzone');
    const fileInput = document.getElementById('heroPdfInput');
    const selectBtn = document.getElementById('heroSelectBtn');
    const actionModal = document.getElementById('heroActionModal');
    const modalFilename = document.getElementById('modalSelectedFilename');
    const modalFilesize = document.getElementById('modalSelectedFilesize');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const changeFileBtn = document.getElementById('modalChangeFileBtn');

    if (dropzone && fileInput) {
      let selectedFiles = [];

      if (selectBtn) {
        selectBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          fileInput.click();
        });
      }

      dropzone.addEventListener('click', (e) => {
        if (e.target !== selectBtn && !selectBtn.contains(e.target)) {
          fileInput.click();
        }
      });

      ['dragenter', 'dragover'].forEach(name => {
        dropzone.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(name => {
        dropzone.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove('dragover');
        });
      });

      dropzone.addEventListener('drop', (e) => {
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleIncomingFiles(Array.from(e.dataTransfer.files));
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleIncomingFiles(Array.from(e.target.files));
        }
      });

      function handleIncomingFiles(files) {
        if (!files || files.length === 0) return;

        const validFiles = files.filter(file => {
          const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
          const isImg = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);
          return isPdf || isImg;
        });

        if (validFiles.length === 0) {
          alert('Please select valid PDF documents or image files.');
          fileInput.value = '';
          return;
        }

        selectedFiles = validFiles;
        fileInput.value = '';

        // If user uploaded only images, route straight to JPG to PDF
        const allImages = validFiles.every(f => f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(f.name));
        if (allImages) {
          storeFiles(validFiles).then(() => {
            window.location.href = '/jpg-to-pdf/?transfer=1';
          });
          return;
        }

        // Display quick action modal
        const totalBytes = validFiles.reduce((acc, f) => acc + f.size, 0);
        if (modalFilename) {
          if (validFiles.length === 1) {
            modalFilename.textContent = validFiles[0].name;
          } else {
            modalFilename.textContent = `${validFiles.length} PDF Documents Selected`;
          }
        }
        if (modalFilesize) {
          modalFilesize.textContent = formatBytes(totalBytes);
        }
        if (actionModal) {
          actionModal.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      }

      // Modal Action buttons
      document.querySelectorAll('.hero-action-card').forEach(card => {
        card.addEventListener('click', async (e) => {
          e.preventDefault();
          const route = card.getAttribute('data-route');
          if (!route) return;

          card.classList.add('loading');
          if (selectedFiles && selectedFiles.length > 0) {
            await storeFiles(selectedFiles);
          }

          const separator = route.includes('?') ? '&' : '?';
          window.location.href = `${route}${separator}transfer=1`;
        });
      });

      function closeModal() {
        if (actionModal) {
          actionModal.classList.remove('active');
          document.body.style.overflow = '';
        }
        fileInput.value = '';
      }

      if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
      if (changeFileBtn) {
        changeFileBtn.addEventListener('click', () => {
          closeModal();
          fileInput.click();
        });
      }

      if (actionModal) {
        actionModal.addEventListener('click', (e) => {
          if (e.target === actionModal) closeModal();
        });
      }
    }

    // 2. Autoload on Destination Tool Page if ?transfer=1
    const params = new URLSearchParams(window.location.search);
    if (params.get('transfer') === '1') {
      setTimeout(async () => {
        const files = await getStoredFiles();
        if (files && files.length > 0) {
          const targetInput = document.querySelector('input[type="file"]');
          if (targetInput && typeof DataTransfer !== 'undefined') {
            try {
              const dt = new DataTransfer();
              files.forEach(f => dt.items.add(f));
              targetInput.files = dt.files;
              targetInput.dispatchEvent(new Event('change', { bubbles: true }));
              console.log(`Successfully autoloaded ${files.length} transferred file(s)`);
              clearStoredFiles();
            } catch (err) {
              console.warn('Could not populate file input automatically:', err);
            }
          }
        }
      }, 350);
    }

    function formatBytes(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
  });
})();
