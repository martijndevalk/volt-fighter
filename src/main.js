import { Rive, Fit, Alignment, RuntimeLoader } from '@rive-app/webgl2'
import riveWasmUrl from '@rive-app/webgl2/rive.wasm?url'

// WASM lokaal serveren i.p.v. van unpkg
RuntimeLoader.setWasmUrl(riveWasmUrl)

const canvas = document.getElementById('game')
const padLabel = document.getElementById('pad')

// ---- Besturing (standaard Gamepad-mapping) ---------------------------------
const DEADZONE = 0.25
const BTN = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, START: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 }

let vmi = null
const props = {}

function bind(name, kind) {
  try {
    const p = vmi?.[kind]?.(name)
    if (p) props[name] = p
  } catch {}
}

function setBool(name, v) {
  const p = props[name]
  if (p && p.value !== v) p.value = v
}
function setNum(name, v) {
  const p = props[name]
  if (p && p.value !== v) p.value = v
}
function fire(name) {
  props[name]?.trigger()
}

const rive = new Rive({
  src: `${import.meta.env.BASE_URL}volt_fighter.riv`,
  canvas,
  artboard: 'Game',
  stateMachine: 'GameSM',
  autoplay: true,
  autoBind: true,
  fit: Fit.Contain,
  alignment: Alignment.Center,
  onLoad: () => {
    rive.resizeDrawingSurfaceToCanvas()
    vmi = rive.viewModelInstance
    ;['leftHeld', 'rightHeld', 'jumpHeld', 'shootHeld'].forEach((n) => bind(n, 'boolean'))
    ;['moveX'].forEach((n) => bind(n, 'number'))
    ;['jumpTrigger', 'shootTrigger', 'startTrigger'].forEach((n) => bind(n, 'trigger'))
    console.log('[VoltFighter] gebonden VM-properties:', Object.keys(props))
  },
})

window.addEventListener('resize', () => rive.resizeDrawingSurfaceToCanvas())

// ---- Gamepad polling ---------------------------------------------------------
const prev = { jump: false, shoot: false, start: false }
let hadPad = false

function activePad() {
  return [...(navigator.getGamepads?.() ?? [])].find((g) => g && g.connected)
}

function tick() {
  const pad = activePad()
  if (!!pad !== hadPad) { hadPad = !!pad; updateLabel() }
  if (pad && vmi) {
    const b = (i) => !!pad.buttons[i]?.pressed
    let x = pad.axes[0] ?? 0
    if (Math.abs(x) < DEADZONE) x = 0
    if (b(BTN.LEFT)) x = -1
    if (b(BTN.RIGHT)) x = 1

    const left = x < 0
    const right = x > 0
    const jump = b(BTN.A) || b(BTN.B) || b(BTN.UP) || b(BTN.LB)
    const shoot = b(BTN.X) || b(BTN.Y) || b(BTN.RB) || b(BTN.RT) || b(BTN.LT)
    const start = b(BTN.START) || jump // START of SPRING start het spel

    setBool('leftHeld', left)
    setBool('rightHeld', right)
    setBool('jumpHeld', jump)
    setBool('shootHeld', shoot)
    setNum('moveX', x)

    if (jump && !prev.jump) fire('jumpTrigger')
    if (shoot && !prev.shoot) fire('shootTrigger')
    if (start && !prev.start) fire('startTrigger')
    prev.jump = jump
    prev.shoot = shoot
    prev.start = start
  }
  requestAnimationFrame(tick)
}
requestAnimationFrame(tick)

function updateLabel() {
  const pad = activePad()
  padLabel.textContent = pad ? `Gamepad: ${pad.id}` : 'Geen gamepad – druk op een knop'
}
window.addEventListener('gamepadconnected', updateLabel)
window.addEventListener('gamepaddisconnected', updateLabel)
