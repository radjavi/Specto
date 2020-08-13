import * as THREE from 'https://unpkg.com/three@0.119.1/build/three.module.js';
import Stats from 'https://unpkg.com/three@0.119.1/examples/jsm/libs/stats.module.js';
// import { OrbitControls } from 'https://unpkg.com/three@0.119.1/examples/jsm/controls/OrbitControls.js';

let simplex = new SimplexNoise()

// Three.js
var scene, camera, renderer, stats;

// Constants
const SMOOTHING_DELAY = 0.1; // Seconds
const BALL_RADIUS = 30;
const HEMISPHERE_INTENSITY = 0.1;
const SPOTLIGHT_INTENSITY = 0.75;

// Objects
// Ball
var ballGeometry = new THREE.IcosahedronGeometry(BALL_RADIUS, 3);
var ballMaterial = new THREE.MeshPhongMaterial({
  color: 0x111111,
  wireframe: true,
  wireframeLinewidth: 1.5,
});
var ball = new THREE.Mesh(ballGeometry, ballMaterial);

// Floor
var floorGeometry = new THREE.PlaneGeometry(500, 500, 20, 20);
var floorMaterial = new THREE.MeshPhongMaterial({
  color: 0x000000,
  // wireframe: true,
  shininess: 5,
});
var floor = new THREE.Mesh(floorGeometry, floorMaterial);

// Floor Wireframe
var floorWireMaterial = new THREE.MeshPhongMaterial({
  color: 0x0a0a0a,
  wireframe: true,
});
var floorWire = new THREE.Mesh(floorGeometry, floorWireMaterial);

// Hemisphere light
var hemisphere = new THREE.HemisphereLight(0xffffff, 0x555555, 0);

// Spotlight
var spotLights = [
  createSpotlight(0xf234dc), 
  createSpotlight(0x3d34f2),
]

let section = { index: 0 }
let bar     = { size:  0, value: 0 }
let beat    = { size:  0, value: 0 }
let segment = { size:  0, value: 0 }
let tatum   = { size:  0, value: 0 }

// Initialize
initVisuals();

function initVisuals() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  document.body.appendChild(renderer.domElement);

  window.addEventListener('resize', onWindowResize, false);

  scene.fog = new THREE.FogExp2(0x000000, 0.004);

  // Ball
  ball.castShadow = true;
  scene.add(ball);

  // Floor
  floor.receiveShadow = true;
  floor.rotation.x = -0.5 * Math.PI;
  floor.position.set(0, -50, 0);
  scene.add(floor);

  // Floor Wire
  floorWire.receiveShadow = true;
  floorWire.rotation.x = -0.5 * Math.PI;
  floorWire.position.set(0, -50, 0);
  scene.add(floorWire);

  // Lights
  scene.add(hemisphere);

  spotLights.forEach(l => {
    l.lookAt(ball);
    scene.add(l);
  });

  // Performance stats
  stats = new Stats();
  document.body.appendChild( stats.dom );

  animate();
  moveSpotlights();
  lightsFadeIn();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(timeElapsed) {
  requestAnimationFrame(animate);

  if (timeElapsed) {
    moveCamera(timeElapsed);
    animateBall(timeElapsed);
  }

  renderer.render(scene, camera);
  stats.update();
}

function createSpotlight(color) {
  var newSpotLight = new THREE.SpotLight(color, 0);

  newSpotLight.castShadow = true;
  newSpotLight.angle = 0.8;
  newSpotLight.penumbra = 1;
  newSpotLight.decay = 2;
  newSpotLight.distance = 250;

  return newSpotLight;
}

function lightsFadeIn() {
  gsap.to(hemisphere, { intensity: HEMISPHERE_INTENSITY, duration: 5, ease: "power1.inOut" })
  spotLights.forEach(l => gsap.to(l, { intensity: SPOTLIGHT_INTENSITY, duration: Math.random() * 10, ease: "power1.inOut" }))
}

function moveCamera(timeElapsed) {
  camera.position.x = ball.position.x + 150 * Math.cos(5e-5 * timeElapsed);
  camera.position.y = ball.position.y + 20 * Math.sin(5e-5 * timeElapsed);
  camera.position.z = ball.position.z + 150 * Math.sin(5e-5 * timeElapsed);
  camera.lookAt(ball.position);
}

function animateBall(timeElapsed) {
  if (current_state) {
    if (current_state.paused) {
      normalizeBall();
      breathingBall(timeElapsed);
    } else {
      if (current_track.analysis && current_track.features) {
        updateTrack();
        playingBall(timeElapsed);
        playingSpotlights();
        setTrackColors();
      } else {
        loadingBall(timeElapsed);
      }
    }
  } else {
    normalizeBall();
    breathingBall(timeElapsed);
  }
}

function normalizeBall() {
  ball.geometry.vertices.forEach(v => {
    v.normalize();
    v.setLength(BALL_RADIUS);
  });
  ball.geometry.verticesNeedUpdate = true;
  ball.geometry.normalsNeedUpdate = true;
  ball.geometry.computeFaceNormals();
  ball.geometry.computeVertexNormals();
}

function loadingBall(timeElapsed) {
  ball.geometry.vertices.forEach(v => {
    v.normalize();
    v.setLength(BALL_RADIUS + simplex.noise3D(
      v.x + timeElapsed * 5e-4,
      v.y + timeElapsed * 5e-4,
      v.z + timeElapsed * 5e-4
    ));
  });
  ball.geometry.verticesNeedUpdate = true;
  ball.geometry.normalsNeedUpdate = true;
  ball.geometry.computeFaceNormals();
  ball.geometry.computeVertexNormals();
}

function playingBall(timeElapsed) {
  const tempo = current_track.features.tempo;

  const ballOffset = 3*beat.size 
                   + 2*segment.size 
                   + current_track.features.energy;
  const simplexSize = 3*beat.size 
                    + 2*segment.size
                    + 2*current_track.features.energy;
                    + 1;
  const simplexSpeed = timeElapsed * tempo * 4e-6;
  ball.geometry.vertices.forEach(v => {
    v.normalize();
    v.setLength(BALL_RADIUS + ballOffset + simplexSize * simplex.noise3D(
      v.x + simplexSpeed,
      v.y + simplexSpeed,
      v.z + simplexSpeed
    ));
  });
  ball.geometry.verticesNeedUpdate = true;
  ball.geometry.normalsNeedUpdate = true;
  ball.geometry.computeFaceNormals();
  ball.geometry.computeVertexNormals();
}

function playingSpotlights() {
  const i = current_track.segmentIndex >= 0 ? current_track.segmentIndex % spotLights.length : 0;
  const intensity = (20*segment.size*current_track.features.energy + 1) * SPOTLIGHT_INTENSITY;
  spotLights[i].intensity = intensity;
}

function gsapSpotlight(light) {
  gsap.to(light, {
    angle: Math.random() * 0.4 + 0.6,
    penumbra: Math.random() + 0.2,
    duration: Math.random() * 3 + 5, 
    ease: "sine.inOut"
  });
  gsap.to(light.position, {
    x: Math.random() * 300 - 150,
    y: Math.random() * 40 + 80,
    z: Math.random() * 300 - 150,
    duration: Math.random() * 3 + 5, 
    ease: "sine.inOut"
  });
}

function moveSpotlights() {
  spotLights.forEach(l => gsapSpotlight(l));
  setTimeout(moveSpotlights, 8000);
}

function breathingBall(timeElapsed) {
  const scale = 0.05 * (Math.sin(1e-3 * timeElapsed) + 1) + (1 - 0.05) || 1;
  ball.scale.x = scale;
  ball.scale.y = scale;
  ball.scale.z = scale;
}

function setTrackColors() {
  const valence = current_track.features.valence;
  const energy = current_track.features.energy;
  //console.log(`Valence: ${valence}, Energy: ${energy}`);
  spotLights.forEach((l, i) => {
    const color = new THREE.Color(`hsl(
      ${180 + (40*i + 140*energy) * (valence < 0.5 ? 1 : -1)}, 
      ${Math.round(70 + 30*valence)}%, 
      ${Math.round(35 + 15*valence)}%)
    `);
    if (!l.color.equals(color)) l.color = color;
  });
}

function updateTrack() {
  updateCurrentSection();
  updateCurrentBarSize();
  updateCurrentBeatSize();
  updateCurrentSegmentSize();
  updateCurrentTatumSize();
}

function updateCurrentSection() {
  const sections = current_track.analysis.sections;
  let sectionIndex = current_track.sectionIndex;
  for (let i = sectionIndex + 1; i < sections.length; i++) {
    const current_position = current_track.position + (Date.now() - current_track.timestamp);
    if (current_position >= sections[i].start * 1000) {
      sectionIndex = i;
    } else {
      break;
    }
  }
  if (sectionIndex !== current_track.sectionIndex) {
    //console.log(sections[sectionIndex]);
    current_track.sectionIndex = sectionIndex;
    section.index = sectionIndex;
  }
}

function updateCurrentBarSize() {
  const bars = current_track.analysis.bars;
  let barIndex = current_track.barIndex;
  for (let i = barIndex + 1; i < bars.length; i++) {
    const current_position = current_track.position 
                           + (Date.now() - current_track.timestamp)
                           + SMOOTHING_DELAY;
    if (current_position >= bars[i].start * 1000) {
      barIndex = i;
    } else {
      break;
    }
  }
  if (barIndex !== current_track.barIndex) {
    //console.log(bars[barIndex]);
    current_track.barIndex = barIndex;
    gsap.set(bar, { value: bars[barIndex].confidence });
    gsap.to(bar, { 
      size: bars[barIndex].confidence,
      ease: "power4.out",
      duration: SMOOTHING_DELAY, 
    });
    gsap.to(bar, { 
      delay: SMOOTHING_DELAY,
      size: 0, 
      duration: bars[barIndex].duration,
    });
  }
}

function updateCurrentBeatSize() {
  const beats = current_track.analysis.beats;
  let beatIndex = current_track.beatIndex;
  for (let i = beatIndex + 1; i < beats.length; i++) {
    const current_position = current_track.position 
                           + (Date.now() - current_track.timestamp)
                           + SMOOTHING_DELAY;
    if (current_position >= beats[i].start * 1000) {
      beatIndex = i;
    } else {
      break;
    }
  }
  if (beatIndex !== current_track.beatIndex) {
    //console.log(beats[beatIndex]);
    current_track.beatIndex = beatIndex;
    gsap.set(beat, { value: Math.tanh(3*beats[beatIndex].confidence) });
    gsap.to(beat, { 
      size: Math.tanh(3*beats[beatIndex].confidence),
      ease: "power4.out",
      duration: SMOOTHING_DELAY, 
    });
    gsap.to(beat, { 
      delay: SMOOTHING_DELAY,
      size: 0, 
      duration: beats[beatIndex].duration,
    });
  }
}

function updateCurrentSegmentSize() {
  const segments = current_track.analysis.segments;
  let segmentIndex = current_track.segmentIndex;
  for (let i = segmentIndex + 1; i < segments.length; i++) {
    const current_position = current_track.position 
                           + (Date.now() - current_track.timestamp)
                           + SMOOTHING_DELAY;
    if (current_position >= segments[i].start * 1000) {
      segmentIndex = i;
    } else {
      break;
    }
  }
  if (segmentIndex !== current_track.segmentIndex && segments[segmentIndex].duration >= SMOOTHING_DELAY) {
    //console.log(segments[segmentIndex]);
    current_track.segmentIndex = segmentIndex;
    gsap.set(segment, { value: segment.value + (segments[segmentIndex].confidence - segment.value) / 50 });
    gsap.to(segment, { 
        size: segment.value,
        duration: SMOOTHING_DELAY, 
      })
    gsap.to(segment, { 
      delay: SMOOTHING_DELAY,
      size: 0, 
      duration: segments[segmentIndex].duration,
    });
  }
}

function updateCurrentTatumSize() {
  const tatums = current_track.analysis.tatums;
  let tatumIndex = current_track.tatumIndex;
  for (let i = tatumIndex + 1; i < tatums.length; i++) {
    const current_position = current_track.position 
                           + (Date.now() - current_track.timestamp)
                           + SMOOTHING_DELAY;
    if (current_position >= tatums[i].start * 1000) {
      tatumIndex = i;
    } else {
      break;
    }
  }
  if (tatumIndex !== current_track.tatumIndex) {
    //console.log(tatums[tatumIndex]);
    current_track.tatumIndex = tatumIndex;
    gsap.set(tatum, { value: tatums[tatumIndex].confidence });
    gsap.to(tatum, { 
      size: tatums[tatumIndex].confidence,
      ease: "power4.out",
      duration: SMOOTHING_DELAY, 
    })
    gsap.to(tatum, { 
      delay: SMOOTHING_DELAY,
      size: 0, 
      duration: tatums[tatumIndex].duration,
    });
  }
}