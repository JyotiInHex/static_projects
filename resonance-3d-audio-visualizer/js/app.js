(function () {
  // ---------- Three.js scene ----------
  const COLS = 64, ROWS = 40, W = 40, D = 24, MAX_H = 9;
  const stage = document.getElementById('stage');
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  let quality = "ultra";
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0xffffff, 1);
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xffffff, 24, 52);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 14, 30);
  camera.lookAt(0, 1, -2);

  // grid of lines whose heights come from a scrolling spectrum history
  const N = COLS * ROWS;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const i = (r * COLS + c) * 3;
    pos[i] = (c / (COLS - 1) - 0.5) * W;
    pos[i + 2] = (r / (ROWS - 1) - 0.5) * D;
  }
  const idx = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const i = r * COLS + c;
    if (c < COLS - 1) idx.push(i, i + 1);
    if (r < ROWS - 1) idx.push(i, i + COLS);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(idx);
  const waveObj = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, fog: true }));
  scene.add(waveObj);

  const heights = new Float32Array(N);
  const cLow = new THREE.Color(0xcbd5e1), cMid = new THREE.Color(0x4f46e5), cHigh = new THREE.Color(0xec4899), tmp = new THREE.Color();
  function paint(i, t) {
    if (t < 0.6) tmp.copy(cLow).lerp(cMid, t / 0.6); else tmp.copy(cMid).lerp(cHigh, (t - 0.6) / 0.4);
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
  }

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  // ---------- Visualizer modes ----------
  let mode = 'wave';
  const spec = new Float32Array(COLS); // smoothed spectrum, bass in the centre
  const BARS = 64, RING = 96, RINGS = 22, PER = 100;
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const makeBars = n => { const g = new THREE.Group(); for (let i = 0; i < n; i++) g.add(new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ fog: false }))); scene.add(g); return g; };
  const bars = makeBars(BARS), circ = makeBars(RING);
  bars.children.forEach((m, i) => { m.position.x = (i / (BARS - 1) - 0.5) * W; });
  bars.position.y = -5;

  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const g2 = cv.getContext('2d'); g2.beginPath(); g2.arc(32, 32, 30, 0, Math.PI * 2); g2.fillStyle = '#fff'; g2.fill();
  const pPos = new Float32Array(RINGS * PER * 3), pCol = new Float32Array(RINGS * PER * 3);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  const pts = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.5, map: new THREE.CanvasTexture(cv), vertexColors: true, transparent: true, alphaTest: 0.4, depthWrite: false, fog: false }));
  pts.frustumCulled = false;
  scene.add(pts);

  const ramp = t => { if (t < 0.6) tmp.copy(cLow).lerp(cMid, t / 0.6); else tmp.copy(cMid).lerp(cHigh, (t - 0.6) / 0.4); return tmp; };
  // ---------- Sphere: audio-reactive particle ball ----------
  const BALL_R = 9, SHELL = 2200, FILL = 1100, NB = SHELL + FILL;
  let CRACKLE = 0.85, HOVER = 0.7;
  const baseCol = new THREE.Color(0xF25BD0), loudCol = new THREE.Color(0x4f46e5), sparkCol = new THREE.Color(0x06b6d4), white = new THREE.Color(1, 1, 1);
  const dir = new Float32Array(NB * 3), baseR = new Float32Array(NB), bIdx = new Uint8Array(NB), spark = new Float32Array(NB);
  for (let i = 0; i < NB; i++) {
    const shell = i < SHELL;
    const y = shell ? 1 - 2 * (i + 0.5) / SHELL : Math.random() * 2 - 1;
    const ph = shell ? i * 2.399963 : Math.random() * Math.PI * 2, rr = Math.sqrt(1 - y * y);
    dir[i * 3] = Math.cos(ph) * rr; dir[i * 3 + 1] = y; dir[i * 3 + 2] = Math.sin(ph) * rr;
    baseR[i] = shell ? BALL_R : BALL_R * 0.88 * Math.cbrt(Math.random());
    bIdx[i] = Math.round(31 - Math.abs(y) * 31); // bass at the equator, highs at the poles
  }
  const bPos = new Float32Array(NB * 3), bCol = new Float32Array(NB * 3);
  const bGeo = new THREE.BufferGeometry();
  bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
  bGeo.setAttribute('color', new THREE.BufferAttribute(bCol, 3));
  const ballPts = new THREE.Points(bGeo, new THREE.PointsMaterial({ size: 0.28, map: new THREE.CanvasTexture(cv), vertexColors: true, transparent: true, alphaTest: 0.4, depthWrite: false, fog: false }));
  ballPts.frustumCulled = false;
  const ringPts = [];
  for (let i = 0; i <= 128; i++) { const a = i / 128 * Math.PI * 2; ringPts.push(new THREE.Vector3(Math.cos(a) * BALL_R * 1.35, Math.sin(a) * BALL_R * 1.35, 0)); }
  const rings = [0, 1].map(j => {
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts), new THREE.LineBasicMaterial({ color: 0xc7d2fe, fog: false }));
    l.rotation.x = 1.2 + j * 0.7; l.rotation.y = j * 0.9; return l;
  });
  const ball = new THREE.Group();
  ball.add(ballPts, ...rings);
  scene.add(ball);

  const ptr = new THREE.Vector2(9, 9), ray = new THREE.Raycaster(), sph = new THREE.Sphere(new THREE.Vector3(), BALL_R * 1.15), hit = new THREE.Vector3();
  let hover = 0;
  renderer.domElement.addEventListener('pointermove', e => ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1));
  renderer.domElement.addEventListener('pointerleave', () => ptr.set(9, 9));

  function updateBall(time) {
    ball.rotation.set(0.35, time * 0.0002, 0);
    ball.scale.setScalar(1 + spec[31] * 0.1);
    rings[0].rotation.z = time * 0.0005; rings[1].rotation.z = -time * 0.0004;
    ball.updateMatrixWorld();
    ray.setFromCamera(ptr, camera);
    const on = !!ray.ray.intersectSphere(sph, hit);
    if (on) ball.worldToLocal(hit);
    hover += ((on ? 1 : 0) - hover) * 0.1;
    for (let i = 0; i < NB; i++) {
      const v = spec[bIdx[i]], k3 = i * 3;
      if (spark[i] > 0.02) spark[i] *= 0.9; else spark[i] = Math.random() < 0.002 * CRACKLE * (1 + v * 4) ? 1 : 0;
      const r = baseR[i] + v * 5 * (i < SHELL ? 1 : 0.45) + spark[i] * 0.5;
      let x = dir[k3] * r, y = dir[k3 + 1] * r, z = dir[k3 + 2] * r;
      if (hover > 0.01) {
        const dx = x - hit.x, dy = y - hit.y, dz = z - hit.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < 4) { const p = Math.pow(1 - d / 4, 2) * HOVER * hover * 3.5; x += dir[k3] * p; y += dir[k3 + 1] * p; z += dir[k3 + 2] * p; }
      }
      bPos[k3] = x; bPos[k3 + 1] = y; bPos[k3 + 2] = z;
      tmp.copy(baseCol).lerp(loudCol, Math.min(v * 1.3, 1));
      if (spark[i] > 0) tmp.lerp(sparkCol, spark[i]);
      if (i >= SHELL) tmp.lerp(white, 0.45);
      bCol[k3] = tmp.r; bCol[k3 + 1] = tmp.g; bCol[k3 + 2] = tmp.b;
    }
    bGeo.attributes.position.needsUpdate = true; bGeo.attributes.color.needsUpdate = true;
  }

  // Liquid Sphere: a deformable mesh driven by the existing analyser/spec data.
  const LIQUID_RADIUS = 8;
  const liquidGeo = new THREE.SphereGeometry(LIQUID_RADIUS, 72, 48);
  const liquidBase = new Float32Array(liquidGeo.attributes.position.array);
  const liquidMat = new THREE.MeshPhongMaterial({ color: 0x00ff41, emissive: 0x003b10, specular: 0x99ffbb, shininess: 90 });
  const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
  const liquidWire = new THREE.Mesh(liquidGeo, new THREE.MeshBasicMaterial({ color: 0x70ff92, wireframe: true, transparent: true, opacity: 0.12 }));
  const liquid = new THREE.Group();
  liquid.add(liquidMesh, liquidWire);
  liquid.visible = false;
  scene.add(liquid);
  scene.add(new THREE.AmbientLight(0xffffff, 0.72));
  const liquidLight = new THREE.PointLight(0x70ff92, 1.7, 45);
  liquidLight.position.set(-8, 10, 12);
  scene.add(liquidLight);

  function updateLiquid(time) {
    liquid.rotation.y = time * 0.00022;
    liquid.rotation.x = Math.sin(time * 0.00025) * 0.12;
    const positions = liquidGeo.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = liquidBase[i], y = liquidBase[i + 1], z = liquidBase[i + 2];
      const yn = y / LIQUID_RADIUS;
      const angle = Math.atan2(z, x);
      const wave = Math.sin(angle * 3 + time * 0.0005) * 0.5 + 0.5;
      const bin = Math.max(0, Math.min(spec.length - 1, Math.floor((Math.abs(yn) * 0.65 + wave * 0.35) * (spec.length - 1))));
      const v = spec[bin];
      const ripple = Math.sin(angle * 5 + time * 0.0012) * 0.12 + Math.cos(yn * 9 - time * 0.001) * 0.08;
      const radius = LIQUID_RADIUS + ripple + v * (2.4 * sens);
      const scale = radius / LIQUID_RADIUS;
      positions[i] = x * scale; positions[i + 1] = y * scale; positions[i + 2] = z * scale;
    }
    liquidGeo.attributes.position.needsUpdate = true;
    liquidGeo.computeVertexNormals();
    liquidMesh.material.emissiveIntensity = 0.3 + spec[31] * 1.1;
    liquidLight.intensity = 1.2 + spec[31] * 1.8;
  }

  const CAMS = { wave: [0, 14, 30, 0, 1, -2], bars: [0, 2, 34, 0, 0, 0], circle: [0, 0, 36, 0, 0, 0], particles: [0, 0, 32, 0, 0, 0], sphere: [0, 0, 38, 0, 0, 0], liquidSphere: [0, 0, 27, 0, 0, 0] };
  const look = new THREE.Vector3(0, 1, -2), camGoal = new THREE.Vector3(), lookGoal = new THREE.Vector3();
  const modeBtns = document.querySelectorAll('.modes button');
  function setMode(m) {
    mode = m;
    waveObj.visible = m === 'wave'; bars.visible = m === 'bars'; circ.visible = m === 'circle'; pts.visible = m === 'particles'; ball.visible = m === 'sphere'; liquid.visible = m === 'liquidSphere';
    modeBtns.forEach(b => b.classList.toggle('on', b.dataset.m === m));
  }
  modeBtns.forEach(b => { b.onclick = () => setMode(b.dataset.m); });
  setMode('wave');

  function updateMode(time) {
    for (let c = 0; c < COLS; c++) {
      const d = Math.abs(c - (COLS - 1) / 2) / ((COLS - 1) / 2);
      let t = 0;
      if (state === 'playing' || state === 'mic') t = Math.min(1, Math.pow(data[Math.floor(Math.pow(d, 1.6) * 140)] / 255, 1.6) * sens);
      else if (state === 'idle' && !buffer) t = 0.08 * (Math.sin(time * 0.0015 + d * 6) * 0.5 + 0.5);
      spec[c] = spec[c] * 0.6 + t * 0.4;
    }
    if (mode === 'bars') {
      bars.children.forEach((m, i) => { const v = spec[i], h = 0.3 + v * 14; m.scale.set(0.46, h, 0.46); m.position.y = h / 2; m.material.color.copy(ramp(0.2 + v * 0.8)); });
    } else if (mode === 'circle') {
      circ.rotation.z = time * 0.0001;
      circ.children.forEach((m, i) => {
        const u = i / RING, v = spec[Math.round(31 - Math.min(u, 1 - u) * 2 * 31)], h = 0.4 + v * 8, a = Math.PI / 2 + u * Math.PI * 2, r = 7 + h / 2;
        m.position.set(Math.cos(a) * r, Math.sin(a) * r, 0); m.rotation.z = a - Math.PI / 2; m.scale.set(0.35, h, 0.35);
        m.material.color.copy(ramp(0.2 + v * 0.8));
      });
    } else if (mode === 'particles') {
      pts.rotation.z = time * 0.00015;
      for (let r = 0; r < RINGS; r++) for (let k = 0; k < PER; k++) {
        const u = k / PER, v = spec[Math.round(31 - Math.min(u, 1 - u) * 2 * 31)], a = Math.PI / 2 + u * Math.PI * 2, rad = 3 + r * 0.55 + v * (1.5 + r * 0.18), i = (r * PER + k) * 3;
        pPos[i] = Math.cos(a) * rad; pPos[i + 1] = Math.sin(a) * rad; pPos[i + 2] = Math.sin(time * 0.002 + r * 0.5) * v * 3;
        ramp(0.15 + Math.min(v * 1.4, 1) * 0.85); pCol[i] = tmp.r; pCol[i + 1] = tmp.g; pCol[i + 2] = tmp.b;
      }
      pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
    }
    if (mode === 'sphere') updateBall(time);
    else if (mode === 'liquidSphere') updateLiquid(time);
    const c = CAMS[mode], k = innerWidth / innerHeight < 0.8 ? 1.5 : 1;
    camera.position.lerp(camGoal.set(c[0], c[1], c[2] * k), 0.08);
    look.lerp(lookGoal.set(c[3], c[4], c[5]), 0.08);
    camera.lookAt(look);
  }

  // ---------- App: audio engine, playlist, settings ----------
  const ic = n => '<svg class="i"><use href="#i-' + n + '"/></svg>';
  const prefs = Object.assign({ mode: 'liquidSphere', color: '#00FF41', sens: 1.7, crackle: 0.85, hover: 0.7, vol: 0.8, quality: 'ultra' }, (() => { try { return JSON.parse(localStorage.getItem('resonance') || '{}'); } catch (e) { return {}; } })());
  const save = () => { try { localStorage.setItem('resonance', JSON.stringify(prefs)); } catch (e) {} };
  let ctx, analyser, gain, data, buffer, src, micStream, micNode;
  let state = 'idle'; // idle | playing | paused | ended | mic
  let tStart = 0, vol = prefs.vol, muted = false, sens = 1, shuffle = false, repeat = false, cur = -1, token = 0, drag = false;
  const list = []; // { file, name }
  const seek = document.getElementById('seek'), volEl = document.getElementById('vol');
  const fmt = t => { t = Math.max(0, t | 0); return (t / 60 | 0) + ':' + String(t % 60).padStart(2, '0'); };
  const setName = t => { document.getElementById('name').textContent = t; };
  const tNow = () => !buffer || !ctx ? 0 : state === 'ended' ? buffer.duration : Math.min(buffer.duration, Math.max(0, ctx.currentTime - tStart));
  const fillRange = el => el.style.setProperty('--p', (el.value - el.min) / (el.max - el.min) * 100 + '%');
  function toast(m) { const t = document.getElementById('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2600); }

  function ensureAudio() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = ctx.createAnalyser(); analyser.fftSize = 512; analyser.smoothingTimeConstant = 0.75;
    gain = ctx.createGain();
    analyser.connect(gain); gain.connect(ctx.destination); // visuals read before the volume stage
    data = new Uint8Array(analyser.frequencyBinCount);
    applyGain();
  }
  const applyGain = () => { if (gain) gain.gain.value = state === 'mic' ? 0 : muted ? 0 : vol; };

  function refresh() {
    document.getElementById('play').innerHTML = ic(state === 'playing' ? 'pause' : 'play');
    document.getElementById('empty').classList.toggle('hide', list.length > 0 || state === 'mic');
    document.getElementById('mic').classList.toggle('on', state === 'mic');
    document.getElementById('shuf').classList.toggle('on', shuffle); document.getElementById('rep').classList.toggle('on', repeat);
    document.getElementById('mute').innerHTML = ic(muted || vol === 0 ? 'volx' : 'vol');
    document.getElementById('seekbox').classList.toggle('off', !buffer);
  }

  function renderList() {
    const ul = document.getElementById('plist'); ul.textContent = '';
    list.forEach((t, i) => {
      const li = document.createElement('li'), n = document.createElement('span'), s = document.createElement('span');
      li.className = i === cur ? 'on' : ''; n.className = 'n'; n.textContent = i + 1; s.textContent = t.name;
      li.append(n, s); li.onclick = () => go(i); ul.append(li);
    });
    document.getElementById('count').textContent = list.length + (list.length === 1 ? ' track' : ' tracks');
  }

  function stopSrc() { if (src) { src.onended = null; try { src.stop(); } catch (e) {} src = null; } }

  function play(offset, paused) {
    stopSrc();
    const s = src = ctx.createBufferSource();
    s.buffer = buffer; s.connect(analyser);
    s.onended = () => { if (src === s) { state = 'ended'; if (!step(1, true)) refresh(); } };
    tStart = ctx.currentTime - offset;
    s.start(0, offset);
    state = paused ? 'paused' : 'playing';
    if (!paused && ctx.state === 'suspended') ctx.resume();
    applyGain(); refresh();
    if (!paused) setTimeout(() => { if (state === 'playing' && ctx.state === 'suspended') toast('Click anywhere on the page to start audio'); }, 500);
  }
  const doSeek = t => { if (buffer) play(Math.max(0, Math.min(t, buffer.duration - 0.1)), state === 'paused'); };

  async function go(i) {
    if (i < 0 || i >= list.length) return false;
    ensureAudio(); stopMic();
    const my = ++token; cur = i; renderList(); setName('Loading…');
    try {
      const b = await ctx.decodeAudioData(await list[i].file.arrayBuffer());
      if (my !== token) return true;
      buffer = b; setName(list[i].name); document.getElementById('dur').textContent = fmt(b.duration); play(0, false);
    } catch (e) {
      if (my === token) { buffer = null; stopSrc(); state = 'idle'; setName(list[i].name); toast('Could not decode that file'); refresh(); }
    }
    return true;
  }

  function step(dir, auto) {
    if (!list.length) return false;
    let n;
    if (shuffle && list.length > 1) { do n = Math.floor(Math.random() * list.length); while (n === cur); }
    else { n = cur + dir; if (n >= list.length || n < 0) { if (auto && !repeat) return false; n = (n + list.length) % list.length; } }
    go(n); return true;
  }
  const prev = () => { if (buffer && tNow() > 3) doSeek(0); else step(-1); };

  async function toggle() {
    if (state === 'mic') return;
    if (!buffer) return list.length ? go(Math.max(cur, 0)) : document.getElementById('file').click();
    if (state === 'playing') { await ctx.suspend(); state = 'paused'; }
    else if (state === 'paused') { await ctx.resume(); state = 'playing'; }
    else play(0, false);
    refresh();
  }

  function addFiles(files) {
    const fs = [...files].filter(f => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac|opus|weba)$/i.test(f.name));
    if (!fs.length) return toast('No audio files found');
    const first = list.length;
    fs.forEach(f => list.push({ file: f, name: f.name.replace(/\.[^.]+$/, '') }));
    renderList(); refresh();
    if (state !== 'playing') go(first); else toast(fs.length + (fs.length === 1 ? ' track' : ' tracks') + ' added');
  }

  function stopMic() {
    if (!micStream) return;
    micStream.getTracks().forEach(t => t.stop()); micNode.disconnect(); micStream = micNode = null;
    state = 'idle'; applyGain(); refresh();
  }
  async function toggleMic() {
    if (micStream) { setName(list[cur] ? list[cur].name : 'No track loaded'); return stopMic(); }
    try {
      ensureAudio();
      const st = await navigator.mediaDevices.getUserMedia({ audio: true });
      token++; stopSrc(); buffer = null;
      micStream = st; micNode = ctx.createMediaStreamSource(st); micNode.connect(analyser);
      state = 'mic'; if (ctx.state === 'suspended') ctx.resume();
      applyGain(); setName('Microphone (live)'); document.getElementById('cur').textContent = document.getElementById('dur').textContent = '0:00'; seek.value = 0; fillRange(seek); refresh();
    } catch (e) { toast('Microphone unavailable or permission denied'); }
  }

  function tickUI() {
    if (!buffer || drag) return;
    const p = tNow();
    seek.value = p / buffer.duration * 1000; fillRange(seek); document.getElementById('cur').textContent = fmt(p);
  }

  // controls
  document.getElementById('play').onclick = toggle; document.getElementById('next').onclick = () => step(1); document.getElementById('prev').onclick = prev;
  document.getElementById('shuf').onclick = () => { shuffle = !shuffle; refresh(); };
  document.getElementById('rep').onclick = () => { repeat = !repeat; refresh(); };
  document.getElementById('mic').onclick = document.getElementById('micBig').onclick = toggleMic;
  document.getElementById('pick').onclick = document.getElementById('add').onclick = () => document.getElementById('file').click();
  document.getElementById('file').onchange = e => { addFiles(e.target.files); e.target.value = ''; };
  document.getElementById('clear').onclick = () => {
    token++; stopSrc(); list.length = 0; cur = -1; buffer = null; if (state !== 'mic') state = 'idle';
    setName(micStream ? 'Microphone (live)' : 'No track loaded'); document.getElementById('cur').textContent = document.getElementById('dur').textContent = '0:00'; seek.value = 0; fillRange(seek);
    renderList(); applyGain(); refresh();
  };
  seek.oninput = () => { if (buffer) { drag = true; document.getElementById('cur').textContent = fmt(seek.value / 1000 * buffer.duration); } };
  seek.onchange = () => { drag = false; doSeek(seek.value / 1000 * buffer.duration); };
  volEl.oninput = () => { vol = volEl.value / 100; muted = false; prefs.vol = vol; save(); applyGain(); refresh(); };
  document.getElementById('mute').onclick = () => { muted = !muted; applyGain(); refresh(); };
  document.getElementById('full').onclick = () => {
    const el = document.documentElement;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => {}); else toast('Fullscreen is not supported here');
  };

  // drawers
  const drawers = { list: document.getElementById('dList'), set: document.getElementById('dSet') };
  function openDrawer(k) { Object.keys(drawers).forEach(n => drawers[n].classList.toggle('open', n === k && !drawers[n].classList.contains('open'))); document.getElementById('bList').classList.toggle('on', drawers.list.classList.contains('open')); document.getElementById('bSet').classList.toggle('on', drawers.set.classList.contains('open')); }
  document.getElementById('bList').onclick = () => openDrawer('list'); document.getElementById('bSet').onclick = () => openDrawer('set');
  document.querySelectorAll('[data-close]').forEach(b => { b.onclick = () => openDrawer(null); });

  // drag & drop
  let dragN = 0;
  addEventListener('dragenter', e => { e.preventDefault(); dragN++; document.getElementById('drop').classList.add('show'); });
  addEventListener('dragleave', () => { if (--dragN <= 0) { dragN = 0; document.getElementById('drop').classList.remove('show'); } });
  addEventListener('dragover', e => e.preventDefault());
  addEventListener('drop', e => { e.preventDefault(); dragN = 0; document.getElementById('drop').classList.remove('show'); addFiles(e.dataTransfer.files); });

  // settings
  function applyColor(hex) {
    prefs.color = hex; const h = {};
    const matrix = hex.toLowerCase() === '#00ff41';
    document.documentElement.classList.toggle('matrix', matrix);
    renderer.setClearColor(matrix ? 0x020b04 : 0xffffff, 1);
    scene.fog.color.set(matrix ? 0x020b04 : 0xffffff);
    cLow.set(matrix ? 0x073b17 : 0xcbd5e1);
    sparkCol.set(matrix ? 0x9cffb2 : 0x06b6d4);
    liquidMat.color.set(matrix ? 0x00ff41 : hex);
    liquidMat.emissive.set(matrix ? 0x003b10 : hex).multiplyScalar(matrix ? 1 : 0.12);
    liquidWire.material.color.set(matrix ? 0x70ff92 : hex);
    rings.forEach(r => r.material.color.set(matrix ? 0x1d8f3a : 0xc7d2fe));
    cMid.set(hex); cMid.getHSL(h); cHigh.setHSL((h.h + 0.12) % 1, h.s, h.l);
    baseCol.set(hex); loudCol.setHSL(matrix ? h.h : (h.h + 0.82) % 1, h.s, Math.max(h.l - 0.12, 0.25));
    document.documentElement.style.setProperty('--accent', hex);
    document.querySelectorAll('.sw').forEach(b => b.classList.toggle('on', b.dataset.c.toLowerCase() === hex.toLowerCase()));
  }
  document.querySelectorAll('.sw').forEach(b => { b.onclick = () => { applyColor(b.dataset.c); save(); }; });
  function bind(id, key, fn) {
    const el = document.getElementById(id), out = document.getElementById(id + 'V'); el.value = prefs[key];
    const f = () => { const v = +el.value; prefs[key] = v; fn(v); out.textContent = v.toFixed(2); save(); };
    el.addEventListener('input', f); f();
  }
  bind('sSens', 'sens', v => { sens = v; }); bind('sCrk', 'crackle', v => { CRACKLE = v; }); bind('sHov', 'hover', v => { HOVER = v; });
  const qualityEl = document.getElementById('sQuality');
  function applyQuality(value) {
    quality = value;
    const ratio = quality === 'performance' ? 1 : quality === 'high' ? 1.5 : 2;
    renderer.setPixelRatio(Math.min(devicePixelRatio, ratio));
    renderer.setSize(innerWidth, innerHeight);
    pts.material.size = quality === 'performance' ? 0.38 : quality === 'high' ? 0.44 : 0.5;
    ballPts.material.size = quality === 'performance' ? 0.22 : quality === 'high' ? 0.25 : 0.28;
    prefs.quality = quality;
    qualityEl.value = quality;
    save();
  }
  qualityEl.value = prefs.quality || 'ultra';
  qualityEl.addEventListener('change', () => applyQuality(qualityEl.value));
  applyQuality(qualityEl.value);
  modeBtns.forEach(b => b.addEventListener('click', () => { prefs.mode = b.dataset.m; save(); }));

  // keyboard & focus handling
  addEventListener('keydown', e => {
    if (e.target.matches('input, textarea, select') || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    const bump = d => { volEl.value = Math.min(100, Math.max(0, +volEl.value + d)); volEl.dispatchEvent(new Event('input', { bubbles: true })); };
    if (k === ' ') toggle();
    else if (k === 'arrowright') doSeek(tNow() + 5); else if (k === 'arrowleft') doSeek(tNow() - 5);
    else if (k === 'arrowup') bump(5); else if (k === 'arrowdown') bump(-5);
    else if (k === 'n') step(1); else if (k === 'p') prev();
    else if (k === 'm') document.getElementById('mute').click(); else if (k === 'f') document.getElementById('full').click();
    else if (k === 'l') openDrawer('list'); else if (k === 's') openDrawer('set');
    else if (k.length === 1 && '123456'.includes(k)) modeBtns[+k - 1].click();
    else return;
    e.preventDefault();
  });
  document.addEventListener('click', e => { if (e.detail) { const b = e.target.closest('button'); if (b) b.blur(); } });
  document.addEventListener('pointerup', e => { if (e.target.matches && e.target.matches('input[type=range]')) e.target.blur(); });
  document.addEventListener('input', e => { if (e.target.classList && e.target.classList.contains('rng')) fillRange(e.target); });
  addEventListener('pointerdown', () => { if (ctx && state === 'playing' && ctx.state === 'suspended') ctx.resume(); });

  // init
  volEl.value = vol * 100;
  applyColor(prefs.color); setMode(prefs.mode); renderList(); refresh();
  document.querySelectorAll('.rng').forEach(fillRange);

  // ---------- Animation ----------
  let frame = 0;
  const row = new Float32Array(COLS);
  function tick(time) {
    requestAnimationFrame(tick);
    const live = state === 'playing' || state === 'mic';
    if (live) analyser.getByteFrequencyData(data);

    if (mode === 'wave' && ++frame % 2 === 0) {
      // scroll history back (row ROWS-1 is the front/newest)
      heights.copyWithin(0, COLS);
      const last = (ROWS - 1) * COLS;
      for (let c = 0; c < COLS; c++) {
        // mirror around the centre so bass sits in the middle
        const d = Math.abs(c - (COLS - 1) / 2) / ((COLS - 1) / 2);
        let target;
        if (live) {
          const bin = Math.floor(Math.pow(d, 1.6) * 140);
          target = Math.min(1.3, Math.pow(data[bin] / 255, 1.6) * sens) * MAX_H;
        } else if (state === 'idle' && !buffer) {
          target = (Math.sin(time * 0.0015 + d * 6) * 0.5 + 0.5) * 0.8; // gentle idle ripple
        } else target = 0;
        row[c] = heights[last + c] = heights[last + c] * 0.5 + target * 0.5;
      }
      for (let i = 0; i < N; i++) { pos[i * 3 + 1] = heights[i]; paint(i, Math.min(heights[i] / MAX_H * 1.4, 1)); }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
    }

    tickUI();
    updateMode(time);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);
})();
