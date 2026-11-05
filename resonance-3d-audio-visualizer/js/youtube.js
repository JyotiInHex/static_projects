(function () {
  'use strict';
  const openButton = document.getElementById('bYouTube');
  const panel = document.getElementById('youtubePanel');
  const closeButton = document.getElementById('youtubeClose');
  const form = document.getElementById('youtubeForm');
  const input = document.getElementById('youtubeUrl');
  const frameWrap = document.getElementById('youtubeFrameWrap');
  if (!openButton || !panel || !closeButton || !form || !input || !frameWrap) return;

  let player = null, activeId = '', poll = 0, apiReady = false, pendingId = '';
  const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));
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
    } catch (_) { return ''; }
  }
  function showPanel() { panel.hidden = false; panel.style.display = 'block'; input.focus(); }
  function stopPolling() { if (poll) { clearInterval(poll); poll = 0; } }
  function snapshot() {
    if (!player || typeof player.getCurrentTime !== 'function') return;
    const state = player.getPlayerState();
    emit('resonance:youtube-time', {
      currentTime: player.getCurrentTime() || 0,
      duration: player.getDuration() || 0,
      playing: state === YT.PlayerState.PLAYING
    });
  }
  function startPolling() {
    stopPolling();
    poll = setInterval(snapshot, 400);
  }
  function playerStateChange(event) {
    const state = event.data;
    if (state === YT.PlayerState.PLAYING) startPolling();
    else if (state === YT.PlayerState.PAUSED || state === YT.PlayerState.BUFFERING) stopPolling();
    if (state === YT.PlayerState.ENDED) stopPolling();
    const playing = state === YT.PlayerState.PLAYING;
    const duration = player.getDuration() || 0;
    const currentTime = player.getCurrentTime() || 0;
    emit('resonance:youtube-time', { currentTime, duration, playing });
    if (state === YT.PlayerState.ENDED) emit('resonance:youtube-time', { currentTime: duration, duration, playing: false });
  }
  function createPlayer(videoId) {
    pendingId = videoId;
    if (!apiReady) return;
    frameWrap.innerHTML = '<div id="youtubePlayer"></div>';
    if (player && typeof player.destroy === 'function') { try { player.destroy(); } catch (_) {} }
    player = new YT.Player('youtubePlayer', {
      width: '100%', height: '100%', videoId,
      host: 'https://www.youtube-nocookie.com',
      playerVars: { autoplay: 1, controls: 0, rel: 0, playsinline: 1, enablejsapi: 1 },
      events: {
        onReady: function (event) {
          event.target.playVideo();
          activeId = videoId;
          emit('resonance:youtube', { active: true, playing: true, title: 'YouTube • ' + videoId, duration: event.target.getDuration() || 0, currentTime: 0 });
        },
        onStateChange: playerStateChange,
        onError: function () { emit('resonance:youtube-error', {}); }
      }
    });
  }
  function loadApi() {
    if (window.YT && window.YT.Player) { apiReady = true; if (pendingId) createPlayer(pendingId); return; }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof previous === 'function') previous();
      apiReady = true;
      if (pendingId) createPlayer(pendingId);
    };
    if (!document.querySelector('script[data-youtube-iframe-api]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true; script.dataset.youtubeIframeApi = 'true';
      document.head.appendChild(script);
    }
  }
  function closePanel() {
    stopPolling();
    if (player && typeof player.destroy === 'function') { try { player.destroy(); } catch (_) {} }
    player = null; activeId = ''; pendingId = '';
    frameWrap.innerHTML = '<div class="youtube-placeholder">Your YouTube video will appear here.</div>';
    panel.hidden = true; panel.style.display = 'none';
    emit('resonance:youtube', { active: false });
  }
  openButton.addEventListener('click', function (event) { event.preventDefault(); showPanel(); });
  closeButton.addEventListener('click', closePanel);
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const id = extractVideoId(input.value.trim());
    if (!id) { input.setCustomValidity('Enter a valid YouTube video URL.'); input.reportValidity(); return; }
    input.setCustomValidity('');
    showPanel();
    emit('resonance:youtube', { active: true, playing: false, title: 'Loading YouTube…', duration: 0, currentTime: 0 });
    loadApi();
    if (apiReady) createPlayer(id); else pendingId = id;
  });

  window.resonanceYouTube = {
    deactivate: function () {
      stopPolling();
      if (player && typeof player.stopVideo === 'function') player.stopVideo();
      emit('resonance:youtube', { active: false });
    },
    toggle: function () {
      if (!player) return;
      if (player.getPlayerState() === YT.PlayerState.PLAYING) player.pauseVideo();
      else player.playVideo();
    },
    seekTo: function (seconds) { if (player) player.seekTo(Math.max(0, seconds || 0), true); },
    setVolume: function (value) { if (player) player.setVolume(Math.max(0, Math.min(100, value))); }
  };
})();
