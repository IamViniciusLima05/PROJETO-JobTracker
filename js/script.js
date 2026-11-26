/* JobTracker — quadro de candidaturas com arrastar e soltar */

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const escapar = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const banco = {
  ler(k, padrao) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? padrao; } catch { return padrao; } },
  salvar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem storage */ } }
};

const STATUS = [
  { id: 'interesse', nome: 'Interesse', cor: '#868e96' },
  { id: 'aplicado', nome: 'Aplicado', cor: '#3451e0' },
  { id: 'entrevista', nome: 'Entrevista', cor: '#f59f00' },
  { id: 'proposta', nome: 'Proposta', cor: '#2f9e44' },
  { id: 'recusado', nome: 'Encerrado', cor: '#e03131' }
];
const CORES_EMP = ['#3451e0', '#7048e8', '#0ca678', '#e8590c', '#d6336c', '#1098ad', '#5f3dc4', '#c2255c'];
const corEmp = (n) => CORES_EMP[[...n].reduce((s, c) => s + c.charCodeAt(0), 0) % CORES_EMP.length];
const hojeISO = () => new Date().toISOString().slice(0, 10);
const diasAtras = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
const emDias = (n, h) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(h, 0, 0, 0); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };

function exemplos() {
  return [
    { id: 1, empresa: 'Nubank', cargo: 'Desenvolvedor Front-end Pleno', status: 'entrevista', modelo: 'Remoto', salario: 'R$ 9.000 a 11.000', data: diasAtras(12), link: '', entrevista: emDias(1, 14), etapa: 'Técnica com o time', recrutador: { nome: 'Juliana Prado', email: 'juliana@exemplo.com', fone: '', linkedin: '' }, notas: 'Revisar React e acessibilidade.' },
    { id: 2, empresa: 'Zenvia', cargo: 'Analista de Suporte N2', status: 'aplicado', modelo: 'Híbrido', salario: '', data: diasAtras(3), link: '', entrevista: '', etapa: '', recrutador: { nome: '', email: '', fone: '', linkedin: '' }, notas: '' },
    { id: 3, empresa: 'SAP Labs', cargo: 'Desenvolvedor Web Júnior', status: 'aplicado', modelo: 'Presencial', salario: 'R$ 5.500', data: diasAtras(6), link: '', entrevista: '', etapa: '', recrutador: { nome: 'Marcos Lima', email: '', fone: '(51) 90000-0000', linkedin: '' }, notas: 'Escritório em São Leopoldo.' },
    { id: 4, empresa: 'Agência Pixel', cargo: 'Web Designer', status: 'proposta', modelo: 'Remoto', salario: 'R$ 6.000', data: diasAtras(20), link: '', entrevista: '', etapa: '', recrutador: { nome: 'Bia Souza', email: '', fone: '', linkedin: '' }, notas: 'Responder até sexta.' },
    { id: 5, empresa: 'Sicredi', cargo: 'Analista de Infraestrutura', status: 'entrevista', modelo: 'Híbrido', salario: '', data: diasAtras(9), link: '', entrevista: emDias(4, 10), etapa: 'Conversa com o gestor', recrutador: { nome: '', email: '', fone: '', linkedin: '' }, notas: '' },
    { id: 6, empresa: 'TOTVS', cargo: 'Suporte Técnico', status: 'recusado', modelo: 'Presencial', salario: '', data: diasAtras(30), link: '', entrevista: '', etapa: '', recrutador: { nome: '', email: '', fone: '', linkedin: '' }, notas: 'Vaga preenchida internamente.' },
    { id: 7, empresa: 'Hostinger', cargo: 'Desenvolvedor WordPress', status: 'interesse', modelo: 'Remoto', salario: '', data: '', link: '', entrevista: '', etapa: '', recrutador: { nome: '', email: '', fone: '', linkedin: '' }, notas: 'Pedir indicação para o Rafa.' }
  ];
}
let vagas = banco.ler('jt_vagas', null) ?? exemplos();
let editando = null, filtro = '';
const salvar = () => banco.salvar('jt_vagas', vagas);

/* ---------- Desenho ---------- */
function quando(dt) {
  const d = new Date(dt), hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const dias = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - hoje) / 864e5);
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (dias === 0) return `Hoje, ${hora}`;
  if (dias === 1) return `Amanhã, ${hora}`;
  return `${d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}, ${hora}`;
}
function idade(data) {
  const d = Math.max(0, Math.round((Date.now() - new Date(data + 'T12:00')) / 864e5));
  return d === 0 ? 'hoje' : d === 1 ? 'ontem' : `há ${d} d`;
}
function card(v) {
  const i = STATUS.findIndex((s) => s.id === v.status);
  const futura = v.entrevista && new Date(v.entrevista) >= new Date(Date.now() - 36e5);
  const tags = [v.modelo, v.salario, futura ? `📅 ${quando(v.entrevista)}` : '', v.data ? idade(v.data) : ''].filter(Boolean);
  return `<article class="card" draggable="true" data-id="${v.id}" style="--c:${STATUS[i].cor}" tabindex="0" aria-label="${escapar(v.empresa)}, ${escapar(v.cargo)}">
    <div class="card__emp"><span class="ini" style="background:${corEmp(v.empresa)}">${escapar(v.empresa.slice(0, 2).toUpperCase())}</span>${escapar(v.empresa)}</div>
    <p class="card__cargo">${escapar(v.cargo)}</p>
    <div class="tags">${tags.map((t) => `<span class="tag ${t.startsWith('📅') ? 'entrev' : ''}">${escapar(t)}</span>`).join('')}</div>
    <div class="card__mover"><button type="button" data-mover="-1" ${i === 0 ? 'disabled' : ''} aria-label="Mover para ${STATUS[i - 1]?.nome}">← ${STATUS[i - 1]?.nome ?? ''}</button><button type="button" data-mover="1" ${i === STATUS.length - 1 ? 'disabled' : ''} aria-label="Mover para ${STATUS[i + 1]?.nome}">${STATUS[i + 1]?.nome ?? ''} →</button></div>
  </article>`;
}
function desenhar() {
  const f = filtro.toLowerCase();
  const visiveis = vagas.filter((v) => !f || `${v.empresa} ${v.cargo}`.toLowerCase().includes(f));
  $('#quadro').innerHTML = STATUS.map((s) => {
    const lista = visiveis.filter((v) => v.status === s.id).sort((a, b) => (a.entrevista || '9').localeCompare(b.entrevista || '9') || b.id - a.id);
    return `<section class="coluna" data-status="${s.id}" style="--c:${s.cor}" aria-label="${s.nome}">
      <div class="coluna__topo"><i></i>${s.nome}<span>${lista.length}</span></div>
      <div class="cards">${lista.map(card).join('') || `<p class="vazio-col">${f ? 'Nada encontrado' : 'Arraste uma candidatura para cá'}</p>`}</div></section>`;
  }).join('');
  desenharResumo();
}
function desenharResumo() {
  const enviadas = vagas.filter((v) => v.status !== 'interesse');
  const chegaram = vagas.filter((v) => ['entrevista', 'proposta'].includes(v.status) || v.entrevista);
  $('#s-total').textContent = vagas.length;
  $('#s-ativas').textContent = vagas.filter((v) => ['aplicado', 'entrevista', 'proposta'].includes(v.status)).length;
  $('#s-taxa').textContent = enviadas.length ? `${Math.round((chegaram.length / enviadas.length) * 100)}%` : '0%';
  $('#s-semana').textContent = vagas.filter((v) => v.data && v.data >= diasAtras(7)).length;
  const prox = vagas.filter((v) => v.entrevista && new Date(v.entrevista) >= new Date(Date.now() - 36e5) && v.status !== 'recusado').sort((a, b) => a.entrevista.localeCompare(b.entrevista)).slice(0, 4);
  $('#proximas').innerHTML = `<h2>Próximas<br>entrevistas</h2>` + (prox.length ? prox.map((v) => `<button class="prox ${v.entrevista.slice(0, 10) === hojeISO() || quando(v.entrevista).startsWith('Amanhã') ? 'hoje' : ''}" data-abrir="${v.id}"><small>${escapar(quando(v.entrevista))}</small>${escapar(v.empresa)}${v.etapa ? ` · ${escapar(v.etapa)}` : ''}</button>`).join('') : '<span class="nada">Nenhuma entrevista marcada.</span>');
}

/* ---------- Arrastar e soltar ---------- */
let arrastado = null;
$('#quadro').addEventListener('dragstart', (e) => {
  const c = e.target.closest('.card'); if (!c) return;
  arrastado = +c.dataset.id; c.classList.add('arrastando');
  e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', c.dataset.id);
});
$('#quadro').addEventListener('dragend', () => { arrastado = null; $$('.arrastando, .alvo').forEach((el) => el.classList.remove('arrastando', 'alvo')); });
$('#quadro').addEventListener('dragover', (e) => {
  const col = e.target.closest('.coluna'); if (!col || arrastado == null) return;
  e.preventDefault();
  $$('.coluna.alvo').forEach((c) => c !== col && c.classList.remove('alvo')); col.classList.add('alvo');
});
$('#quadro').addEventListener('drop', (e) => {
  const col = e.target.closest('.coluna'); if (!col) return;
  e.preventDefault();
  mover(+e.dataTransfer.getData('text/plain') || arrastado, col.dataset.status);
});
function mover(id, status) {
  const v = vagas.find((x) => x.id === id);
  if (!v || v.status === status) return;
  v.status = status;
  if (status === 'aplicado' && !v.data) v.data = hojeISO();
  salvar(); desenhar();
  toast(`${v.empresa} → ${STATUS.find((s) => s.id === status).nome}${status === 'proposta' ? ' 🎉' : ''}`);
}

$('#quadro').addEventListener('click', (e) => {
  const m = e.target.closest('[data-mover]');
  const c = e.target.closest('.card');
  if (!c) return;
  const v = vagas.find((x) => x.id === +c.dataset.id);
  if (m) { const i = STATUS.findIndex((s) => s.id === v.status) + +m.dataset.mover; if (STATUS[i]) mover(v.id, STATUS[i].id); return; }
  abrir(v);
});
$('#quadro').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.classList.contains('card')) abrir(vagas.find((x) => x.id === +e.target.dataset.id)); });
$('#proximas').addEventListener('click', (e) => { const b = e.target.closest('[data-abrir]'); if (b) abrir(vagas.find((x) => x.id === +b.dataset.abrir)); });

/* ---------- Formulário ---------- */
$('#f-status').innerHTML = STATUS.map((s) => `<option value="${s.id}">${s.nome}</option>`).join('');
const CAMPOS = { empresa: 'f-empresa', cargo: 'f-cargo', status: 'f-status', modelo: 'f-modelo', salario: 'f-salario', data: 'f-data', link: 'f-link', entrevista: 'f-entrevista', etapa: 'f-etapa', notas: 'f-notas' };
const REC = { nome: 'f-rnome', email: 'f-remail', fone: 'f-rfone', linkedin: 'f-rlinkedin' };
function abrir(v) {
  editando = v ? v.id : null;
  $('#dlg-titulo').textContent = v ? `${v.empresa}` : 'Nova candidatura';
  Object.entries(CAMPOS).forEach(([k, id]) => { $('#' + id).value = v ? v[k] ?? '' : ''; });
  Object.entries(REC).forEach(([k, id]) => { $('#' + id).value = v ? v.recrutador?.[k] ?? '' : ''; });
  if (!v) { $('#f-status').value = 'aplicado'; $('#f-data').value = hojeISO(); $('#f-modelo').value = 'Remoto'; }
  $('#dlg').returnValue = '';
  const ex = $('#excluir'); ex.hidden = !v; ex.textContent = 'Excluir';
  $('#dlg').showModal();
}
$('#nova').addEventListener('click', () => abrir(null));
$('#excluir').addEventListener('click', (e) => {
  if (e.target.textContent !== 'Confirmar exclusão') { e.target.textContent = 'Confirmar exclusão'; return; }
  vagas = vagas.filter((v) => v.id !== editando); salvar(); desenhar(); $('#dlg').close('excluir'); toast('Candidatura excluída');
});
$('#dlg').addEventListener('close', () => {
  if ($('#dlg').returnValue !== 'salvar') return;
  const dados = Object.fromEntries(Object.entries(CAMPOS).map(([k, id]) => [k, $('#' + id).value.trim()]));
  dados.recrutador = Object.fromEntries(Object.entries(REC).map(([k, id]) => [k, $('#' + id).value.trim()]));
  if (dados.entrevista && dados.status !== 'proposta' && dados.status !== 'recusado') dados.status = 'entrevista';
  if (editando) Object.assign(vagas.find((v) => v.id === editando), dados);
  else vagas.push({ id: Date.now(), ...dados });
  salvar(); desenhar(); toast(editando ? 'Alterações salvas' : 'Candidatura adicionada');
});
$('#busca').addEventListener('input', (e) => { filtro = e.target.value.trim(); desenhar(); });

let timerToast;
function toast(msg) { const t = $('#toast'); (document.querySelector('dialog[open]') || document.body).append(t); t.textContent = msg; t.hidden = false; clearTimeout(timerToast); timerToast = setTimeout(() => { t.hidden = true; }, 2400); }

desenhar();
