'use client'

import { useEffect, useRef, useState } from 'react'
import { MAP_STYLES } from '@/lib/mapStyles'
import {
  STEPS, ACTS, GLOBE_VIEW, FINAL_CODE, MORSE_TABLE, SAVE_KEY,
  normalize, haversineM, fmtDist,
  type View, type Step, type Act, type SaveData,
} from './game'

const HINTS_TOTAL = 3

export default function GameClient() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const maplibreRef = useRef<any>(null)
  const pickMarkersRef = useRef<any[]>([])
  const rewardMarkerRef = useRef<any>(null)
  const locateMarkerRef = useRef<any>(null)
  const journeyRef = useRef<[number, number][]>([])
  const pickHandlerRef = useRef<(id: string) => void>(() => {})
  const locateHandlerRef = useRef<(lngLat: { lng: number; lat: number }) => void>(() => {})
  const modeRef = useRef<'text' | 'pick' | 'locate' | 'none'>('none')
  const stepIndexRef = useRef(0)
  const spinRef = useRef<number | null>(null)
  const audioRef = useRef<AudioContext | null>(null)

  const [phase, setPhase] = useState<'intro' | 'playing' | 'won'>('intro')
  const [mapReady, setMapReady] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [earned, setEarned] = useState<string[]>([])
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<{ msg: string; type: string }>({ msg: '', type: '' })
  const [reward, setReward] = useState<Step | null>(null)
  const [actCard, setActCard] = useState<Act | null>(null)
  const [isFinalLock, setIsFinalLock] = useState(false)
  const [lockDials, setLockDials] = useState<number[]>(() => FINAL_CODE.split('').map(() => 0))
  const [elapsed, setElapsed] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [journalOpen, setJournalOpen] = useState(false)
  const [morseOpen, setMorseOpen] = useState(false)
  const [muted, setMuted] = useState(false)
  const [locateInfo, setLocateInfo] = useState<string>('')
  const [hasSave, setHasSave] = useState(false)

  const step = STEPS[stepIndex]
  stepIndexRef.current = stepIndex

  /* ── SAVE / LOAD ─────────────────────────────────── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (raw) {
        const d = JSON.parse(raw) as SaveData
        if (d && Array.isArray(d.earned) && d.earned.length > 0 && d.earned.length < STEPS.length + 1) setHasSave(true)
      }
    } catch {}
  }, [])
  function persist(next: Partial<SaveData>) {
    try {
      const data: SaveData = { stepIndex, earned, elapsed, hintsUsed, ...next }
      localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    } catch {}
  }
  function clearSave() { try { localStorage.removeItem(SAVE_KEY) } catch {} }

  /* ── AUDIO ───────────────────────────────────────── */
  function ac(): AudioContext | null {
    if (muted) return null
    if (!audioRef.current) {
      try { audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)() } catch { return null }
    }
    return audioRef.current
  }
  function beep(freq: number, dur = 0.12, type: OscillatorType = 'sine', gain = 0.05) {
    const c = ac(); if (!c) return
    const o = c.createOscillator(), g = c.createGain()
    o.type = type; o.frequency.value = freq; g.gain.value = gain
    o.connect(g); g.connect(c.destination)
    const t = c.currentTime; o.start(t)
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.stop(t + dur)
  }
  const sfxOk = () => { beep(660, 0.1); window.setTimeout(() => beep(880, 0.15), 90) }
  const sfxErr = () => beep(150, 0.2, 'sawtooth', 0.04)
  const sfxClick = () => beep(420, 0.05, 'square', 0.03)
  const sfxWin = () => { [523, 659, 784, 1047].forEach((f, i) => window.setTimeout(() => beep(f, 0.18), i * 130)) }

  /* ── INIT MAP ────────────────────────────────────── */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false
    import('maplibre-gl').then(({ default: maplibregl }) => {
      if (cancelled || !containerRef.current) return
      maplibreRef.current = maplibregl
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLES.street as any,
        center: GLOBE_VIEW.center, zoom: GLOBE_VIEW.zoom,
        attributionControl: { compact: true },
      })
      mapRef.current = map
      map.on('load', () => {
        try { map.setProjection({ type: 'globe' }) } catch {}
        addBuildings(map)
        addJourneyLayers(map)
        setMapReady(true)
      })
      map.on('click', (e: any) => { if (modeRef.current === 'locate') locateHandlerRef.current(e.lngLat) })
    })
    return () => {
      cancelled = true
      if (spinRef.current) cancelAnimationFrame(spinRef.current)
      mapRef.current?.remove(); mapRef.current = null
    }
  }, [])

  /* ── TIMER ───────────────────────────────────────── */
  useEffect(() => {
    if (phase !== 'playing') return
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  function addBuildings(map: any) {
    try {
      if (!map.getSource('openmaptiles')) map.addSource('openmaptiles', { type: 'vector', url: 'https://tiles.openfreemap.org/planet' })
      if (!map.getLayer('3d-buildings')) {
        map.addLayer({
          id: '3d-buildings', source: 'openmaptiles', 'source-layer': 'building',
          type: 'fill-extrusion', minzoom: 13,
          paint: {
            'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 10], 0, '#3a4460', 20, '#4a5578', 60, '#5b6690', 120, '#6d7aac'],
            'fill-extrusion-height': ['coalesce', ['get', 'render_height'], ['get', 'height'], 10],
            'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
            'fill-extrusion-opacity': 0.9,
          },
        })
      }
    } catch {}
  }

  function addJourneyLayers(map: any) {
    try {
      map.addSource('journey', { type: 'geojson', data: lineFC([]) })
      map.addLayer({ id: 'journey-line', type: 'line', source: 'journey', paint: { 'line-color': '#e0b64a', 'line-width': 2, 'line-dasharray': [2, 2], 'line-opacity': 0.85 } })
      map.addSource('journey-pts', { type: 'geojson', data: ptsFC([]) })
      map.addLayer({ id: 'journey-pts', type: 'circle', source: 'journey-pts', paint: { 'circle-radius': 4, 'circle-color': '#e0b64a', 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.4 } })
    } catch {}
  }
  const lineFC = (coords: [number, number][]) => ({ type: 'FeatureCollection', features: coords.length >= 2 ? [{ type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} }] : [] })
  const ptsFC = (coords: [number, number][]) => ({ type: 'FeatureCollection', features: coords.map((c) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: c }, properties: {} })) })
  function addJourneyPoint(coord: [number, number]) {
    journeyRef.current = [...journeyRef.current, coord]
    const map = mapRef.current; if (!map) return
    try {
      map.getSource('journey')?.setData(lineFC(journeyRef.current))
      map.getSource('journey-pts')?.setData(ptsFC(journeyRef.current))
    } catch {}
  }

  function flyTo(v: View, opts?: { duration?: number }) {
    mapRef.current?.flyTo({ center: v.center, zoom: v.zoom, pitch: v.pitch, bearing: v.bearing, duration: opts?.duration ?? 3200, essential: true })
  }

  /* ── MARKERS ─────────────────────────────────────── */
  function markerEl(html: string) { const el = document.createElement('div'); el.className = 'eg-marker'; el.innerHTML = html; return el }
  function clearStepMarkers() {
    pickMarkersRef.current.forEach((m) => m.remove()); pickMarkersRef.current = []
    rewardMarkerRef.current?.remove(); rewardMarkerRef.current = null
    locateMarkerRef.current?.remove(); locateMarkerRef.current = null
  }
  function addPickMarkers(s: Step) {
    const map = mapRef.current, gl = maplibreRef.current; if (!map || !gl || !s.markers) return
    s.markers.forEach((mk) => {
      const el = markerEl(`<div class="eg-pin eg-pin-pick"><span>${mk.label}</span></div>`); el.style.cursor = 'pointer'
      el.addEventListener('click', (ev) => { ev.stopPropagation(); pickHandlerRef.current(mk.id) })
      pickMarkersRef.current.push(new gl.Marker({ element: el, anchor: 'bottom' }).setLngLat(mk.lngLat).addTo(map))
    })
  }
  function addRewardMarker(s: Step) {
    const map = mapRef.current, gl = maplibreRef.current; if (!map || !gl || !s.marker) return
    rewardMarkerRef.current = new gl.Marker({ element: markerEl(`<div class="eg-pin eg-pin-reward"><span>★</span></div>`), anchor: 'bottom' }).setLngLat(s.marker).addTo(map)
  }

  /* ── DÉROULÉ ─────────────────────────────────────── */
  function startStep(i: number) {
    setStepIndex(i); setAnswer(''); setFeedback({ msg: '', type: '' }); setLocateInfo(''); clearStepMarkers()
    const s = STEPS[i]
    const prevAct = i > 0 ? STEPS[i - 1].act : 0
    const run = () => {
      modeRef.current = s.type === 'locate' ? 'locate' : s.type === 'pick' ? 'pick' : 'text'
      if (s.type === 'pick') { flyTo(s.view); window.setTimeout(() => { addPickMarkers(s); setFeedback({ msg: 'Cliquez la bonne balise sur la carte.', type: 'hint' }) }, 1300) }
      else if (s.type === 'locate') { flyTo(s.view); setFeedback({ msg: 'Déplacez la carte, puis cliquez pour poser votre marqueur.', type: 'hint' }) }
      else { flyTo(GLOBE_VIEW, { duration: 2200 }) }
    }
    if (s.act !== prevAct) { setActCard(ACTS.find((a) => a.id === s.act)!); window.setTimeout(() => { setActCard(null); run() }, 2800) }
    else run()
  }

  function begin(resume = false) {
    ac() // débloque l'audio sur le geste
    if (resume) {
      try {
        const d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null') as SaveData
        if (d) {
          setEarned(d.earned); setElapsed(d.elapsed || 0); setHintsUsed(d.hintsUsed || 0)
          setPhase('playing')
          if (d.earned.length >= STEPS.length) { setIsFinalLock(true); flyTo({ center: [2.35, 48.86], zoom: 2.4, pitch: 0, bearing: 0 }, { duration: 2600 }) }
          else window.setTimeout(() => startStep(d.earned.length), 50)
          return
        }
      } catch {}
    }
    setPhase('playing'); setElapsed(0); setEarned([]); setHintsUsed(0); setIsFinalLock(false)
    journeyRef.current = []
    try { mapRef.current?.getSource('journey')?.setData(lineFC([])); mapRef.current?.getSource('journey-pts')?.setData(ptsFC([])) } catch {}
    startStep(0)
  }

  function solveStep(s: Step) {
    sfxOk()
    addJourneyPoint(s.view.center)
    const newEarned = [...earned, s.digit]
    setEarned(newEarned)
    persist({ earned: newEarned, stepIndex, elapsed, hintsUsed })
    setReward(s)
  }

  // handlers rafraîchis à chaque rendu (closures à jour)
  pickHandlerRef.current = (id: string) => {
    const s = STEPS[stepIndexRef.current]
    if (s.type !== 'pick' || !s.markers) return
    const mk = s.markers.find((m) => m.id === id); if (!mk) return
    if (mk.correct) {
      setFeedback({ msg: 'Bonne balise !', type: 'ok' })
      pickMarkersRef.current.forEach((m) => m.remove()); pickMarkersRef.current = []
      flyTo({ ...s.view, zoom: s.view.zoom + 1.4 }, { duration: 1600 })
      window.setTimeout(() => solveStep(s), 900)
    } else { sfxErr(); setFeedback({ msg: 'Ce n’est pas la bonne balise…', type: 'err' }) }
  }

  locateHandlerRef.current = (lngLat: { lng: number; lat: number }) => {
    const s = STEPS[stepIndexRef.current]
    if (s.type !== 'locate' || !s.target) return
    const map = mapRef.current, gl = maplibreRef.current; if (!map || !gl) return
    locateMarkerRef.current?.remove()
    locateMarkerRef.current = new gl.Marker({ element: markerEl(`<div class="eg-pin eg-pin-locate"><span>◎</span></div>`), anchor: 'bottom' }).setLngLat([lngLat.lng, lngLat.lat]).addTo(map)
    const d = haversineM([lngLat.lng, lngLat.lat], s.target)
    if (d <= (s.toleranceM || 1000)) {
      setLocateInfo(''); setFeedback({ msg: 'Vous y êtes !', type: 'ok' })
      modeRef.current = 'none'
      flyTo({ center: s.target, zoom: 14.5, pitch: 55, bearing: 0 }, { duration: 1800 })
      window.setTimeout(() => solveStep(s), 1100)
    } else {
      sfxClick()
      setLocateInfo(`📍 À ${fmtDist(d)} de la cible — ${d < 4000 ? 'tout près, ajustez.' : 'continuez à chercher.'}`)
    }
  }

  function submitAnswer() {
    if (!step.accept) return
    const val = normalize(answer); if (!val) return
    if (step.accept.some((a) => normalize(a) === val)) {
      setFeedback({ msg: `Exact ! Cap sur ${step.city}…`, type: 'ok' })
      flyTo(step.view)
      window.setTimeout(() => { addRewardMarker(step); solveStep(step) }, 3000)
    } else { sfxErr(); setFeedback({ msg: 'Ce n’est pas la bonne réponse. Réessaie.', type: 'err' }) }
  }

  function useHint() {
    if (hintsUsed >= HINTS_TOTAL) { setFeedback({ msg: 'Plus d’indices disponibles.', type: 'err' }); return }
    sfxClick()
    setHintsUsed((h) => h + 1)
    setFeedback({ msg: '💡 ' + step.hint, type: 'hint' })
  }

  function closeReward() {
    setReward(null)
    if (stepIndex < STEPS.length - 1) startStep(stepIndex + 1)
    else {
      setIsFinalLock(true); clearStepMarkers(); modeRef.current = 'none'
      flyTo({ center: [2.35, 48.86], zoom: 2.4, pitch: 0, bearing: 0 }, { duration: 2600 })
    }
  }

  function setDial(i: number, delta: number) {
    sfxClick()
    setLockDials((d) => d.map((v, k) => (k === i ? (v + delta + 10) % 10 : v)))
  }
  function tryUnlock() {
    if (lockDials.join('') === FINAL_CODE) win()
    else { sfxErr(); setFeedback({ msg: 'Le coffre résiste. Vérifiez chaque molette.', type: 'err' }) }
  }

  function win() {
    sfxWin(); clearSave(); setPhase('won')
    const map = mapRef.current
    if (map) {
      map.flyTo({ center: [10, 25], zoom: 2.2, pitch: 0, bearing: 0, duration: 2000 })
      let bearing = 0
      const spin = () => { bearing = (bearing + 0.35) % 360; map.rotateTo(bearing, { duration: 0 }); spinRef.current = requestAnimationFrame(spin) }
      window.setTimeout(() => { spinRef.current = requestAnimationFrame(spin) }, 2100)
    }
  }

  const score = Math.max(0, 1000 - Math.floor(elapsed / 3) - hintsUsed * 75)
  const rank = score >= 800 ? 'S' : score >= 620 ? 'A' : score >= 420 ? 'B' : 'C'
  const rankColor = rank === 'S' ? '#e0b64a' : rank === 'A' ? '#5ac47a' : rank === 'B' ? '#57b0e6' : '#9aa7bb'
  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`
  const solvedSteps = STEPS.slice(0, earned.length)

  /* ── RENDU ───────────────────────────────────────── */
  return (
    <div className="eg-root">
      <div ref={containerRef} className="eg-map" />

      {phase !== 'intro' && (
        <>
          {/* HUD gauche */}
          <div className="eg-topleft">
            <div className="eg-card">
              <h1 className="eg-title">🗺️ Le Cartographe Fantôme</h1>
              <div className="eg-sub">
                {isFinalLock ? 'Le coffre est devant vous.' : `Acte ${step.act} · ${step.loc}`}
              </div>
              <div className="eg-dots">
                {STEPS.map((s, i) => (
                  <span key={i} className={`eg-dot a${s.act} ${i < earned.length ? 'done' : ''} ${!isFinalLock && i === stepIndex ? 'current' : ''}`} />
                ))}
                <span className={`eg-dot lock ${isFinalLock ? 'current' : ''} ${phase === 'won' ? 'done' : ''}`} />
              </div>
            </div>
          </div>

          {/* HUD droite */}
          <div className="eg-topright">
            <div className="eg-hudrow">
              <button className="eg-icobtn" title="Journal de bord" onClick={() => { sfxClick(); setJournalOpen((v) => !v) }}>📖</button>
              <button className="eg-icobtn" title={muted ? 'Activer le son' : 'Couper le son'} onClick={() => setMuted((m) => !m)}>{muted ? '🔇' : '🔊'}</button>
              <div className="eg-card eg-timer">⏱ <b>{mmss}</b></div>
            </div>
            <div className="eg-card eg-hints">
              Indices&nbsp;
              {Array.from({ length: HINTS_TOTAL }).map((_, i) => (
                <span key={i} className={`eg-hintdot ${i < HINTS_TOTAL - hintsUsed ? 'on' : ''}`} />
              ))}
            </div>
            <div className="eg-card eg-tracker">
              <div className="eg-cap">Code du coffre</div>
              <div className="eg-slots">
                {STEPS.map((_, i) => (
                  <div key={i} className={`eg-slot ${i < earned.length ? 'filled' : ''}`}>{i < earned.length ? earned[i] : '?'}</div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Distance readout (locate) */}
      {phase === 'playing' && !reward && locateInfo && (
        <div className="eg-locate">{locateInfo}</div>
      )}

      {/* Panneau énigme / cadenas */}
      {phase === 'playing' && !reward && !actCard && (
        <div className="eg-puzzle">
          <div className="eg-card eg-puzzle-card">
            {isFinalLock ? (
              <>
                <div className="eg-plabel"><span>Épreuve finale</span><span className="eg-loc">Atelier du Cartographe</span></div>
                <h2 className="eg-ptitle">🔒 Le coffre de laiton</h2>
                <div className="eg-ptext">Composez le code à {FINAL_CODE.length} molettes. Les chiffres sont notés dans votre journal, dans l’ordre de vos découvertes.</div>
                <div className="eg-dials">
                  {lockDials.map((v, i) => (
                    <div key={i} className="eg-dial">
                      <button className="eg-dialbtn" onClick={() => setDial(i, +1)}>▲</button>
                      <div className="eg-dialval">{v}</div>
                      <button className="eg-dialbtn" onClick={() => setDial(i, -1)}>▼</button>
                    </div>
                  ))}
                </div>
                <div className="eg-foot">
                  <div className={`eg-feedback ${feedback.type}`}>{feedback.msg}</div>
                  <button className="eg-btn primary" onClick={tryUnlock}>Ouvrir le coffre</button>
                </div>
              </>
            ) : (
              <>
                <div className="eg-plabel">
                  <span>Énigme {stepIndex + 1} / {STEPS.length}</span>
                  <span className="eg-loc">{step.type === 'pick' || step.type === 'locate' ? step.loc : 'Lieu inconnu'}</span>
                </div>
                <h2 className="eg-ptitle">{step.title}</h2>
                <div className="eg-ptext">{step.text}</div>
                {step.type === 'caesar' && <div className="eg-code">{step.cipher}</div>}
                {step.type === 'morse' && (
                  <div className="eg-morsewrap">
                    <div className="eg-code eg-morse">{step.morse}</div>
                    <button className="eg-btn ghost eg-morsebtn" onClick={() => setMorseOpen(true)}>Table Morse</button>
                  </div>
                )}
                {step.type === 'anagram' && <div className="eg-code eg-scramble">{step.scramble}</div>}
                {step.type === 'sequence' && <div className="eg-code">{step.sequence}</div>}
                {step.type !== 'pick' && step.type !== 'locate' && (
                  <div className="eg-row">
                    <input className="eg-input" autoFocus placeholder="Ta réponse…" value={answer}
                      onChange={(e) => setAnswer(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submitAnswer() }} />
                    <button className="eg-btn primary" onClick={submitAnswer}>Valider</button>
                  </div>
                )}
                <div className="eg-foot">
                  <div className={`eg-feedback ${feedback.type}`}>{feedback.msg}</div>
                  <button className="eg-btn ghost" disabled={hintsUsed >= HINTS_TOTAL} onClick={useHint}>💡 Indice ({HINTS_TOTAL - hintsUsed})</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Journal */}
      {journalOpen && phase !== 'intro' && (
        <div className="eg-journal">
          <div className="eg-card">
            <div className="eg-jhead"><b>📖 Journal de bord</b><button aria-label="Fermer le journal" className="eg-x" onClick={() => setJournalOpen(false)}>✕</button></div>
            {solvedSteps.length === 0 && <div className="eg-jempty">Aucun indice découvert pour l’instant. La piste commence…</div>}
            {solvedSteps.map((s, i) => (
              <div key={i} className="eg-jentry">
                <div className="eg-jtop"><span className="eg-jcity">{s.city}</span><span className="eg-jdigit">{s.digit}</span></div>
                <div className="eg-jlore">« {s.lore} »</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table Morse */}
      {morseOpen && (
        <div className="eg-scrim" onClick={() => setMorseOpen(false)}>
          <div className="eg-modal eg-morsemodal" onClick={(e) => e.stopPropagation()}>
            <h2>Table Morse</h2>
            <div className="eg-morsegrid">
              {Object.entries(MORSE_TABLE).map(([l, c]) => (<div key={l} className="eg-morsecell"><b>{l}</b> <span>{c}</span></div>))}
            </div>
            <button className="eg-btn primary" onClick={() => setMorseOpen(false)}>Fermer</button>
          </div>
        </div>
      )}

      {/* Carte d'acte */}
      {actCard && (
        <div className="eg-scrim eg-actscrim">
          <div className="eg-actcard">
            <div className="eg-acttag">{actCard.subtitle}</div>
            <h2 className="eg-acttitle">{actCard.title}</h2>
            <p className="eg-actblurb">{actCard.blurb}</p>
          </div>
        </div>
      )}

      {/* Récompense */}
      {reward && (
        <div className="eg-scrim">
          <div className="eg-modal">
            <div className="eg-big">🔎</div>
            <h2>Indice découvert — {reward.city}</h2>
            <div className="eg-reward-digit">{reward.digit}</div>
            <p>{reward.reward}</p>
            <p className="eg-lore">« {reward.lore} »</p>
            <button className="eg-btn primary" onClick={closeReward}>{stepIndex < STEPS.length - 1 ? 'Poursuivre la piste →' : 'Rejoindre l’atelier →'}</button>
          </div>
        </div>
      )}

      {/* Intro */}
      {phase === 'intro' && (
        <div className="eg-scrim intro">
          <div className="eg-modal intro">
            <div className="eg-tag">Escape game · Carte 3D · 3 actes</div>
            <h2 className="eg-hero">Le Cartographe Fantôme</h2>
            <p>Votre maître, le plus grand cartographe de son temps, a disparu — vous laissant enfermé dans son bureau
              et une énigme pour seul héritage. Suivez sa piste à travers <b>sept villes du monde</b>, résolvez sept épreuves,
              chacune d’un genre différent, et ouvrez le coffre qui garde son dernier secret.</p>
            <div className="eg-introbtns">
              {hasSave && <button className="eg-btn primary big" disabled={!mapReady} onClick={() => begin(true)}>Continuer</button>}
              <button className={`eg-btn ${hasSave ? '' : 'primary'} big`} disabled={!mapReady} onClick={() => { clearSave(); begin(false) }}>
                {mapReady ? (hasSave ? 'Nouvelle partie' : 'Commencer l’enquête →') : 'Chargement du globe…'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victoire */}
      {phase === 'won' && (
        <div className="eg-scrim">
          <div className="eg-modal eg-winmodal">
            <div className="eg-big">🏆</div>
            <h2>Le coffre est ouvert</h2>
            <p>À l’intérieur, la <b>Carte Absolue</b> — l’œuvre d’une vie — et un mot : « Elle est à toi, désormais.
              Continue de dessiner le monde. » Le Cartographe n’était pas un fantôme. Il vous attendait.</p>
            <div className="eg-stats">
              <div className="eg-stat"><span>Temps</span><b>{Math.floor(elapsed / 60)}m {elapsed % 60}s</b></div>
              <div className="eg-stat"><span>Indices utilisés</span><b>{hintsUsed} / {HINTS_TOTAL}</b></div>
              <div className="eg-stat"><span>Score</span><b>{score}</b></div>
              <div className="eg-stat eg-rank" style={{ color: rankColor }}><span>Rang</span><b>{rank}</b></div>
            </div>
            <button className="eg-btn primary" onClick={() => { setIsFinalLock(false); setLockDials(FINAL_CODE.split('').map(() => 0)); setPhase('intro') }}>Rejouer</button>
          </div>
        </div>
      )}

      <style>{`
        .eg-root{position:fixed;inset:0;overflow:hidden;font-family:'DM Sans',system-ui,sans-serif;color:#eef2f8}
        .eg-map{position:absolute;inset:0;background:#080b12}
        .eg-card{background:rgba(18,23,33,.92);border:1px solid #2c3648;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.55);backdrop-filter:blur(6px)}
        .eg-topleft{position:absolute;left:18px;top:18px;max-width:340px;z-index:10}
        .eg-topleft .eg-card{padding:13px 16px}
        .eg-title{margin:0;font-size:15px;font-weight:700;letter-spacing:.3px}
        .eg-sub{color:#9aa7bb;font-size:12px;margin-top:5px;line-height:1.4}
        .eg-dots{margin-top:9px;display:flex;gap:5px;flex-wrap:wrap}
        .eg-dot{width:20px;height:5px;border-radius:3px;background:#2c3648}
        .eg-dot.done{background:#5ac47a}.eg-dot.current{background:#e0b64a}
        .eg-dot.lock{width:5px;border-radius:50%;height:5px}
        .eg-topright{position:absolute;right:18px;top:18px;display:flex;flex-direction:column;gap:9px;align-items:flex-end;z-index:10}
        .eg-hudrow{display:flex;gap:8px;align-items:center}
        .eg-icobtn{width:38px;height:38px;border-radius:11px;background:rgba(18,23,33,.92);border:1px solid #2c3648;font-size:16px;cursor:pointer;display:grid;place-items:center;transition:.15s}
        .eg-icobtn:hover{border-color:#e0b64a}
        .eg-timer{padding:8px 14px;font-variant-numeric:tabular-nums;font-size:15px;letter-spacing:1px}.eg-timer b{color:#e0b64a}
        .eg-hints{padding:7px 12px;font-size:11px;color:#9aa7bb;display:flex;align-items:center}
        .eg-hintdot{width:9px;height:9px;border-radius:50%;background:#2c3648;margin-left:5px}
        .eg-hintdot.on{background:#57b0e6;box-shadow:0 0 8px rgba(87,176,230,.5)}
        .eg-tracker{padding:11px 14px;display:flex;flex-direction:column;gap:7px;align-items:center}
        .eg-cap{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#9aa7bb}
        .eg-slots{display:flex;gap:5px}
        .eg-slot{width:26px;height:34px;border-radius:7px;background:#1e2635;border:1px solid #2c3648;display:grid;place-items:center;font-size:17px;font-weight:700;color:#9aa7bb}
        .eg-slot.filled{color:#e0b64a;border-color:#e0b64a;box-shadow:0 0 12px rgba(224,182,74,.3)}
        .eg-locate{position:absolute;left:50%;bottom:190px;transform:translateX(-50%);background:rgba(18,23,33,.94);border:1px solid #2c3648;border-radius:20px;padding:8px 16px;font-size:13px;z-index:11}
        .eg-puzzle{position:absolute;left:50%;bottom:26px;transform:translateX(-50%);width:min(620px,94vw);z-index:11}
        .eg-puzzle-card{padding:16px 20px}
        .eg-plabel{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#e0b64a;margin-bottom:6px;display:flex;justify-content:space-between;gap:10px}
        .eg-loc{color:#9aa7bb;letter-spacing:.5px;text-transform:none}
        .eg-ptitle{margin:0 0 8px;font-size:17px}
        .eg-ptext{font-size:14px;line-height:1.55}
        .eg-code{display:inline-block;margin:12px 0 2px;padding:9px 18px;background:#0c0f16;border:1px dashed #57b0e6;border-radius:8px;font-family:'Courier New',monospace;font-size:22px;letter-spacing:5px;color:#57b0e6}
        .eg-morse{letter-spacing:3px;font-size:20px}
        .eg-scramble{letter-spacing:6px;color:#e0b64a;border-color:#e0b64a}
        .eg-morsewrap{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
        .eg-morsebtn{border:1px solid #2c3648!important;padding:8px 12px!important}
        .eg-row{display:flex;gap:9px;margin-top:12px}
        .eg-input{flex:1;background:#0c0f16;color:#eef2f8;border:1px solid #2c3648;border-radius:9px;padding:11px 13px;font-size:15px;font-family:inherit}
        .eg-input:focus{outline:none;border-color:#e0b64a}
        .eg-btn{background:#1e2635;color:#eef2f8;border:1px solid #2c3648;padding:11px 16px;border-radius:9px;font-size:13.5px;cursor:pointer;font-family:inherit;transition:.15s;white-space:nowrap}
        .eg-btn:hover{border-color:#e0b64a;color:#fff}
        .eg-btn:disabled{opacity:.45;cursor:default}
        .eg-btn.primary{background:#e0b64a;color:#1a1206;border-color:#e0b64a;font-weight:700}
        .eg-btn.primary:hover{filter:brightness(1.07)}
        .eg-btn.ghost{background:transparent;color:#9aa7bb;border-color:transparent;padding:11px 8px}
        .eg-btn.ghost:hover{color:#eef2f8}
        .eg-btn.big{padding:13px 20px;font-size:15px}
        .eg-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:11px}
        .eg-feedback{font-size:12.5px;min-height:16px}
        .eg-feedback.err{color:#e0654a}.eg-feedback.ok{color:#5ac47a}.eg-feedback.hint{color:#57b0e6}
        .eg-dials{display:flex;gap:8px;margin:14px 0 4px;justify-content:center}
        .eg-dial{display:flex;flex-direction:column;align-items:center;gap:5px}
        .eg-dialbtn{width:40px;height:24px;border-radius:6px;background:#1e2635;border:1px solid #2c3648;color:#9aa7bb;cursor:pointer;font-size:11px}
        .eg-dialbtn:hover{border-color:#e0b64a;color:#e0b64a}
        .eg-dialval{width:40px;height:46px;border-radius:8px;background:#0c0f16;border:1px solid #e0b64a;display:grid;place-items:center;font-size:26px;font-weight:800;color:#e0b64a;font-family:'Courier New',monospace}
        .eg-scrim{position:absolute;inset:0;background:rgba(4,6,10,.74);z-index:40;display:flex;align-items:center;justify-content:center;padding:20px}
        .eg-scrim.intro{background:radial-gradient(1200px 700px at 50% -15%,rgba(20,28,43,.55),rgba(8,11,18,.82))}
        .eg-modal{width:min(540px,94vw);max-height:88vh;overflow:auto;background:rgba(18,23,33,.96);border:1px solid #2c3648;border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,.6);padding:26px 28px;text-align:center;backdrop-filter:blur(8px)}
        .eg-modal h2{margin:0 0 10px;font-size:20px}
        .eg-modal p{line-height:1.55;font-size:14px;margin:0}
        .eg-lore{color:#9aa7bb;font-style:italic;margin-top:12px!important;font-size:13px}
        .eg-big{font-size:40px;margin-bottom:6px}
        .eg-reward-digit{font-size:52px;font-weight:800;color:#e0b64a;margin:8px 0;text-shadow:0 0 24px rgba(224,182,74,.5)}
        .eg-modal .eg-btn{margin-top:18px}
        .eg-introbtns{display:flex;gap:10px;justify-content:center;margin-top:8px;flex-wrap:wrap}
        .eg-tag{color:#e0b64a;font-size:12px;letter-spacing:2.5px;text-transform:uppercase}
        .eg-hero{margin:8px 0 12px;font-size:28px}
        .eg-actscrim{background:rgba(4,6,10,.9)}
        .eg-actcard{text-align:center;animation:egfade .6s ease}
        .eg-acttag{color:#57b0e6;letter-spacing:3px;text-transform:uppercase;font-size:13px}
        .eg-acttitle{font-size:34px;margin:10px 0;letter-spacing:.5px}
        .eg-actblurb{color:#9aa7bb;max-width:460px;margin:0 auto;line-height:1.6}
        .eg-journal{position:absolute;left:18px;top:150px;width:300px;z-index:12}
        .eg-journal .eg-card{padding:14px 16px;max-height:60vh;overflow:auto}
        .eg-jhead{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:13px}
        .eg-x{background:none;border:none;color:#9aa7bb;cursor:pointer;font-size:14px}
        .eg-jempty{color:#9aa7bb;font-size:12.5px;line-height:1.5}
        .eg-jentry{border-top:1px solid #2c3648;padding:10px 0}
        .eg-jtop{display:flex;justify-content:space-between;align-items:center}
        .eg-jcity{font-weight:700;font-size:13px}
        .eg-jdigit{width:24px;height:24px;border-radius:6px;background:#0c0f16;border:1px solid #e0b64a;color:#e0b64a;display:grid;place-items:center;font-weight:800;font-size:14px}
        .eg-jlore{color:#9aa7bb;font-style:italic;font-size:12px;margin-top:5px;line-height:1.45}
        .eg-morsemodal{max-width:420px}
        .eg-morsegrid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:14px 0;text-align:left}
        .eg-morsecell{font-size:12px;background:#0c0f16;border:1px solid #2c3648;border-radius:6px;padding:5px 8px;font-family:'Courier New',monospace}
        .eg-morsecell b{color:#e0b64a}
        .eg-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:18px 0 4px}
        .eg-stat{background:#0c0f16;border:1px solid #2c3648;border-radius:10px;padding:10px}
        .eg-stat span{display:block;font-size:11px;color:#9aa7bb;text-transform:uppercase;letter-spacing:1px}
        .eg-stat b{font-size:20px}
        .eg-rank b{font-size:26px}
        .eg-winmodal{max-width:480px}
        .eg-marker{will-change:transform}
        .eg-pin{width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:grid;place-items:center;border:2px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.55);font-weight:700}
        .eg-pin>span{transform:rotate(45deg)}
        .eg-pin-pick{background:#57b0e6;color:#04121c;animation:egpulse 2s infinite}
        .eg-pin-reward{background:#e0b64a;color:#1a1206;font-size:18px}
        .eg-pin-locate{background:#e0654a;color:#fff;font-size:16px}
        @keyframes egpulse{0%{box-shadow:0 0 0 0 rgba(87,176,230,.5)}70%{box-shadow:0 0 0 12px rgba(87,176,230,0)}100%{box-shadow:0 0 0 0 rgba(87,176,230,0)}}
        @keyframes egfade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  )
}
