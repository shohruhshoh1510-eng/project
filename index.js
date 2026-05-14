let pokemons = [] 
let activeType = localStorage.getItem('activeType') || 'all' 
let searchVal = localStorage.getItem('searchVal') || '' 
 
const icons = {
  fire: 'fa-fire', water: 'fa-droplet', grass: 'fa-leaf',
  electric: 'fa-bolt', psychic: 'fa-brain', ice: 'fa-snowflake',
  dragon: 'fa-dragon', dark: 'fa-moon', fighting: 'fa-hand-fist',
  poison: 'fa-skull', ground: 'fa-mound', flying: 'fa-feather',
  bug: 'fa-bug', rock: 'fa-mountain', ghost: 'fa-ghost',
  steel: 'fa-shield', normal: 'fa-circle', fairy: 'fa-star'
}
 
const savedTheme = localStorage.getItem('theme')
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark')
  document.documentElement.classList.remove('light')
} else {
  document.documentElement.classList.add('light')
}
 
function toggleDark() {
  const html = document.documentElement
  if (html.classList.contains('dark')) {
    html.classList.remove('dark')
    html.classList.add('light')
    localStorage.setItem('theme', 'light')
    document.getElementById('dark-icon').className = 'fa-solid fa-moon text-slate-600 text-base'
  } else {
    html.classList.add('dark')
    html.classList.remove('light')
    localStorage.setItem('theme', 'dark')
    document.getElementById('dark-icon').className = 'fa-solid fa-sun text-yellow-400 text-base'
  }
}
 
if (document.documentElement.classList.contains('dark')) {
  document.getElementById('dark-icon').className = 'fa-solid fa-sun text-yellow-400 text-base'
}
 
let isOpen = false
function toggleMenu() {
  isOpen = !isOpen
  const m = document.getElementById('mobile-menu')
  const ic = document.getElementById('burger-icon')
  if (isOpen) {
    m.classList.add('open')
    ic.className = 'fa-solid fa-xmark text-red-500 text-base'
  } else {
    m.classList.remove('open')
    ic.className = 'fa-solid fa-bars text-slate-600 dark:text-slate-300 text-base'
  }
}

function closeMenu() {
  isOpen = false
  document.getElementById('mobile-menu').classList.remove('open')
  document.getElementById('burger-icon').className = 'fa-solid fa-bars text-slate-600 dark:text-slate-300 text-base'
}

function el(tag, classes, text) {
  const e = document.createElement(tag)
  if (classes) e.className = classes
  if (text !== undefined) e.textContent = text
  return e
}

function makeIcon(iconClass) {
  const i = document.createElement('i')
  i.className = 'fa-solid ' + iconClass + ' text-xs'
  return i
}

function makeTypeBadge(typeName, extraClass) {
  const span = el('span', 'type-' + typeName + ' text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1' + (extraClass ? ' ' + extraClass : ''))
  span.appendChild(makeIcon(icons[typeName] || 'fa-circle'))
  span.appendChild(document.createTextNode(firstUp(typeName)))
  return span
}
 
function restoreState() {
  if (searchVal) {
    const searchInput = document.getElementById('search-input')
    searchInput.value = searchVal
    document.getElementById('clear-btn').classList.remove('hidden')
  }
 
  document.querySelectorAll('.type-pill').forEach(btn => {
    btn.style.outline = btn.dataset.type === activeType ? '3px solid #EF4444' : 'none'
    btn.style.outlineOffset = '2px'
  })
}
async function loadPokemon() {
  try {
    const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=200')
    const data = await res.json()
    const list = data.results
 
    for (let i = 0; i < list.length; i += 30) { 
      const chunk = list.slice(i, i + 30)
      const results = await Promise.all(chunk.map(p => fetch(p.url).then(r => r.json())))
      pokemons.push(...results)
      showCards() // Har bir bo'lak yuklanganda kartochkalarni yangilash
    }
 
    document.getElementById('loading').style.display = 'none'
  } catch(e) {
    // Xatolik ko'rsatish
    const loadEl = document.getElementById('loading')
    loadEl.textContent = ''
    const errP = el('p', 'text-red-400 font-bold text-center py-8')
    errP.appendChild(makeIcon('fa-triangle-exclamation'))
    errP.appendChild(document.createTextNode(' Internet ulanishini tekshiring'))
    loadEl.appendChild(errP)
  }
}
 
function getList() {
  return pokemons.filter(p => {
    const okType = activeType === 'all' || p.types.some(t => t.type.name === activeType)
    const okSearch = p.name.includes(searchVal.toLowerCase().trim())
    return okType && okSearch
  })
}

function makeCard(p) {
  const id = p.id
  const name = firstUp(p.name)
  const img = p.sprites.other['official-artwork'].front_default || p.sprites.front_default || ''
  const types = p.types.map(t => t.type.name)
 
  const card = el('div', 'poke-card bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-md border border-slate-100 dark:border-slate-700')
  card.addEventListener('click', function() { openCard(id) }) // Bosilganda modalni ochish
 
  const top = el('div', 'relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 pt-4 pb-1 flex justify-center')
  top.appendChild(el('span', 'absolute top-2 left-3 text-xs font-black text-slate-300 dark:text-slate-500 pixel', '#' + String(id).padStart(3, '0')))
 
  if (img) {
    const image = document.createElement('img')
    image.src = img
    image.className = 'w-24 h-24 object-contain drop-shadow-lg'
    image.loading = 'lazy'
    top.appendChild(image)
  }
 
  card.appendChild(top)
  const bottom = el('div', 'px-3 py-3')
  bottom.appendChild(el('h3', 'font-black text-sm text-center text-slate-800 dark:text-white mb-2', name))
 
  const badgesWrap = el('div', 'flex flex-wrap gap-1 justify-center')
  types.forEach(t => badgesWrap.appendChild(makeTypeBadge(t)))
  bottom.appendChild(badgesWrap)
  card.appendChild(bottom)
 
  return card
}

function showCards() {
  const grid = document.getElementById('grid')
  const list = getList()
 
  document.getElementById('count-label').textContent = list.length > 0 ? list.length + ' ta Pokémon' : ''
 
  const noRes = document.getElementById('no-results')
  if (list.length === 0 && pokemons.length > 0) {
    grid.textContent = ''
    noRes.classList.remove('hidden')
    return
  }
  noRes.classList.add('hidden')
 
  grid.textContent = ''
  list.forEach(p => grid.appendChild(makeCard(p)))
}

function filterType(type) {
  activeType = type
  localStorage.setItem('activeType', type) 
 
  document.querySelectorAll('.type-pill').forEach(btn => {
    btn.style.outline = btn.dataset.type === type ? '3px solid #EF4444' : 'none'
    btn.style.outlineOffset = '2px'
  })
  showCards()
}

function onSearch(val) {
  searchVal = val.trim()
  localStorage.setItem('searchVal', searchVal) // Qidiruvni saqlash
  document.getElementById('clear-btn').classList.toggle('hidden', !val.trim())
  showCards()
}

function clearSearch() {
  document.getElementById('search-input').value = ''
  searchVal = ''
  localStorage.removeItem('searchVal')
  document.getElementById('clear-btn').classList.add('hidden')
  showCards()
}

function showSkeleton(content) {
  content.textContent = ''
  const wrap = el('div', 'flex flex-col gap-4 animate-pulse')
  wrap.appendChild(el('div', 'skeleton h-48 rounded-2xl'))
  wrap.appendChild(el('div', 'skeleton h-6 w-2/3 rounded-full mx-auto'))
  wrap.appendChild(el('div', 'skeleton h-4 w-1/2 rounded-full mx-auto'))
  wrap.appendChild(el('div', 'skeleton h-24 rounded-xl'))
  content.appendChild(wrap)
}
 
function makeStatRow(statName, val, statClr) {
  const pct = Math.min(100, Math.round(val / 255 * 100))
  const lbl = statName.replace('special-attack', 'Sp.Atk').replace('special-defense', 'Sp.Def').replace('hp', 'HP')
  const clr = statClr[statName] || 'bg-slate-400'
 
  const row = el('div', 'flex items-center gap-2')
  row.appendChild(el('span', 'text-xs font-bold text-slate-500 dark:text-slate-400 w-16 shrink-0', lbl))
 
  const barWrap = el('div', 'flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden')
  const bar = el('div', 'stat-bar ' + clr + ' rounded-full')
  bar.style.width = pct + '%'
  barWrap.appendChild(bar)
  row.appendChild(barWrap)
  row.appendChild(el('span', 'text-xs font-black text-slate-700 dark:text-slate-300 w-8 text-right', String(val)))
  return row
}
 
function buildModalContent(content, p, id, desc) {
  content.textContent = ''
  const name = firstUp(p.name)
  const img = p.sprites.other['official-artwork'].front_default || p.sprites.front_default || ''
  const types = p.types.map(t => t.type.name)
  const statClr = { hp: 'bg-red-400', attack: 'bg-orange-400', defense: 'bg-yellow-400', 'special-attack': 'bg-blue-400', 'special-defense': 'bg-green-400', speed: 'bg-pink-400' }
 
  const header = el('div', 'text-center mb-4')
  header.appendChild(el('span', 'pixel text-xs text-slate-400', '#' + String(id).padStart(3, '0')))
  
  const imgWrap = el('div', 'flex justify-center mt-1')
  if (img) {
    const image = document.createElement('img')
    image.src = img
    image.className = 'w-40 h-40 object-contain drop-shadow-2xl'
    imgWrap.appendChild(image)
  }
  header.appendChild(imgWrap)
  header.appendChild(el('h2', 'text-2xl font-black text-slate-800 dark:text-white mt-2', name))
 
  const typesWrap = el('div', 'flex gap-2 justify-center mt-2')
  types.forEach(t => typesWrap.appendChild(makeTypeBadge(t, 'px-3 py-1')))
  header.appendChild(typesWrap)
  content.appendChild(header)
 
  if (desc) content.appendChild(el('p', 'text-sm text-slate-500 dark:text-slate-400 text-center italic mb-4 px-2', '"' + desc + '"'))
 
  const infoGrid = el('div', 'grid grid-cols-3 gap-3 mb-5')
  const infoItems = [
    { val: (p.height/10).toFixed(1) + 'm', lbl: 'Balandlik', icon: 'fa-ruler-vertical' },
    { val: (p.weight/10).toFixed(1) + 'kg', lbl: 'Vazn', icon: 'fa-weight-hanging' },
    { val: String(p.base_experience || '?'), lbl: 'Exp', icon: 'fa-star' }
  ]
  infoItems.forEach(item => {
    const cell = el('div', 'bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center')
    cell.appendChild(el('div', 'text-lg font-black text-slate-800 dark:text-white', item.val))
    const sub = el('div', 'text-xs text-slate-400 mt-0.5')
    sub.appendChild(makeIcon(item.icon)); sub.appendChild(document.createTextNode(' ' + item.lbl))
    cell.appendChild(sub); infoGrid.appendChild(cell)
  })
  content.appendChild(infoGrid)
  
  const statsSection = el('div', 'mb-4')
  const statsTitle = el('h3', 'font-black text-sm text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2')
  statsTitle.appendChild(makeIcon('fa-chart-bar text-red-400')); statsTitle.appendChild(document.createTextNode('Statistikalar'))
  statsSection.appendChild(statsTitle)
  const statsRows = el('div', 'flex flex-col gap-2.5')
  p.stats.forEach(s => statsRows.appendChild(makeStatRow(s.stat.name, s.base_stat, statClr)))
  statsSection.appendChild(statsRows); content.appendChild(statsSection)

  const abSection = el('div')
  const abTitle = el('h3', 'font-black text-sm text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2')
  abTitle.appendChild(makeIcon('fa-wand-magic-sparkles text-purple-400')); abTitle.appendChild(document.createTextNode('Qobiliyatlar'))
  abSection.appendChild(abTitle)
  const abWrap = el('div', 'flex flex-wrap gap-2')
  p.abilities.forEach(a => {
    const badge = el('span', 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold px-3 py-1 rounded-full', firstUp(a.ability.name))
    if (a.is_hidden) badge.appendChild(makeIcon('fa-eye-slash opacity-60 ml-1'))
    abWrap.appendChild(badge)
  })
  abSection.appendChild(abWrap); content.appendChild(abSection)
}

async function openCard(id) {
  const overlay = document.getElementById('modal-overlay'), box = document.getElementById('modal-box'), content = document.getElementById('modal-content')
  overlay.classList.replace('hidden', 'flex')
  setTimeout(() => { overlay.style.opacity = '1'; box.style.opacity = '1'; box.style.transform = 'scale(1)' }, 10)
 
  showSkeleton(content)
  let p = pokemons.find(x => x.id === id) || await fetch('https://pokeapi.co/api/v2/pokemon/' + id).then(r => r.json())
 
  let desc = ''
  try {
    const spec = await fetch('https://pokeapi.co/api/v2/pokemon-species/' + id).then(r => r.json())
    desc = (spec.flavor_text_entries.find(e => e.language.name === 'en') || {}).flavor_text.replace(/\f/g, ' ') || ''
  } catch(e) {}
 
  buildModalContent(content, p, id, desc)
}

function closeModal(event) {
  if (event && event.target !== document.getElementById('modal-overlay') && !event.target.closest('button[onclick="closeModal(null)"]')) return
  const overlay = document.getElementById('modal-overlay'), box = document.getElementById('modal-box')
  box.style.opacity = '0'; box.style.transform = 'scale(0.95)'
  setTimeout(() => { overlay.classList.replace('flex', 'hidden'); overlay.style.opacity = ''; box.style.opacity = ''; box.style.transform = '' }, 200)
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(null) })

window.addEventListener('scroll', () => {
  const btn = document.getElementById('scroll-top')
  btn.style.opacity = window.scrollY > 400 ? '1' : '0'
  btn.style.pointerEvents = window.scrollY > 400 ? 'auto' : 'none'
})
 
function firstUp(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : '' }

restoreState()
loadPokemon()