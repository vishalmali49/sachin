(() => {
  const STORAGE_KEY = 'procut-site-edits-v1';
  const EMAIL_KEY = 'procut-sales-email-v1';
  const body = document.body;
  const panel = document.querySelector('#editorPanel');
  const launcher = document.querySelector('#editLauncher');
  const banner = document.querySelector('#editBanner');
  const message = document.querySelector('#editorMessage');
  const emailInput = document.querySelector('#salesEmail');
  let editMode = false;

  const editableText = () => [...document.querySelectorAll('[data-editable]')];
  const editableImages = () => [...document.querySelectorAll('[data-editable-image]')];

  function capture() {
    const text = {};
    editableText().forEach(el => { text[el.dataset.editable] = el.innerHTML; });
    const images = {};
    editableImages().forEach(el => {
      images[el.dataset.editableImage] = el.tagName.toLowerCase() === 'img' ? el.src : getComputedStyle(el).backgroundImage;
    });
    return { text, images, email: emailInput.value.trim() };
  }

  function applySaved() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved?.text) editableText().forEach(el => {
        if (Object.prototype.hasOwnProperty.call(saved.text, el.dataset.editable)) el.innerHTML = saved.text[el.dataset.editable];
      });
      if (saved?.images) editableImages().forEach(el => {
        const value = saved.images[el.dataset.editableImage];
        if (!value) return;
        if (el.tagName.toLowerCase() === 'img') el.src = value;
        else if (value.startsWith('url(')) el.style.backgroundImage = value;
        else el.style.backgroundImage = `url("${value.replaceAll('"', '\\"')}")`;
      });
      emailInput.value = localStorage.getItem(EMAIL_KEY) || saved?.email || '';
    } catch (e) {
      console.warn('Could not load local website edits.', e);
    }
  }

  function setEditMode(value) {
    editMode = value;
    body.classList.toggle('editor-active', value);
    banner.hidden = !value;
    launcher.innerHTML = value ? '<span>✳</span> Editing…' : '<span>✳</span> Edit site';
    editableText().forEach(el => {
      el.contentEditable = value ? 'true' : 'false';
      el.spellcheck = value;
    });
    if (!value) editableImages().forEach(el => el.removeAttribute('title'));
  }

  function openEditor() {
    panel.hidden = false;
    setEditMode(true);
  }
  launcher.addEventListener('click', () => panel.hidden ? openEditor() : (panel.hidden = true));
  document.querySelector('#closeEditor').addEventListener('click', () => { panel.hidden = true; setEditMode(false); });
  document.querySelector('#doneEditing').addEventListener('click', () => { setEditMode(false); panel.hidden = true; });

  editableImages().forEach(el => {
    el.addEventListener('click', event => {
      if (!editMode) return;
      event.preventDefault();
      event.stopPropagation();
      const current = el.tagName.toLowerCase() === 'img' ? el.src : (el.style.backgroundImage || '').replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
      const next = prompt('Enter an image URL or a relative path (for example assets/my-machine.jpg):', current.startsWith('http') ? current : current);
      if (next === null || !next.trim()) return;
      const value = next.trim();
      if (el.tagName.toLowerCase() === 'img') el.src = value;
      else el.style.backgroundImage = `url("${value.replaceAll('"', '\\"')}")`;
      message.textContent = 'Image changed in preview. Click Save changes to keep it in this browser.';
    });
  });

  document.querySelector('#saveEdits').addEventListener('click', () => {
    try {
      const data = capture();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(EMAIL_KEY, data.email);
      message.textContent = 'Saved in this browser. Export a backup to move your edits elsewhere.';
    } catch (e) {
      message.textContent = 'Could not save. Your browser storage may be full or disabled.';
    }
  });

  document.querySelector('#exportEdits').addEventListener('click', () => {
    const data = capture();
    data.email = emailInput.value.trim();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'procut-website-edits.json'; a.click();
    URL.revokeObjectURL(url);
    message.textContent = 'Backup exported. Keep it safe to reuse your edits.';
  });

  document.querySelector('#importEdits').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || typeof data !== 'object' || (!data.text && !data.images)) throw new Error('Invalid file');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(EMAIL_KEY, data.email || '');
      location.reload();
    } catch {
      message.textContent = 'That backup file could not be read.';
    }
  });

  document.querySelector('#resetEdits').addEventListener('click', () => {
    if (!confirm('Reset saved edits in this browser? This cannot be undone unless you exported a backup.')) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(EMAIL_KEY);
    location.reload();
  });

  document.querySelector('#quoteForm').addEventListener('submit', event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = emailInput.value.trim() || localStorage.getItem(EMAIL_KEY) || '';
    if (!email || email === 'sales@example.com') {
      document.querySelector('#formStatus').textContent = 'Please set your real sales email using Edit site before sending an enquiry.';
      panel.hidden = false;
      return;
    }
    const subject = encodeURIComponent(`PROCUT SYSTEMS enquiry — ${form.get('machine')}`);
    const bodyText = encodeURIComponent(
`Name: ${form.get('name')}
Company: ${form.get('company')}
Phone: ${form.get('phone')}
Email: ${form.get('email')}
Machine requirement: ${form.get('machine')}

Project details:
${form.get('details')}`
    );
    document.querySelector('#formStatus').textContent = 'Opening your email application…';
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${bodyText}`;
  });

  const mobileMenu = document.querySelector('.mobile-menu');
  const nav = document.querySelector('#nav');
  mobileMenu.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    mobileMenu.setAttribute('aria-expanded', String(open));
    mobileMenu.textContent = open ? '✕' : '☰';
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open'); mobileMenu.setAttribute('aria-expanded', 'false'); mobileMenu.textContent = '☰';
  }));
  document.querySelector('#year').textContent = new Date().getFullYear();
  applySaved();
  setEditMode(false);
})();