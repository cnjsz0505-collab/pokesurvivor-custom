/* ============ settings-ui.js — pantalla de Ajustes (PC y móvil) ============
 * Se abre por encima de lo que haya (menú o pausa) y al cerrar vuelve ahí.
 * Pestañas: Sonido · Gráficos · Controles · Accesibilidad · Cuenta · Acerca de.
 * Los ajustes son de este dispositivo (G.Settings / G.Audio en el navegador).
 */
G.SettingsUI = (() => {
  const $ = G.UI.$;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const VERSION = '1.2 · 2026-10-09';
  const REPO = 'https://github.com/JPTER78/pokesurvivor';
  let tab = 'sound';

  function init() {
    document.querySelectorAll('#set-tabs .gen-tab').forEach(b => { b.onclick = () => { tab = b.dataset.t; render(); }; });
    // En el móvil no hay apuntado a mano (siempre apunta solo): fuera la pestaña, que sólo tenía eso.
    if (G.Settings.touch) document.querySelector('#set-tabs [data-t="a11y"]').classList.add('hidden');
    // Al conectar o quitar un mando con Controles abierto, se ve al momento.
    for (const ev of ['gamepadconnected', 'gamepaddisconnected']) addEventListener(ev, () => { if (isOpen() && tab === 'ctl') render(); });
    $('set-close').onclick = close;
    $('btn-settings').innerHTML = G.Icons.html('gear', 20);
    $('btn-settings').onclick = () => open();
    $('btn-pause-settings').onclick = () => open('sound');
    // Pantalla completa (si el navegador la permite; en iPhone, cómo conseguirla).
    if (canFull() || iosTip()) {
      $('btn-full').classList.remove('hidden');
      $('btn-full').innerHTML = G.Icons.html('full', 20);
      $('btn-full').onclick = toggleFull;
    }
  }

  function open(t) {
    if (t) tab = t;
    $('scr-settings').classList.remove('hidden');
    render();
  }
  function close() { $('scr-settings').classList.add('hidden'); }
  const isOpen = () => !$('scr-settings').classList.contains('hidden');

  // ---------------- pantalla completa ----------------
  function canFull() { return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled); }
  function isFull() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  // iPhone: Safari no deja poner una web a pantalla completa (por eso a veces
  // no salía la opción). Sí se puede abriéndola desde la pantalla de inicio.
  const IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = () => !!navigator.standalone || (window.matchMedia && matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches);
  function iosTip() { return IOS && !canFull() && !standalone(); }
  const IOS_TIP = 'En iPhone, Safari no deja poner las webs a pantalla completa. Pulsa Compartir y luego "Añadir a pantalla de inicio": abriendo el juego desde ese icono se juega a pantalla completa.';
  function toggleFull() {
    if (!canFull()) { if (iosTip()) G.UI.toast(IOS_TIP, 9000); return; }
    if (isFull()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else {
      const el = document.documentElement;
      const p = (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
      // En móvil, además se intenta fijar la pantalla en horizontal.
      if (p && p.then) p.then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* nada */ } }).catch(() => {});
    }
    setTimeout(() => { if (isOpen()) render(); }, 300);
  }

  // ---------------- piezas ----------------
  function section(title, sub) { return `<h3 class="set-h">${esc(title)}</h3>${sub ? `<p class="sub">${sub}</p>` : ''}`; }
  function toggle(key, label, desc) {
    const on = !!G.Settings.get(key);
    return `<div class="set-row"><div class="grow"><b>${esc(label)}</b><small>${esc(desc)}</small></div>
      <button class="btn small switch ${on ? 'gold' : ''}" data-k="${key}">${on ? 'Sí' : 'No'}</button></div>`;
  }
  function choice(key, opts) {
    const cur = G.Settings.get(key);
    return `<div class="chips set-chips">${opts.map(([v, l]) => `<button class="chip ${v === cur ? 'on' : ''}" data-k="${key}" data-v="${v}">${esc(l)}</button>`).join('')}</div>`;
  }

  function render() {
    document.querySelectorAll('#set-tabs .gen-tab').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
    const box = $('set-body');
    box.scrollTop = 0;
    if (tab === 'sound') {
      box.innerHTML = section('Sonido') + '<div id="set-sound" class="sound-inline"></div>';
      G.UI.soundControls($('set-sound'));
    } else if (tab === 'gfx') {
      const auto = ['baja', 'media', 'alta'][G.Settings.autoLevel];
      box.innerHTML = section('Idioma', 'El juego se recarga al cambiarlo.')
        + `<div class="chips set-chips" translate="no">${G.I18n.choices.map(([v, l]) =>
             `<button class="chip ${G.I18n.lang === v ? 'on' : ''}" data-lang="${v}">${l}</button>`).join('')}</div>`
        + section('Calidad', 'Cuántos efectos y partículas se dibujan. <b>Auto</b> la baja sola si el juego va a tirones (ahora: ' + auto + ').')
        + choice('quality', [['auto', 'Auto'], ['high', 'Alta'], ['mid', 'Media'], ['low', 'Baja']])
        + section('Pantalla')
        + toggle('dmgNumbers', 'Números de daño', 'Los números que salen al golpear y al recibir daño.')
        + toggle('calm', 'Menos sacudidas y destellos', 'La cámara tiembla menos y los fogonazos son suaves.')
        + toggle('fps', 'Mostrar FPS', 'Fotogramas por segundo, en la esquina de abajo.')
        + (canFull() ? `<div class="set-row"><div class="grow"><b>Pantalla completa</b><small>Sin barras del navegador.</small></div>
             <button class="btn small" id="set-full">${isFull() ? 'Salir' : 'Activar'}</button></div>`
           : iosTip() ? `<div class="set-row"><div class="grow"><b>Pantalla completa</b><small>${esc(IOS_TIP)}</small></div></div>` : '');
    } else if (tab === 'ctl') {
      const pn = G.Pad.name;
      box.innerHTML = section('Con mando', pn
          ? 'Mando conectado: <b translate="no">' + esc(pn.replace(/\s*\(.*$/, '')) + '</b>'
          : 'Xbox, PlayStation, Switch y la mayoría de mandos USB o Bluetooth. Conéctalo y pulsa cualquier botón.')
        + toggle('gamepad', 'Usar mando', 'Moverte, cambiar de ataque y manejar los menús con el mando.')
        + toggle('padRumble', 'Vibración', 'El mando vibra al recibir daño (si el mando y el navegador lo permiten).')
        + `<div class="keys">
             <div><span class="padkey">Stick izq.</span> o <span class="padkey">Cruceta</span></div><span>moverse · elegir en los menús</span>
             <div><span class="padkey">LB</span> / <span class="padkey">RB</span></div><span>ataque anterior / siguiente</span>
             <div><span class="padkey">Start</span></div><span>pausa</span>
             <div><span class="padkey">A</span></div><span>pulsar (en los menús) · saltar la animación de Arceus</span>
             <div><span class="padkey">B</span></div><span>atrás / cerrar</span>
             <div><span class="padkey">Y</span></div><span>cambiar las cartas al subir de nivel</span>
             <div><span class="padkey">Stick der.</span></div><span>desplazar las listas · apuntar (si activas Apuntar a mano en Accesibilidad)</span>
           </div>`
        + section('En móvil o tablet')
        + `<p class="sub">Pon el dedo en cualquier parte y arrastra para moverte: el joystick aparece donde tocas. Toca un ataque de abajo para cambiarlo y el botón de arriba a la derecha para pausar. Se juega en horizontal.</p>`
        + `<div class="set-row"><div class="grow"><b>Tamaño del joystick</b><small>Cuánto hay que arrastrar el dedo.</small></div></div>`
        + choice('stick', [[0.8, 'Pequeño'], [1, 'Normal'], [1.25, 'Grande']])
        + `<div class="set-row"><div class="grow"><b>Colocar los botones</b><small>Pon los ataques, la pausa y el joystick (fijo, si quieres) donde quieras de la pantalla.</small></div>
             <button class="btn small" id="set-layout">Colocar</button></div>`
        + section('En PC')
        + `<div class="keys">
             <div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> o flechas</div><span>moverse</span>
             <div><kbd>1</kbd>–<kbd>4</kbd> o clic en el icono</div><span>elegir ataque</span>
             <div><kbd>Q</kbd> / <kbd>E</kbd></div><span>ataque anterior / siguiente</span>
             <div><kbd>Esc</kbd> o <kbd>P</kbd></div><span>pausa</span>
             <div><kbd>1</kbd>–<kbd>3</kbd></div><span>elegir carta al subir de nivel</span>
           </div>`;
    } else if (tab === 'a11y') {
      box.innerHTML = section('Apuntado')
        + toggle('aimManual', 'Apuntar a mano', 'Tus ataques van hacia el ratón (o hacia donde empujes el stick derecho del mando) en vez de al enemigo más cercano. Si sueltas el stick y no mueves el ratón, vuelve a apuntar solo. La cadena y los meteoros siguen buscando a los enemigos solos.');
    } else if (tab === 'custom') {
      renderCustom(box);
    } else if (tab === 'acc') {
      renderAccount(box);
    } else {
      box.innerHTML = `<div class="about-logo">PokéSurvivor</div><p class="sub center">Versión ${esc(VERSION)}</p>`
        + `<p class="sub">Juego de fans <b>gratuito y sin ánimo de lucro</b>: sin anuncios ni compras. Pokémon y sus personajes son propiedad de Nintendo, Creatures y GAME FREAK; este proyecto no está afiliado a ellos.</p>`
        + section('Créditos')
        + `<ul class="credits">
             <li><b>Sprites:</b> PMD SpriteCollab y sus artistas (CC BY-NC 4.0).</li>
             <li><b>Datos de los Pokémon:</b> PokéAPI.</li>
             <li><b>Música y sonidos:</b> originales, generados por el propio juego.</li>
             <li><b>Fuente:</b> Pixelify Sans (OFL).</li>
           </ul>`
        + `<div class="row wrap" style="justify-content:center;gap:8px">
             ${window.PS_PAGES ? `<a class="btn small" href="${G.I18n.lang === 'en' ? 'en/guide/' : 'guia/'}" target="_blank">Guía y preguntas</a>
             <a class="btn small" href="${G.I18n.lang === 'en' ? 'en/pokedex/' : 'pokedex/'}" target="_blank">Pokédex</a>` : ''}
             <button class="btn small" data-legal>Aviso legal y privacidad</button>
             <a class="btn small" href="contacto/" target="_blank" rel="noopener">Contacto</a>
             <a class="btn small" href="${REPO}" target="_blank" rel="noopener">Código (GitHub)</a>
           </div>`;
    }
    wire(box);
  }

  // ---------------- 個人自訂模式 ----------------
  function renderCustom(box) {
    const c = G.Custom.read(G.DB.save);
    const input = (id, label, value, min, max, step, suffix) =>
      `<label class="custom-field" for="${id}"><span>${label}</span><div><input id="${id}" class="field" type="number" inputmode="decimal" min="${min}" max="${max}" step="${step}" value="${value}"><em>${suffix}</em></div></label>`;
    box.innerHTML = section('自訂模式 / Custom mode', '個人休閒與測試用設定。自訂數值只會在單人遊戲生效，且該場不會計入排行榜。')
      + `<div class="set-row"><div class="grow"><b>啟用自訂數值</b><small>新開的單人遊戲才會套用；合作模式一律使用正常數值。</small></div>
           <button class="btn small switch ${c.on ? 'gold' : ''}" id="custom-toggle">${c.on ? '開啟' : '關閉'}</button></div>`
      + `<div class="custom-grid">
           ${input('custom-hp', '最大生命', c.hp, .5, 10, .1, '×')}
           ${input('custom-atk', '攻擊力', c.atk, .5, 10, .1, '×')}
           ${input('custom-spd', '移動速度', c.spd, .5, 3, .05, '×')}
           ${input('custom-reduction', '減傷', c.reduction, 0, 80, 1, '%')}
         </div>
         <div class="row wrap custom-actions"><button class="btn gold" id="custom-save">儲存數值</button><button class="btn ghost" id="custom-reset">還原預設</button></div>`
      + section('抽卡次數 / Gacha tickets', '可直接調整目前持有的單抽券與十連券。輸入後按儲存；範圍為 0–99,999。')
      + `<div class="custom-grid">
           ${input('custom-t1', '單抽券', (G.DB.save.tickets || {}).t1 || 0, 0, 99999, 1, '張')}
           ${input('custom-t10', '十連券', (G.DB.save.tickets || {}).t10 || 0, 0, 99999, 1, '張')}
         </div>
         <div class="row wrap custom-actions"><button class="btn gold" id="custom-tickets-save">儲存抽卡券</button></div>`
      + `<p class="note">手機可直接在這裡輸入數字；遊戲本身支援觸控、橫向畫面與「加入主畫面」安裝。</p>`;
  }

  function renderAccount(box) {
    const st = G.DB.guest ? 'guest' : G.DB.syncState;
    const SYNC = { ok: 'Guardado en la nube', syncing: 'Guardando…', pending: 'Pendiente de subir (se sube al salir del juego)',
                   offline: 'Sin conexión: se subirá al volver', local: 'Guardado sólo en este navegador', guest: 'Invitado: no se guarda' };
    if (G.DB.guest) {
      box.innerHTML = section('Cuenta', 'Estás jugando como <b>invitado</b>: tu progreso no se guarda al salir.')
        + `<button class="btn gold" id="set-login">Crear cuenta o entrar</button>`;
      return;
    }
    const nick = G.Social.me ? G.Social.me.name : (G.DB.user || '');
    const kind = G.DB.mode === 'local' ? 'Cuenta de este navegador' : G.DB.nameAccount ? 'Nombre y contraseña' : 'Google';
    box.innerHTML = section('Cuenta')
      + `<div class="set-row"><div class="grow"><b>Apodo</b><small>Es único y no se puede cambiar.</small></div><span class="gold" translate="no">${esc(nick)}</span></div>`
      + `<div class="set-row"><div class="grow"><b>Tipo de cuenta</b></div><span>${esc(kind)}</span></div>`
      + `<div class="set-row"><div class="grow"><b>Partida</b></div><span>${esc(SYNC[st] || st)}</span></div>`
      + `<div class="row wrap" style="gap:8px;margin-top:12px">
           <button class="btn" id="set-logout">Cerrar sesión</button>
           <button class="btn danger" id="set-delete">Borrar cuenta</button>
         </div><p class="note" id="set-msg"></p>`;
  }

  function wire(box) {
    box.querySelectorAll('.switch[data-k]').forEach(b => { b.onclick = () => { G.Settings.set(b.dataset.k, !G.Settings.get(b.dataset.k)); render(); }; });
    box.querySelectorAll('.chip[data-k]').forEach(b => {
      b.onclick = () => { const v = b.dataset.v; G.Settings.set(b.dataset.k, isNaN(+v) ? v : +v); render(); };
    });
    const full = $('set-full'); if (full) full.onclick = toggleFull;
    const lay = $('set-layout'); if (lay) lay.onclick = () => G.LayoutUI.open();
    const customToggle = $('custom-toggle');
    if (customToggle) customToggle.onclick = () => {
      const c = G.Custom.read(G.DB.save);
      G.Custom.update(G.DB.save, { on: !c.on });
      G.DB.commit(true); render();
    };
    const value = (id, fallback) => { const el = $(id); return el ? el.value : fallback; };
    const customSave = $('custom-save');
    if (customSave) customSave.onclick = () => {
      const c = G.Custom.read(G.DB.save);
      G.Custom.update(G.DB.save, { on: c.on, hp: value('custom-hp', c.hp), atk: value('custom-atk', c.atk), spd: value('custom-spd', c.spd), reduction: value('custom-reduction', c.reduction) });
      G.DB.commit(true); G.UI.toast('自訂數值已儲存'); render();
    };
    const customReset = $('custom-reset');
    if (customReset) customReset.onclick = () => {
      G.Custom.update(G.DB.save, G.Custom.DEFAULT);
      G.DB.commit(true); G.UI.toast('已還原預設數值'); render();
    };
    const customTickets = $('custom-tickets-save');
    if (customTickets) customTickets.onclick = () => {
      G.Custom.setTickets(G.DB.save, value('custom-t1', 0), value('custom-t10', 0));
      G.DB.commit(true); G.UI.refreshCoins(); G.UI.toast('抽卡券已儲存'); render();
    };
    box.querySelectorAll('[data-lang]').forEach(b => { b.onclick = () => { if (b.dataset.lang !== G.I18n.lang) G.I18n.set(b.dataset.lang); }; });
    const lo = $('set-login'); if (lo) lo.onclick = () => { close(); leave(); };
    const out = $('set-logout'); if (out) out.onclick = () => { close(); leave(); };
    const del = $('set-delete');
    if (del) del.onclick = async () => {
      const ok = await G.UI.confirmDelete();
      if (!ok) return;
      del.disabled = true;
      const r = await G.DB.deleteAccount(ok.pass);
      if (!r.ok) { $('set-msg').textContent = r.error; del.disabled = false; return; }
      close();
      G.UI.toast('Cuenta borrada');
      G.Audio.music(null);
      G.Flow.toLogin();
    };
  }

  /** Cerrar sesión (si estás en una partida, se abandona). */
  function leave() {
    if (G.DB.guest && !confirm('Eres invitado: se perderá todo el progreso. ¿Salir?')) return;
    if (G.Game.state !== 'ui') G.Game.quit && G.Game.quit();
    G.Audio.music(null);
    G.DB.logout().then(() => G.Flow.toLogin());
  }

  return { init, open, close, get isOpen() { return isOpen(); } };
})();
