(function () {
  'use strict';
  const openButton = document.getElementById('bYouTube');
  const panel = document.getElementById('youtubePanel');
  const closeButton = document.getElementById('youtubeClose');
  const form = document.getElementById('youtubeForm');
  const input = document.getElementById('youtubeUrl');
  const frameWrap = document.getElementById('youtubeFrameWrap');
  if (!openButton || !panel || !closeButton || !form || !input || !frameWrap) return;

  function extractVideoId(value) {
    try {
      const url = new URL(value);
      const host = url.hostname.toLowerCase().replace(/^www\./, '');
      let id = '';
      if (host === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] || '';
      else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
        if (url.pathname === '/watch') id = url.searchParams.get('v') || '';
        else if (/^\/(embed|shorts|live)\//.test(url.pathname)) id = url.pathname.split('/')[2] || '';
      }
      return /^[\w-]{11}$/.test(id) ? id : '';
    } catch (_) {
      return '';
    }
  }

  function showPanel() {
    panel.hidden = false;
    panel.style.display = 'block';
    input.focus();
  }

  function closePanel() {
    panel.hidden = true;
    panel.style.display = 'none';
    frameWrap.innerHTML = '<div class="youtube-placeholder">Your YouTube video will appear here.</div>';
  }

  openButton.addEventListener('click', function (event) {
    event.preventDefault();
    showPanel();
  });
  closeButton.addEventListener('click', closePanel);

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const id = extractVideoId(input.value.trim());
    if (!id) {
      input.setCustomValidity('Enter a valid YouTube video URL.');
      input.reportValidity();
      input.addEventListener('input', function clearError() {
        input.setCustomValidity('');
        input.removeEventListener('input', clearError);
      });
      return;
    }
    input.setCustomValidity('');
    frameWrap.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.title = 'YouTube music player';
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&controls=1&rel=0&playsinline=1';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; web-share';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    frameWrap.appendChild(iframe);
  });
})();