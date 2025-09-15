// Simple branching narrative engine for classroom use

/* State */
const state = {
  totalScore: 0,
  currentCaseId: null,
  currentNodeId: null,
  visited: {}, // caseId -> Set of nodeIds
  // Runtime status for sidebar
  status: {
    patient: { hemodynamics: 'stabil', temp: 'normoterm', pain: 'OK', notes: [] },
    staff: { anestesi: 'til stede', operasjon: 'til stede', vaktbytte: 'ingen', notes: [] },
    equipment: {
      power: 'OK',
      anesthesia: 'apparat OK',
      esu: 'standby',
      returnPad: 'ukjent',
      pumps: 'OK',
      warmer: 'OK',
      monitor: 'OK',
      cables: 'ordnet',
      fluids: 'tørt',
      notes: [],
    },
    log: [],
    outcomes: [],
  },
  flags: {},
  voting: { code: null },
};

const el = {
  app: document.getElementById('app'),
  totalScore: document.getElementById('totalScore'),
  aboutDialog: document.getElementById('aboutDialog'),
  openAbout: document.getElementById('openAbout'),
};

// Optional Supabase client (for live voting)
let supabaseClient = null;
try {
  if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase) {
    supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  }
} catch {}

/* Utils */
function $(sel, root = document) { return root.querySelector(sel); }
function h(tag, props = {}, children = []) {
  const e = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'class') e.className = v;
    else if (k === 'dataset') Object.assign(e.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== undefined && v !== null) e.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c === null || c === undefined) return;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return e;
}

function fmtPoints(n) { return n === 0 ? '+0' : (n > 0 ? `+${n}` : `${n}`); }

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Persistence (optional localStorage) */
const STORAGE_KEY = 'branching-cases-state-v1';
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ totalScore: state.totalScore })); } catch {}
}
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (typeof data.totalScore === 'number') state.totalScore = data.totalScore;
  } catch {}
}

/* Rendering */
function render() {
  el.totalScore.textContent = state.totalScore;
}

function renderMenu() {
  state.currentCaseId = null;
  state.currentNodeId = null;
  resetStatus();
  const header = h('div', { class: 'card-header' }, [ h('h2', {}, 'Velg et case') ]);
  const grid = h('div', { class: 'grid cols-3 card-content' });

  CASES.forEach(c => {
    const tile = h('button', { class: 'case-tile', onClick: () => startCase(c.id) });
    tile.append(
      h('h3', { class: 'case-title' }, c.title),
      h('div', { class: 'stack' }, [
        h('div', { class: 'case-meta' }, c.subtitle),
        h('div', { class: 'row' }, [
          h('span', { class: 'pill' }, c.domain),
          h('span', { class: 'pill warn' }, `Vanskelighet: ${c.difficulty}`),
          h('span', { class: 'pill' }, `${Object.keys(c.nodes).length} steg`),
        ]),
      ]),
    );
    grid.appendChild(tile);
  });

  const card = h('section', { class: 'card' }, [ header, grid ]);
  const actions = h('div', { class: 'actions' }, [
    h('button', { class: 'btn ghost', onClick: () => resetScore() }, 'Nullstill poeng'),
    h('button', { class: 'btn', onClick: () => showShortcuts() }, 'Hurtigtaster'),
  ]);
  el.app.replaceChildren(card, actions);
  render();
}

function showShortcuts() {
  alert('Hurtigtaster:\n\n1–9: Velg alternativ\nBackspace: Til meny\n');
}

function startCase(caseId) {
  const c = CASES.find(x => x.id === caseId);
  if (!c) return;
  state.currentCaseId = caseId;
  state.currentNodeId = c.start;
  state.visited[caseId] = new Set();
  resetStatus();
  renderCaseNode();
}

function renderCaseNode() {
  const c = CASES.find(x => x.id === state.currentCaseId);
  if (!c) return renderMenu();
  const node = c.nodes[state.currentNodeId];
  if (!node) return renderMenu();
  state.visited[c.id].add(state.currentNodeId);

  // Latent consequences: flag-based redirects
  if (node.flagRedirects && Array.isArray(node.flagRedirects)) {
    for (const fr of node.flagRedirects) {
      if (state.flags && state.flags[fr.flag]) {
        state.currentNodeId = fr.goto;
        return renderCaseNode();
      }
    }
  }

  const header = h('div', { class: 'card-header' }, [
    h('h2', {}, `${c.title}`),
  ]);

  const content = h('div', { class: 'card-content' }, [
    h('div', { class: 'stack' }, [
      h('div', { class: 'row' }, [
        h('span', { class: 'pill' }, c.domain),
        h('span', { class: 'pill warn' }, `Vanskelighet: ${c.difficulty}`),
        h('span', { class: 'pill' }, `Steg ${node.order} / ${Object.keys(c.nodes).length}`),
      ]),
      h('p', {}, node.text),
      node.image ? h('img', { src: node.image, alt: node.alt || '', style: 'max-width:100%;border-radius:8px;border:1px solid rgba(148,163,184,.2);' }) : null,
      node.competencies && node.competencies.length ? (
        h('div', { class: 'status' }, `Kompetansemål i spill: ${node.competencies.join(', ')}`)
      ) : null,
      node.learn ? (() => {
        const hint = h('div', { class: 'learn', style: 'display:none' }, node.learn);
        const btn = h('button', { class: 'btn ghost', onClick: () => { hint.style.display = hint.style.display === 'none' ? 'block' : 'none'; } }, 'Vis læringshint');
        return h('div', { class: 'stack' }, [btn, hint]);
      })() : null,
    ]),
    buildChoices(node, c),
  ]);

  const nav = h('div', { class: 'actions' }, [
    h('button', { class: 'btn', onClick: () => renderMenu() }, 'Til meny'),
    h('button', { class: 'btn ghost', onClick: () => resetCase() }, 'Start caset på nytt'),
  ]);

  const card = h('section', { class: 'card' }, [ header, content ]);
  const layout = h('div', { class: 'layout' }, [
    h('div', {}, [card, nav]),
    renderSidebar(),
  ]);
  el.app.replaceChildren(layout);
  render();

  // If a voting session is active, sync current node to session so students don't need a new QR each time
  pushCurrentNodeToSession();

  // Keyboard shortcuts
  document.onkeydown = (e) => {
    if (/^[1-9]$/.test(e.key)) {
      const idx = parseInt(e.key, 10) - 1;
      const btns = [...document.querySelectorAll('.choice-btn')];
      if (btns[idx]) btns[idx].click();
    } else if (e.key === 'Backspace') {
      renderMenu();
    }
  };
}

function buildChoices(node, c) {
  const wrap = h('div', { class: 'choices' });
  const options = shuffle(node.choices);
  options.forEach((ch, i) => {
    const btn = h('button', {
      class: 'choice-btn',
      dataset: {},
      onClick: () => selectChoice(ch, c, btn),
      'aria-label': ch.label,
    }, [
      h('div', { class: 'row' }, [
        h('strong', {}, `${i + 1}. ${ch.label}`),
        // Ikke vis risikomerker for å unngå å avsløre riktig/feil
      ]),
      ch.note ? h('div', { class: 'status' }, ch.note) : null,
    ]);
    wrap.appendChild(btn);
  });
  return wrap;
}

function selectChoice(choice, c, btn) {
  // Feedback
  if (btn && btn.dataset) btn.dataset.show = 'true';

  // Score handling
  const delta = choice.points || 0;
  state.totalScore += delta;
  render();
  save();

  // Apply effects to status/log
  applyEffects(choice);
  // Apply flags (latent consequences)
  if (choice.effects && choice.effects.flags) {
    Object.assign(state.flags, choice.effects.flags);
  }

  // Transition
  if (choice.goto) {
    state.currentNodeId = choice.goto;
    renderCaseNode();
  } else if (choice.end) {
    renderEnd(c, choice);
  }
}

function renderEnd(c, choice) {
  const header = h('div', { class: 'card-header' }, [
    h('h2', {}, `Slutt: ${c.title}`),
  ]);
  const finalSummary = summarizeOutcome();
  const body = h('div', { class: 'card-content' }, [
    h('p', {}, choice.summary || 'Case avsluttet.'),
    choice.learn ? h('div', { class: 'learn' }, choice.learn) : null,
    h('p', {}, ['Poeng for siste valg: ', h('span', { class: 'inline-score' }, fmtPoints(choice.points || 0))]),
    h('div', { class: 'learn' }, finalSummary),
  ]);
  const nav = h('div', { class: 'actions' }, [
    h('button', { class: 'btn', onClick: () => renderMenu() }, 'Til meny'),
    h('button', { class: 'btn ghost', onClick: () => startCase(c.id) }, 'Spill caset på nytt'),
  ]);
  const card = h('section', { class: 'card' }, [ header, body ]);
  const layout = h('div', { class: 'layout' }, [
    h('div', {}, [card, nav]),
    renderSidebar(true),
  ]);
  el.app.replaceChildren(layout);
  render();
}

function resetScore() {
  state.totalScore = 0;
  save();
  render();
}

function resetCase() {
  const c = CASES.find(x => x.id === state.currentCaseId);
  if (!c) return renderMenu();
  state.currentNodeId = c.start;
  state.visited[c.id] = new Set();
  resetStatus();
  renderCaseNode();
}

/* Sidebar rendering */
function renderSidebar(isFinal = false) {
  const card = h('section', { class: 'card small' });
  const head = h('div', { class: 'card-header' }, [ h('h2', {}, isFinal ? 'Status (slutt)' : 'Status nå') ]);
  const content = h('div', { class: 'card-content' });

  // Tabs: Status | Kunnskap | Logg
  const tabs = h('div', { class: 'tabs' });
  const btnStatus = h('button', { class: 'tab-btn', 'data-tab': 'status', 'aria-selected': 'true', onClick: () => showPanel('status') }, 'Status');
  const btnKnow = h('button', { class: 'tab-btn', 'data-tab': 'knowledge', 'aria-selected': 'false', onClick: () => showPanel('knowledge') }, 'Kunnskap');
  const btnLog = h('button', { class: 'tab-btn', 'data-tab': 'log', 'aria-selected': 'false', onClick: () => showPanel('log') }, 'Logg');
  const btnMap = h('button', { class: 'tab-btn', 'data-tab': 'map', 'aria-selected': 'false', onClick: () => showPanel('map') }, 'Kart');
  tabs.append(btnStatus, btnKnow, btnLog, btnMap);
  let btnVote = null;
  if (supabaseClient && !isFinal) {
    btnVote = h('button', { class: 'tab-btn', 'data-tab': 'vote', 'aria-selected': 'false', onClick: () => showPanel('vote') }, 'Avstemming');
    tabs.append(btnVote);
  }

  const panelStatus = h('div', { class: 'panel', id: 'panel-status', 'aria-hidden': 'false' }, [
    sectionPatient(),
    sectionStaff(),
    sectionEquipment(),
  ]);
  const panelKnowledge = h('div', { class: 'panel', id: 'panel-knowledge', 'aria-hidden': 'true' }, knowledgeContent());
  const panelLog = h('div', { class: 'panel', id: 'panel-log', 'aria-hidden': 'true' }, logContent());
  const panelMap = h('div', { class: 'panel', id: 'panel-map', 'aria-hidden': 'true' }, mapContent());
  const panelVote = supabaseClient && !isFinal ? h('div', { class: 'panel', id: 'panel-vote', 'aria-hidden': 'true' }, voteContent()) : null;

  content.append(tabs, panelStatus, panelKnowledge, panelLog, panelMap);
  if (panelVote) content.append(panelVote);
  card.append(head, content);
  return card;
}

function showPanel(which) {
  // Toggle all existing tabs/panels dynamically (includes optional 'vote')
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(btn => {
    const key = btn?.dataset?.tab;
    if (!key) return;
    const panel = document.getElementById(`panel-${key}`);
    if (panel) {
      btn.setAttribute('aria-selected', String(key === which));
      panel.setAttribute('aria-hidden', String(key !== which));
    }
  });
  if (which === 'vote') {
    // Refresh counts when opening the voting panel
    refreshVoteCounts();
  }
}

function sectionPatient() {
  const s = state.status.patient;
  return h('div', { class: 'side-section' }, [
    h('h3', {}, 'Pasient'),
    h('div', { class: 'kv' }, [
      h('div', { class: 'k' }, 'Hemodynamikk'), h('div', { class: 'v' }, s.hemodynamics),
      h('div', { class: 'k' }, 'Temperatur'), h('div', { class: 'v' }, s.temp),
      h('div', { class: 'k' }, 'Smerte/komfort'), h('div', { class: 'v' }, s.pain),
    ]),
    s.notes.length ? h('div', { class: 'status' }, `Notater: ${s.notes.join(' | ')}`) : null,
  ]);
}

function sectionStaff() {
  const s = state.status.staff;
  return h('div', { class: 'side-section' }, [
    h('h3', {}, 'Personell'),
    h('div', { class: 'kv' }, [
      h('div', { class: 'k' }, 'Anestesi'), h('div', { class: 'v' }, s.anestesi),
      h('div', { class: 'k' }, 'Operasjon'), h('div', { class: 'v' }, s.operasjon),
      h('div', { class: 'k' }, 'Vaktbytte'), h('div', { class: 'v' }, s.vaktbytte),
    ]),
    s.notes.length ? h('div', { class: 'status' }, `Notater: ${s.notes.join(' | ')}`) : null,
  ]);
}

function sectionEquipment() {
  const e = state.status.equipment;
  return h('div', { class: 'side-section' }, [
    h('h3', {}, 'Utstyr/elektro'),
    h('div', { class: 'kv' }, [
      h('div', { class: 'k' }, 'Strøm'), h('div', { class: 'v' }, e.power),
      h('div', { class: 'k' }, 'Anestesiapparat'), h('div', { class: 'v' }, e.anesthesia || 'ukjent'),
      h('div', { class: 'k' }, 'ESU'), h('div', { class: 'v' }, e.esu),
      h('div', { class: 'k' }, 'Returplate'), h('div', { class: 'v' }, e.returnPad),
      h('div', { class: 'k' }, 'Pumper'), h('div', { class: 'v' }, e.pumps),
      h('div', { class: 'k' }, 'Blodvarmer'), h('div', { class: 'v' }, e.warmer),
      h('div', { class: 'k' }, 'Monitor'), h('div', { class: 'v' }, e.monitor),
      h('div', { class: 'k' }, 'Kabelføring'), h('div', { class: 'v' }, e.cables),
      h('div', { class: 'k' }, 'Væske/søl'), h('div', { class: 'v' }, e.fluids),
    ]),
    e.notes.length ? h('div', { class: 'status' }, `Notater: ${e.notes.join(' | ')}`) : null,
  ]);
}

function knowledgeContent() {
  return [
    h('div', { class: 'side-section' }, [
      h('h3', {}, 'Prioritert kunnskapsliste'),
      h('ol', { class: 'list-tight' }, [
        h('li', {}, 'Grunnleggende elektrisk sikkerhet: støt, brann, utilsiktet avbrudd; riktig tilkobling/fast stikk; jord/isolasjon.'),
        h('li', {}, 'Forsvarlig bruk/vedlikehold: bruk iht. produsent, systematisk vedlikehold; meld uhell til DSB; sikker kassasjon.'),
        h('li', {}, 'Opplæring/kompetanse: dokumentert opplæring, kjennskap til farer/forholdsregler.'),
        h('li', {}, 'Standarder/regler: EN 60601, EN 61010; forskrift om elektromedisinsk utstyr (Lovdata).'),
        h('li', {}, 'Risikoklassifisering: Klasse I, IIa/IIb, III – etter tiltenkt formål og risiko.'),
        h('li', {}, 'System/integrasjon: samspill mellom enheter, IT-integrasjon og datasikkerhet.'),
        h('li', {}, 'Symboler/merking (ISO 15223-1): steril, engangsbruk, dato/utløp, pakning skadet, se bruksanvisning, forsiktig.'),
        h('li', {}, 'Internkontroll/dokumentasjon: system basert på risikovurdering; dokumenter vedlikehold/endringer.'),
        h('li', {}, 'Feilrapportering/uhell: meldeplikt ved uhell/svikt; ved dødsfall varsles DSB umiddelbart.'),
        h('li', {}, 'Etikk/juss: pasientsikkerhet, personvern, lovverk.'),
      ]),
    ]),
    h('div', { class: 'side-section' }, [
      h('h3', {}, 'Læringsutbytter (spesialsykepleie)'),
      h('ul', { class: 'list-tight' }, [
        h('li', {}, 'Avansert kunnskap om bruk/kontroll av medisinsk-teknisk utstyr og teknologiens muligheter/begrensninger.'),
        h('li', {}, 'Beherske forebyggende arbeid for pasient, miljø og utstyr.'),
        h('li', {}, 'Beherske akutte situasjoner selvstendig: prioritere, handle raskt/forsvarlig for vitale funksjoner.'),
        h('li', {}, 'Beherske planlagte, akutte og uforutsette situasjoner selvstendig.'),
        h('li', {}, 'Anvende medisinsk-teknisk utstyr på en sikker og forsvarlig måte.'),
        h('li', {}, 'Avansert kunnskap om kirurgiske instrumenter, bruksområder og sterilforsyningskjeden.'),
        h('li', {}, 'Bred kunnskap om lover, forskrifter og informasjonssikkerhet for medisinsk utstyr og digitale verktøy.'),
        h('li', {}, 'Inngående kunnskap om relevant teknologi for behandling, undersøkelse og overvåkning av operasjonspasienten.'),
      ]),
    ]),
  ];
}

function logContent() {
  const items = state.status.log.slice(-12).map(entry => h('li', {}, entry));
  return [
    h('div', { class: 'side-section' }, [
      h('h3', {}, 'Hendelseslogg (siste)')
    ]),
    h('ul', { class: 'list-tight' }, items.length ? items : [h('li', {}, '—')]),
  ];
}

function resetStatus() {
  state.status = {
    patient: { hemodynamics: 'stabil', temp: 'normoterm', pain: 'OK', notes: [] },
    staff: { anestesi: 'til stede', operasjon: 'til stede', vaktbytte: 'ingen', notes: [] },
    equipment: { power: 'OK', anesthesia: 'apparat OK', esu: 'standby', returnPad: 'ukjent', pumps: 'OK', warmer: 'OK', monitor: 'OK', cables: 'ordnet', fluids: 'tørt', notes: [] },
    log: [],
    outcomes: [],
  };
  state.flags = {};
}

function applyEffects(choice) {
  const S = state.status;
  if (!choice.effects) return;
  // Merge primitive updates
  const e = choice.effects;
  if (e.patient) Object.assign(S.patient, e.patient);
  if (e.staff) Object.assign(S.staff, e.staff);
  if (e.equipment) Object.assign(S.equipment, e.equipment);
  if (e.log) S.log.push(e.log);
  if (e.outcome) S.outcomes.push(e.outcome);
}

function summarizeOutcome() {
  const S = state.status;
  const parts = [];
  parts.push(`Pasient: ${S.patient.hemodynamics}, ${S.patient.temp}, komfort: ${S.patient.pain}.`);
  parts.push(`Personell: anestesi ${S.staff.anestesi}, operasjon ${S.staff.operasjon}, vaktbytte: ${S.staff.vaktbytte}.`);
  parts.push(`Utstyr: strøm ${S.equipment.power}, anestesiapparat ${S.equipment.anesthesia || 'ukjent'}, ESU ${S.equipment.esu}, returplate ${S.equipment.returnPad}, pumper ${S.equipment.pumps}, blodvarmer ${S.equipment.warmer}, monitor ${S.equipment.monitor}, kabler ${S.equipment.cables}, væske ${S.equipment.fluids}.`);
  if (S.outcomes.length) parts.push(`Viktige hendelser: ${S.outcomes.join(' → ')}`);
  if (S.log.length) parts.push(`Logg (siste): ${S.log.slice(-5).join(' | ')}`);
  return parts.join(' ');
}

function mapContent() {
  const c = CASES.find(x => x.id === state.currentCaseId) || CASES[0];
  if (!c) return [h('p', {}, 'Ingen case.')];
  const nodes = Object.entries(c.nodes).sort((a,b) => (a[1].order||0)-(b[1].order||0));
  const list = nodes.map(([id, node]) => {
    const visited = state.visited[c.id] && state.visited[c.id].has(id);
    const head = h('div', {}, [
      h('strong', {}, `${node.order}. ${id}`),
      visited ? h('span', { class: 'badge ok' }, 'besøkt') : null,
      node.flagRedirects && node.flagRedirects.length ? h('span', { class: 'badge warn' }, 'betingelser') : null,
    ]);
    const choices = (node.choices||[]).map(ch => {
      const target = ch.goto ? `→ ${ch.goto}` : (ch.end ? '→ [slutt]' : '');
      return h('li', {}, `${ch.label} ${target}`);
    });
    return h('li', {}, [ head, h('ul', { class: 'list-tight' }, choices) ]);
  });
  return [
    h('div', { class: 'side-section' }, [ h('h3', {}, 'Forgreningskart') ]),
    h('ul', { class: 'list-tight' }, list),
  ];
}

/* Voting (Supabase) */
function currentCaseAndNode() {
  const c = CASES.find(x => x.id === state.currentCaseId);
  if (!c) return {};
  return { c, node: c.nodes[state.currentNodeId] };
}

function genCode(len = 5) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random()*chars.length)];
  return out;
}

function voteContent() {
  const { c, node } = currentCaseAndNode();
  const wrap = [];
  wrap.push(h('div', { class: 'side-section' }, [ h('h3', {}, 'Avstemming (beta)') ]));

  // Session controls
  const code = state.voting.code;
  const row = h('div', { class: 'row' });
  const btnStart = h('button', { class: 'btn', onClick: async () => {
    if (!supabaseClient) return;
    const newCode = genCode();
    // Create session (ignore if exists)
    try {
  await supabaseClient.from('sessions').insert({ code: newCode, current_node: state.currentNodeId });
    } catch {}
    state.voting.code = newCode;
    renderCaseNode();
  } }, code ? 'Ny sesjonskode' : 'Start sesjon');
  const codeLabel = h('span', { class: 'pill' }, code ? `Kode: ${code}` : 'Ingen kode');
  row.append(btnStart, codeLabel);
  wrap.push(row);

  // Link and QR
  const info = h('div', { class: 'status' });
  const qrBox = h('div', { id: 'vote-qr', style: 'margin:8px 0;' });
  const copyRow = h('div', { class: 'row' });
  if (code) {
    const voteUrl = new URL('vote.html', location.href);
    voteUrl.searchParams.set('s', code);
    info.textContent = `Studentlenke: ${voteUrl.toString()}`;
    // Render QR as an image (no external JS dependency)
    qrBox.innerHTML = '';
    const img = new Image();
    img.width = 160; img.height = 160; img.alt = 'QR for studentlenke';
    img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=' + encodeURIComponent(voteUrl.toString());
    qrBox.appendChild(img);
    // Copy button
    const btnCopy = h('button', { class: 'btn ghost', onClick: async () => {
      try {
        await navigator.clipboard.writeText(voteUrl.toString());
        alert('Lenke kopiert til utklippstavlen.');
      } catch {
        prompt('Kopier lenken:', voteUrl.toString());
      }
    } }, 'Kopier lenke');
    const btnOpen = h('button', { class: 'btn ghost', onClick: () => window.open(voteUrl.toString(), '_blank') }, 'Åpne lenke');
    copyRow.append(btnCopy, btnOpen);
  } else {
    info.textContent = 'Start en sesjon for å få QR/lenke.';
  }
  wrap.push(info, qrBox, copyRow);

  // Counts
  const countsArea = h('div', { id: 'vote-counts' }, 'Ingen stemmer ennå.');
  const btnRefresh = h('button', { class: 'btn ghost', onClick: () => refreshVoteCounts() }, 'Oppdater telling');
  const btnApply = h('button', { class: 'btn', onClick: () => applyMajority() }, 'Bruk flest stemmer');
  const bar = h('div', { class: 'row' }, [btnRefresh, btnApply]);
  wrap.push(countsArea, bar);

  return wrap;
}

async function refreshVoteCounts() {
  if (!supabaseClient || !state.voting.code || !state.currentNodeId) return;
  const { data, error } = await supabaseClient
    .from('votes')
    .select('choice_idx')
    .eq('code', state.voting.code)
    .eq('node_id', state.currentNodeId);
  const countsEl = $('#vote-counts');
  if (!countsEl) return;
  if (error) {
    countsEl.textContent = 'Feil ved henting av stemmer: ' + error.message;
    return;
  }
  const { node } = currentCaseAndNode();
  const n = (node?.choices || []).length;
  const counts = Array.from({ length: n }, () => 0);
  (data || []).forEach(r => { if (typeof r.choice_idx === 'number' && r.choice_idx < n) counts[r.choice_idx]++; });
  // Render a clearer list with bars
  const total = counts.reduce((a,b)=>a+b,0) || 1;
  countsEl.innerHTML = '';
  counts.forEach((v, i) => {
    const pct = Math.round((v/total)*100);
    const row = h('div', { class: 'stack', style: 'margin-bottom:6px;' }, [
      h('div', { class: 'row' }, [ h('strong', {}, `${i+1}. ${node.choices[i]?.label || '—'}`), h('span', { class: 'pill' }, `${v} (${pct}%)`) ]),
      h('div', { style: 'height:6px;background:rgba(148,163,184,.3);border-radius:4px;overflow:hidden' }, [ h('div', { style: `width:${pct}%;height:6px;background:#22c55e;` }) ])
    ]);
    countsEl.appendChild(row);
  });
}

function applyMajority() {
  if (!state.currentNodeId) return;
  const countsEl = $('#vote-counts');
  if (!countsEl) return;
  const { node, c } = currentCaseAndNode();
  if (!node) return;
  // Parse counts from text (simple) or recompute quickly
  const n = node.choices.length;
  // Recompute counts fresh to avoid parsing UI
  // This is synchronous call wrapper
  (async () => {
    const { data } = await supabaseClient
      .from('votes')
      .select('choice_idx')
      .eq('code', state.voting.code)
      .eq('node_id', state.currentNodeId);
    const counts = Array.from({ length: n }, () => 0);
    (data || []).forEach(r => { if (typeof r.choice_idx === 'number' && r.choice_idx < n) counts[r.choice_idx]++; });
    let bestIdx = 0; let best = -1;
    counts.forEach((v, i) => { if (v > best) { best = v; bestIdx = i; } });
    const choice = node.choices[bestIdx];
    if (!choice) return;
    selectChoice(choice, c, null);
  })();
}

async function pushCurrentNodeToSession() {
  try {
    if (!supabaseClient || !state.voting.code || !state.currentNodeId) return;
    await supabaseClient.from('sessions').update({ current_node: state.currentNodeId }).eq('code', state.voting.code);
  } catch {}
}

/* Wire up */
el.openAbout?.addEventListener('click', () => el.aboutDialog.showModal());
load();
renderMenu();
