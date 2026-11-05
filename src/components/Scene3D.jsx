// نماذج ثلاثية الأبعاد تفاعلية: تدور وتتحرك، وكل جزء قابل للضغط لعرض معلوماته
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Icon from './Icons.jsx'
import { MODEL_PARTS } from '../data/models.js'

/* ---------------- أدوات الرسم */
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}
function seeded(seed) { return () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 } }

function earthTexture() {
  return canvasTex(1024, 512, (g, w, h) => {
    const sea = g.createLinearGradient(0, 0, 0, h)
    sea.addColorStop(0, '#1b4f8f'); sea.addColorStop(0.5, '#2a7bd0'); sea.addColorStop(1, '#1b4f8f')
    g.fillStyle = sea; g.fillRect(0, 0, w, h)
    const r = seeded(42)
    const land = [[0.2, 0.3, 0.1], [0.26, 0.6, 0.07], [0.29, 0.75, 0.05], [0.5, 0.3, 0.07], [0.53, 0.55, 0.09], [0.6, 0.4, 0.06], [0.7, 0.28, 0.11], [0.78, 0.45, 0.06], [0.86, 0.68, 0.05]]
    for (const [cx, cy, rad] of land) {
      for (let i = 0; i < 46; i++) {
        const a = r() * Math.PI * 2, d = r() * rad * w * 0.85
        const x = cx * w + Math.cos(a) * d, y = cy * h + Math.sin(a) * d * 0.55
        const rr = (0.25 + r() * 0.5) * rad * w * 0.45
        g.fillStyle = r() < 0.72 ? '#3f9d58' : '#c2a46a'
        g.beginPath(); g.ellipse(x, y, rr, rr * 0.7, r() * 3, 0, Math.PI * 2); g.fill()
      }
    }
    g.fillStyle = 'rgba(255,255,255,0.95)'
    g.fillRect(0, 0, w, h * 0.055); g.fillRect(0, h * 0.945, w, h * 0.055)
    g.fillStyle = 'rgba(255,255,255,0.35)'
    for (let i = 0; i < 60; i++) { g.beginPath(); g.ellipse(r() * w, r() * h, 20 + r() * 50, 4 + r() * 8, 0, 0, Math.PI * 2); g.fill() }
  })
}
function bandTexture(colors) {
  return canvasTex(256, 128, (g, w, h) => {
    const r = seeded(colors.length * 7)
    let y = 0
    while (y < h) {
      const bh = 4 + r() * 14
      g.fillStyle = colors[Math.floor(r() * colors.length)]
      g.fillRect(0, y, w, bh)
      y += bh
    }
  })
}
function glowSprite(color, scale) {
  const tex = canvasTex(128, 128, (g) => {
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    grd.addColorStop(0, color); grd.addColorStop(0.35, color.replace('1)', '0.5)')); grd.addColorStop(1, color.replace('1)', '0)'))
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128)
  })
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
  s.scale.setScalar(scale)
  return s
}
function starfield(n = 1400, radius = 70) {
  const r = seeded(5)
  const pos = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const u = r() * 2 - 1, t = r() * Math.PI * 2, s = Math.sqrt(1 - u * u)
    pos.set([radius * s * Math.cos(t), radius * u, radius * s * Math.sin(t)], i * 3)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.8 }))
}
const hitSphere = (r, key) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }))
  m.userData.key = key
  return m
}

/* ---------------- النماذج */
function buildAtmosphere(scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.6))
  const sun = new THREE.DirectionalLight(0xffffff, 2)
  sun.position.set(-4, 3, 4)
  scene.add(sun)
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), new THREE.MeshStandardMaterial({ map: earthTexture(), roughness: 0.85 }))
  earth.userData.key = 'earth'
  scene.add(earth)
  const shells = [['tropo', 1.13, '#7cc6e8'], ['strato', 1.3, '#4aa3cf'], ['meso', 1.47, '#2f7fb0'], ['thermo', 1.66, '#1f5f8f'], ['exo', 1.88, '#173f66']]
  const pick = [earth], anchors = { earth: { obj: earth, at: new THREE.Vector3(-0.3, -0.75, 0.6) } }, mats = {}
  let prev = 1
  shells.forEach(([key, r, col], i) => {
    const mat = new THREE.MeshPhongMaterial({ color: col, transparent: true, opacity: 0.17, side: THREE.DoubleSide, depthWrite: false, shininess: 60, emissive: col, emissiveIntensity: 0.15 })
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 72, 48, Math.PI * 0.25, Math.PI * 1.5), mat)
    m.userData.key = key
    scene.add(m); pick.push(m); mats[key] = mat
    const mid = (prev + r) / 2, e = (12 + i * 13) * Math.PI / 180
    anchors[key] = { obj: scene, at: new THREE.Vector3(-mid * Math.cos(e), mid * Math.sin(e), 0) }
    prev = r
  })
  // شهاب في الميزوسفير
  const meteor = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd166' }))
  scene.add(meteor)
  const tail = glowSprite('rgba(255,209,102,1)', 0.25)
  scene.add(tail)
  return {
    camera: [-3.6, 1.9, 2.6],
    pick, anchors,
    update(t, dt, play) {
      if (play) earth.rotation.y += dt * 0.25
      const a = (t * 0.6) % (Math.PI * 2)
      meteor.position.set(-1.38 * Math.cos(a * 0.5 + 2), 1.38 * Math.sin(a * 0.5 + 2) * 0.6, 0.8)
      tail.position.copy(meteor.position)
    },
    highlight(key) {
      for (const [k, m] of Object.entries(mats)) { m.opacity = !key ? 0.17 : k === key ? 0.55 : 0.08; m.emissiveIntensity = k === key ? 0.6 : 0.15 }
    },
  }
}

function buildFronts(scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.75))
  const dl = new THREE.DirectionalLight(0xffffff, 1.6)
  dl.position.set(-3, 6, 5)
  scene.add(dl)
  const r = seeded(13)
  const frontX = (y) => -0.6 + y * 2.15 // سطح الإسفين البارد
  const pick = [], anchors = {}, mats = {}

  // الأرض
  const ground = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.35, 4.6), new THREE.MeshStandardMaterial({ color: '#5c9e5a', roughness: 1 }))
  ground.position.y = -0.175
  scene.add(ground)
  const soil = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.25, 4.6), new THREE.MeshStandardMaterial({ color: '#8a6a45', roughness: 1 }))
  soil.position.y = -0.47
  scene.add(soil)

  // الكتلة الباردة: إسفين
  const shape = new THREE.Shape()
  shape.moveTo(-0.6, 0)
  shape.lineTo(5.25, 0)
  shape.lineTo(5.25, (5.25 + 0.6) / 2.15)
  shape.lineTo(-0.6, 0)
  const cold = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 4.4, bevelEnabled: false }),
    new THREE.MeshPhongMaterial({ color: '#3b82f6', transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide, emissive: '#1d4ed8', emissiveIntensity: 0.2 }))
  cold.position.z = -2.2
  cold.userData.key = 'cold'
  scene.add(cold); pick.push(cold); mats.cold = cold.material
  anchors.cold = { obj: scene, at: new THREE.Vector3(4.9, 0.45, 1.9) }

  // الكتلة الدافئة: حجم شفاف يسار الجبهة
  const warm = new THREE.Mesh(new THREE.BoxGeometry(4.6, 3.2, 4.4), new THREE.MeshPhongMaterial({ color: '#fb923c', transparent: true, opacity: 0.1, depthWrite: false, emissive: '#f97316', emissiveIntensity: 0.15 }))
  warm.position.set(-2.95, 1.6, 0)
  warm.userData.key = 'warm'
  scene.add(warm); pick.push(warm); mats.warm = warm.material
  anchors.warm = { obj: scene, at: new THREE.Vector3(-3.6, 1.1, 1.2) }

  // رمز الجبهة على الأرض
  const line = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 4.4), new THREE.MeshBasicMaterial({ color: '#1d4ed8' }))
  line.position.set(-0.6, 0.02, 0)
  scene.add(line)
  for (let z = -1.9; z <= 1.9; z += 0.95) {
    const tri = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.3, 3), new THREE.MeshBasicMaterial({ color: '#1d4ed8' }))
    tri.rotation.z = Math.PI / 2
    tri.position.set(-0.78, 0.05, z)
    scene.add(tri)
  }
  const frontHit = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 4.4), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }))
  frontHit.position.set(-0.7, 0.1, 0)
  frontHit.userData.key = 'front'
  scene.add(frontHit); pick.push(frontHit)
  anchors.front = { obj: scene, at: new THREE.Vector3(-0.8, 0.15, 2.3) }

  // جزيئات الهواء الدافئ: تتقدم ثم تصعد فوق الإسفين
  const NW = 360, wpos = new Float32Array(NW * 3)
  const wz = new Float32Array(NW)
  const resetW = (i) => { wpos[i * 3] = -5 + r() * 3; wpos[i * 3 + 1] = 0.15 + r() * 0.9; wz[i] = (r() - 0.5) * 4; wpos[i * 3 + 2] = wz[i] }
  for (let i = 0; i < NW; i++) { resetW(i); wpos[i * 3] += r() * 4 }
  const wg = new THREE.BufferGeometry()
  wg.setAttribute('position', new THREE.BufferAttribute(wpos, 3))
  scene.add(new THREE.Points(wg, new THREE.PointsMaterial({ color: '#ff9a3c', size: 0.07, transparent: true, opacity: 0.9 })))
  const risingHit = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 4.4), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }))
  risingHit.position.set(frontX(1.6) - 0.4, 1.6, 0)
  risingHit.userData.key = 'rising'
  scene.add(risingHit); pick.push(risingHit)
  anchors.rising = { obj: scene, at: new THREE.Vector3(frontX(1.2) - 0.3, 1.2, 1.9) }

  // جزيئات الهواء البارد: تندفع نحو اليسار قرب الأرض
  const NC = 200, cpos = new Float32Array(NC * 3)
  const resetC = (i) => { cpos[i * 3] = 5.1; cpos[i * 3 + 1] = 0.08 + r() * 0.5; cpos[i * 3 + 2] = (r() - 0.5) * 4 }
  for (let i = 0; i < NC; i++) { resetC(i); cpos[i * 3] -= r() * 5 }
  const cg = new THREE.BufferGeometry()
  cg.setAttribute('position', new THREE.BufferAttribute(cpos, 3))
  scene.add(new THREE.Points(cg, new THREE.PointsMaterial({ color: '#bfe0ff', size: 0.06, transparent: true, opacity: 0.9 })))

  // الغيمة الركامية الرعدية
  const cloud = new THREE.Group()
  const cmat = new THREE.MeshStandardMaterial({ color: '#eef2f8', roughness: 1, emissive: '#000000' })
  const puffs = [[0, 0, 0, 0.9], [0.9, 0.1, 0.3, 0.75], [-0.8, 0.05, -0.2, 0.7], [0.3, 0.75, 0, 0.8], [-0.3, 1.35, 0.1, 0.65], [0.4, 1.8, -0.1, 0.55], [1.2, 1.95, 0, 0.5], [-0.6, 1.95, 0.1, 0.5], [0.2, 0.1, -0.9, 0.7], [0.1, 0.1, 0.95, 0.7]]
  for (const [x, y, z, s] of puffs) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(s, 24, 16), cmat)
    m.position.set(x, y, z)
    m.userData.key = 'cloud'
    cloud.add(m); pick.push(m)
  }
  const anvil = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.0, 0.35, 32), cmat)
  anvil.position.y = 2.35
  anvil.userData.key = 'cloud'
  cloud.add(anvil); pick.push(anvil)
  cloud.position.set(3.5, 3.05, 0)
  cloud.scale.setScalar(0.72)
  scene.add(cloud)
  mats.cloud = cmat
  anchors.cloud = { obj: cloud, at: new THREE.Vector3(0, 2.8, 0) }

  // المطر
  const NR = 260, rpos = new Float32Array(NR * 3)
  const resetR = (i) => { rpos[i * 3] = 2.6 + r() * 1.9; rpos[i * 3 + 1] = 2.6 + r() * 0.3; rpos[i * 3 + 2] = (r() - 0.5) * 1.6 }
  for (let i = 0; i < NR; i++) { resetR(i); rpos[i * 3 + 1] -= r() * 2.6 }
  const rg = new THREE.BufferGeometry()
  rg.setAttribute('position', new THREE.BufferAttribute(rpos, 3))
  scene.add(new THREE.Points(rg, new THREE.PointsMaterial({ color: '#7cc4ff', size: 0.05 })))
  const rainHit = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.4, 1.8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }))
  rainHit.position.set(3.5, 1.5, 0)
  rainHit.userData.key = 'rain'
  scene.add(rainHit); pick.push(rainHit)
  anchors.rain = { obj: scene, at: new THREE.Vector3(3.3, 2.35, 1.1) }

  // البرق
  const bolt = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(3.60, 2.7, 0.4), new THREE.Vector3(3.35, 2.1, 0.4), new THREE.Vector3(3.65, 1.9, 0.4),
    new THREE.Vector3(3.30, 1.2, 0.4), new THREE.Vector3(3.55, 1.0, 0.4), new THREE.Vector3(3.20, 0.3, 0.4),
  ]), new THREE.LineBasicMaterial({ color: '#ffe66d' }))
  bolt.visible = false
  scene.add(bolt)
  const flash = glowSprite('rgba(255,236,140,1)', 2.4)
  flash.position.set(3.45, 1.6, 0.4)
  flash.visible = false
  scene.add(flash)
  let flashUntil = 0

  return {
    camera: [-2.2, 4.4, 12.5],
    target: [1.0, 1.7, 0],
    pick, anchors,
    update(t, dt, play) {
      if (!play) return
      for (let i = 0; i < NW; i++) {
        const x = wpos[i * 3], y = wpos[i * 3 + 1]
        if (x < frontX(y) - 0.12) wpos[i * 3] += dt * 1.1
        else { wpos[i * 3 + 1] += dt * 1.0; wpos[i * 3] = frontX(wpos[i * 3 + 1]) - 0.12 - r() * 0.05 }
        if (wpos[i * 3 + 1] > 3.0) resetW(i)
      }
      wg.attributes.position.needsUpdate = true
      for (let i = 0; i < NC; i++) {
        cpos[i * 3] -= dt * 1.2
        if (cpos[i * 3] < -0.4) resetC(i)
      }
      cg.attributes.position.needsUpdate = true
      for (let i = 0; i < NR; i++) {
        rpos[i * 3 + 1] -= dt * 3.2
        if (rpos[i * 3 + 1] < 0.02) resetR(i)
      }
      rg.attributes.position.needsUpdate = true
      if (t > flashUntil + 1.2 && r() < 0.012) flashUntil = t + 0.14
      bolt.visible = flash.visible = t < flashUntil
    },
    highlight(key) {
      mats.cold.opacity = key === 'cold' ? 0.5 : 0.28
      mats.warm.opacity = key === 'warm' ? 0.32 : 0.1
      mats.cloud.emissive.set(key === 'cloud' ? '#3a5fcf' : '#000000')
    },
  }
}

function buildSolar(scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.28))
  scene.add(new THREE.PointLight(0xffffff, 3.2, 0, 0))
  const sun = new THREE.Mesh(new THREE.SphereGeometry(1.3, 48, 32), new THREE.MeshBasicMaterial({ color: '#ffb53d' }))
  sun.userData.key = 'sun'
  scene.add(sun, glowSprite('rgba(255,190,80,1)', 6.5))
  const P = [
    ['mercury', 0.16, 2.3, '#b7b0a6', 1.6], ['venus', 0.26, 3.0, '#e8c27a', 1.2], ['earth', 0.28, 3.9, null, 1.0],
    ['mars', 0.21, 4.8, '#d2643c', 0.8], ['jupiter', 0.66, 7.0, ['#d8b48a', '#b98a5e', '#efd9b9', '#a46e48'], 0.45],
    ['saturn', 0.56, 8.9, ['#e6cf9c', '#cfb37a', '#f1e2bd'], 0.33], ['uranus', 0.4, 10.5, '#8fd8e3', 0.24], ['neptune', 0.39, 11.9, '#3f6fe0', 0.19],
  ]
  const pick = [sun], anchors = { sun: { obj: sun, at: new THREE.Vector3(0, 1.6, 0) } }, mats = {}, pivots = []
  const r = seeded(9)
  for (const [key, rad, dist, col, speed] of P) {
    const pivot = new THREE.Group()
    pivot.rotation.y = r() * Math.PI * 2
    scene.add(pivot)
    const mat = new THREE.MeshStandardMaterial({
      map: key === 'earth' ? earthTexture() : Array.isArray(col) ? bandTexture(col) : null,
      color: key === 'earth' || Array.isArray(col) ? '#ffffff' : col, roughness: 0.8, emissive: '#000000',
    })
    const m = new THREE.Mesh(new THREE.SphereGeometry(rad, 40, 28), mat)
    m.position.x = dist
    m.userData.key = key
    if (key === 'uranus') m.rotation.z = 1.7
    pivot.add(m)
    const hit = hitSphere(Math.max(rad * 1.6, 0.35), key)
    m.add(hit)
    pick.push(m, hit); mats[key] = mat
    anchors[key] = { obj: m, at: new THREE.Vector3(0, rad + 0.35, 0) }
    pivots.push({ pivot, speed, mesh: m })
    const orbit = new THREE.Mesh(new THREE.RingGeometry(dist - 0.008, dist + 0.008, 160), new THREE.MeshBasicMaterial({ color: '#9fb4d9', transparent: true, opacity: 0.35, side: THREE.DoubleSide }))
    orbit.rotation.x = -Math.PI / 2
    scene.add(orbit)
    if (key === 'saturn') {
      const ring = new THREE.Mesh(new THREE.RingGeometry(rad * 1.35, rad * 2.2, 64), new THREE.MeshBasicMaterial({ color: '#ead9a8', transparent: true, opacity: 0.75, side: THREE.DoubleSide }))
      ring.rotation.x = -Math.PI / 2.5
      m.add(ring)
    }
    if (key === 'earth') {
      const mp = new THREE.Group()
      m.add(mp)
      const moon = new THREE.Mesh(new THREE.SphereGeometry(0.08, 20, 14), new THREE.MeshStandardMaterial({ color: '#d9d6cf', emissive: '#000000' }))
      moon.position.x = 0.55
      moon.userData.key = 'moon'
      const mhit = hitSphere(0.22, 'moon')
      moon.add(mhit)
      mp.add(moon)
      pick.push(moon, mhit); mats.moon = moon.material
      anchors.moon = { obj: moon, at: new THREE.Vector3(0, 0.25, 0) }
      pivots.push({ pivot: mp, speed: 5, mesh: moon })
    }
  }
  // حزام الكويكبات
  const n = 900, pos = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, d = 5.6 + r() * 0.8
    pos.set([Math.cos(a) * d, (r() - 0.5) * 0.18, Math.sin(a) * d], i * 3)
  }
  const bg = new THREE.BufferGeometry()
  bg.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const belt = new THREE.Group()
  belt.add(new THREE.Points(bg, new THREE.PointsMaterial({ color: '#c9b79c', size: 0.05 })))
  const beltHit = hitSphere(0.45, 'belt')
  beltHit.position.set(6, 0, 0)
  belt.add(beltHit)
  scene.add(belt)
  pick.push(beltHit)
  anchors.belt = { obj: beltHit, at: new THREE.Vector3(0, 0.35, 0) }
  return {
    camera: [0, 11.5, 19],
    pick, anchors,
    update(t, dt, play) {
      if (!play) return
      for (const p of pivots) { p.pivot.rotation.y += dt * p.speed * 0.35; p.mesh.rotation.y += dt * 0.6 }
      belt.rotation.y += dt * 0.05
    },
    highlight(key) {
      for (const [k, m] of Object.entries(mats)) m.emissive?.set(k === key ? '#3a6df0' : '#000000')
    },
  }
}

function buildGalaxy(scene) {
  const r = seeded(21)
  const group = new THREE.Group()
  scene.add(group)
  const N = 9000, arms = 3, R = 6
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3)
  const inner = new THREE.Color('#ffe2a6'), outer = new THREE.Color('#6d8dff')
  for (let i = 0; i < N; i++) {
    const rad = Math.pow(r(), 1.5) * R
    const branch = ((i % arms) / arms) * Math.PI * 2
    const spin = rad * 0.95
    const jitter = () => Math.pow(r(), 3) * (r() < 0.5 ? 1 : -1) * 0.55 * (0.3 + rad / R)
    pos.set([Math.cos(branch + spin) * rad + jitter(), jitter() * 0.35, Math.sin(branch + spin) * rad + jitter()], i * 3)
    const c = inner.clone().lerp(outer, rad / R)
    col.set([c.r, c.g, c.b], i * 3)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  group.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.045, vertexColors: true, depthWrite: false, blending: THREE.AdditiveBlending, transparent: true })))
  group.add(glowSprite('rgba(255,215,140,1)', 3.2))

  const armPoint = (rad, arm, lift = 0) => {
    const a = (arm / arms) * Math.PI * 2 + rad * 0.95
    return new THREE.Vector3(Math.cos(a) * rad, lift, Math.sin(a) * rad)
  }
  const spots = {
    core: { p: new THREE.Vector3(0, 0, 0), color: '#ffe7b0', size: 0.0, hit: 0.7 },
    arm: { p: armPoint(4.6, 1), color: '#9db4ff', size: 0.0, hit: 0.5 },
    sun: { p: armPoint(3.7, 2, 0.05), color: '#ffd23f', size: 0.09, hit: 0.35 },
    nebula: { p: armPoint(5.0, 0, 0.1), color: '#ff7ab6', size: 0.0, hit: 0.55 },
    blue: { p: armPoint(2.5, 1, 0.1), color: '#7fb2ff', size: 0.12, hit: 0.35 },
    red: { p: armPoint(3.2, 0, 0.1), color: '#ff6a4d', size: 0.17, hit: 0.38 },
  }
  const pick = [], anchors = {}, marks = {}
  for (const [key, s] of Object.entries(spots)) {
    const holder = new THREE.Group()
    holder.position.copy(s.p)
    group.add(holder)
    if (s.size) holder.add(new THREE.Mesh(new THREE.SphereGeometry(s.size, 20, 14), new THREE.MeshBasicMaterial({ color: s.color })))
    if (key !== 'core' && key !== 'arm') holder.add(glowSprite(hexToRgba(s.color), key === 'nebula' ? 1.6 : 0.7))
    const hit = hitSphere(s.hit, key)
    holder.add(hit)
    pick.push(hit)
    const ring = new THREE.Mesh(new THREE.RingGeometry(s.hit * 0.9, s.hit, 48), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, side: THREE.DoubleSide }))
    ring.rotation.x = -Math.PI / 2
    holder.add(ring)
    marks[key] = ring
    anchors[key] = { obj: holder, at: new THREE.Vector3(0, s.hit + 0.15, 0) }
  }
  return {
    camera: [0, 6.2, 7.2],
    pick, anchors,
    update(t, dt, play) {
      if (play) group.rotation.y += dt * 0.06
      for (const m of Object.values(marks)) if (m.material.opacity > 0) m.rotation.z += dt
    },
    highlight(key) { for (const [k, m] of Object.entries(marks)) m.material.opacity = k === key ? 0.9 : 0 },
  }
}
function hexToRgba(hex) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},1)`
}

const DARK = new Set(['solar', 'galaxy'])
const BUILDERS = { atmosphere: buildAtmosphere, fronts: buildFronts, solar: buildSolar, galaxy: buildGalaxy }

/* ---------------- المكوّن */
export default function Scene3D({ model }) {
  const host = useRef(null)
  const labelEls = useRef({})
  const api = useRef({})
  const [sel, setSel] = useState(null)
  const [play, setPlay] = useState(() => !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  const [showLabels, setShowLabels] = useState(() => (window.innerWidth || 1000) > 640)
  const [ok, setOk] = useState(true)
  const playRef = useRef(play)
  playRef.current = play

  const parts = useMemo(() => {
    const base = MODEL_PARTS[model.kind]?.parts || []
    const custom = new Map((model.parts || []).map((p) => [p.key, p]))
    return base.map((p) => ({ ...p, ...(custom.get(p.key) || {}) }))
  }, [model])
  const title = MODEL_PARTS[model.kind]?.title || ''

  useEffect(() => {
    const el = host.current
    const build = BUILDERS[model.kind]
    if (!el || !build) return
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch { setOk(false); return }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    el.prepend(renderer.domElement)
    const scene = new THREE.Scene()
    if (DARK.has(model.kind)) scene.add(starfield())
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200)
    const built = build(scene)
    camera.position.set(...built.camera)
    const controls = new OrbitControls(camera, renderer.domElement)
    const target = new THREE.Vector3(...(built.target || [0, 0, 0]))
    controls.target.copy(target)
    controls.enableDamping = true
    controls.enablePan = false
    controls.enableZoom = false
    controls.rotateSpeed = 0.7
    const homeOff = camera.position.clone().sub(target)
    const home = camera.position.clone()

    const size = () => {
      const w = el.clientWidth, h = el.clientHeight
      renderer.setSize(w, h, false)
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      // الشاشات الضيقة تحتاج الكاميرا أبعد قليلًا حتى يظهر النموذج كاملًا
      const f = Math.max(1, Math.pow(1.35 / camera.aspect, 0.8))
      home.copy(target).add(homeOff.clone().multiplyScalar(f))
      camera.position.copy(home)
    }
    size()
    const ro = new ResizeObserver(size)
    ro.observe(el)

    let visible = true
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(el)

    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2()
    const hitAt = (ev) => {
      const b = renderer.domElement.getBoundingClientRect()
      ndc.set(((ev.clientX - b.left) / b.width) * 2 - 1, -((ev.clientY - b.top) / b.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      const h = ray.intersectObjects(built.pick, false)[0]
      return h?.object.userData.key || null
    }
    let down = null
    const onDown = (e) => { down = { x: e.clientX, y: e.clientY } }
    const onUp = (e) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return
      const k = hitAt(e)
      if (k) setSel(k)
    }
    let lastMove = 0
    const onMove = (e) => {
      const now = performance.now()
      if (now - lastMove < 60) return
      lastMove = now
      renderer.domElement.style.cursor = hitAt(e) ? 'pointer' : 'grab'
    }
    renderer.domElement.addEventListener('pointerdown', onDown)
    renderer.domElement.addEventListener('pointerup', onUp)
    renderer.domElement.addEventListener('pointermove', onMove)

    const v = new THREE.Vector3(), camDir = new THREE.Vector3()
    const clock = new THREE.Clock()
    let raf
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min(clock.getDelta(), 0.05)
      if (!visible) return
      controls.update()
      built.update(clock.elapsedTime, dt, playRef.current)
      renderer.render(scene, camera)
      const w = el.clientWidth, h = el.clientHeight
      camera.getWorldDirection(camDir)
      for (const [key, a] of Object.entries(built.anchors)) {
        const lab = labelEls.current[key]
        if (!lab) continue
        a.obj.updateWorldMatrix(true, false)
        v.copy(a.at).applyMatrix4(a.obj.matrixWorld)
        const behind = v.clone().sub(camera.position).dot(camDir) < 0
        v.project(camera)
        lab.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px, ${(-v.y * 0.5 + 0.5) * h}px) translate(-50%, -100%)`
        lab.style.opacity = behind || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05 ? '0' : ''
      }
    }
    loop()

    api.current = {
      highlight: built.highlight,
      reset: () => { camera.position.copy(home); controls.target.copy(target) },
      zoom: (f) => { const off = camera.position.clone().sub(controls.target).multiplyScalar(f); const d = off.length(); if (d > 1.5 && d < 40) camera.position.copy(controls.target).add(off) },
    }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect(); io.disconnect(); controls.dispose()
      renderer.domElement.removeEventListener('pointerdown', onDown)
      renderer.domElement.removeEventListener('pointerup', onUp)
      renderer.domElement.removeEventListener('pointermove', onMove)
      scene.traverse((o) => {
        o.geometry?.dispose?.()
        const m = o.material
        ;(Array.isArray(m) ? m : m ? [m] : []).forEach((x) => { x.map?.dispose?.(); x.dispose?.() })
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [model.kind])

  useEffect(() => { api.current.highlight?.(sel) }, [sel])

  const current = parts.find((p) => p.key === sel)

  if (!ok) return null

  return (
    <section className={`model3d ${DARK.has(model.kind) ? 'dark' : ''}`}>
      <div className="m3-stage" ref={host}>
        <div className="m3-labels" aria-hidden={!showLabels} style={{ visibility: showLabels ? 'visible' : 'hidden' }}>
          {parts.map((p) => (
            <button key={p.key} ref={(e) => { labelEls.current[p.key] = e }} className={`m3-label ${sel === p.key ? 'on' : ''}`} onClick={() => setSel(p.key)}>{p.title}</button>
          ))}
        </div>
        <div className="m3-tools">
          <button onClick={() => setPlay((x) => !x)} aria-label={play ? 'إيقاف الحركة' : 'تشغيل الحركة'}>{play ? '❚❚' : '▶'}</button>
          <button onClick={() => api.current.zoom?.(0.85)} aria-label="تكبير">+</button>
          <button onClick={() => api.current.zoom?.(1.18)} aria-label="تصغير">−</button>
          <button onClick={() => setShowLabels((x) => !x)} aria-label="الأسماء" className={showLabels ? 'on' : ''}>Aa</button>
          <button onClick={() => { api.current.reset?.(); setSel(null) }} aria-label="إعادة الضبط">⟲</button>
        </div>
        <span className="m3-badge">نموذج ثلاثي الأبعاد · {title}</span>
      </div>
      <aside className="m3-info">
        {current ? (
          <div className="m3-card" key={current.key}>
            <span className="eyebrow">{title}</span>
            <h3>{current.title}</h3>
            <p>{current.text}</p>
          </div>
        ) : (
          <div className="m3-card">
            <span className="eyebrow">{title}</span>
            <h3>اضغطي على أي جزء</h3>
            <p className="muted">اسحبي لتدوير النموذج.</p>
          </div>
        )}
        <div className="m3-chips">
          {parts.map((p) => <button key={p.key} aria-pressed={sel === p.key} onClick={() => setSel(p.key)}>{p.title}</button>)}
        </div>
      </aside>
    </section>
  )
}
