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
var spotLight1 = createSpotlight(0xf234dc);
var spotLight2 = createSpotlight(0xf234dc);
var spotLight3 = createSpotlight(0xf234dc);
var spotLight4 = createSpotlight(0x3d34f2);
var spotLight5 = createSpotlight(0x3d34f2);
var spotLight6 = createSpotlight(0x3d34f2);
var spotLights = [
  spotLight1,
  // spotLight2,
  // spotLight3,
  spotLight4,
  // spotLight5,
  // spotLight6,
]

let trackAnimation = {
  bar: 0,
  beat: 0,
  segment: 0,
  tatum: 0,
};

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

  const ballOffset = 2*trackAnimation.beat 
                   + trackAnimation.segment 
                   + current_track.features.energy;
  const simplexSize = 2*trackAnimation.beat 
                    + trackAnimation.segment
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
  const randomIndex = Math.floor(Math.random() * spotLights.length);
  spotLights[randomIndex].intensity = (10*trackAnimation.segment*current_track.features.energy + 1) * SPOTLIGHT_INTENSITY;
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
    console.log(sections[sectionIndex]);
    current_track.sectionIndex = sectionIndex;
  }
}

function updateCurrentBarSize() {
  const bars = current_track.analysis.bars;
  let barIndex = current_track.barIndex;
  for (let i = barIndex + 1; i < bars.length; i++) {
    const current_position = current_track.position 
                           + (Date.now() - current_track.timestamp)
                           - SMOOTHING_DELAY;
    if (current_position >= bars[i].start * 1000) {
      barIndex = i;
    } else {
      break;
    }
  }
  if (barIndex !== current_track.barIndex) {
    //console.log(bars[barIndex]);
    current_track.barIndex = barIndex;
    gsap.to(trackAnimation, { 
      bar: bars[barIndex].confidence,
      ease: "power4.out",
      duration: SMOOTHING_DELAY, 
    });
    gsap.to(trackAnimation, { 
      delay: SMOOTHING_DELAY,
      bar: 0, 
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
                           - SMOOTHING_DELAY;
    if (current_position >= beats[i].start * 1000) {
      beatIndex = i;
    } else {
      break;
    }
  }
  if (beatIndex !== current_track.beatIndex) {
    //console.log(beats[beatIndex]);
    current_track.beatIndex = beatIndex;
    gsap.killTweensOf(trackAnimation, "beat");
    gsap.to(trackAnimation, { 
      beat: Math.tanh(3*beats[beatIndex].confidence),
      ease: "power4.out",
      duration: SMOOTHING_DELAY, 
    });
    gsap.to(trackAnimation, { 
      delay: SMOOTHING_DELAY,
      beat: 0, 
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
                           - SMOOTHING_DELAY;
    if (current_position >= segments[i].start * 1000) {
      segmentIndex = i;
    } else {
      break;
    }
  }
  if (segmentIndex !== current_track.segmentIndex) {
    console.log(segments[segmentIndex]);
    current_track.segmentIndex = segmentIndex;
    gsap.killTweensOf(trackAnimation.segment);
    gsap.to(trackAnimation, { 
      segment: segments[segmentIndex].confidence,
      ease: "power4.out",
      duration: SMOOTHING_DELAY, 
    });
    gsap.to(trackAnimation, { 
      delay: SMOOTHING_DELAY,
      segment: 0, 
      duration: segments[segmentIndex].duration,
      ease: "power4.out",
    });
  }
}

function updateCurrentTatumSize() {
  const tatums = current_track.analysis.tatums;
  let tatumIndex = current_track.tatumIndex;
  for (let i = tatumIndex + 1; i < tatums.length; i++) {
    const current_position = current_track.position 
                           + (Date.now() - current_track.timestamp)
                           - SMOOTHING_DELAY;
    if (current_position >= tatums[i].start * 1000) {
      tatumIndex = i;
    } else {
      break;
    }
  }
  if (tatumIndex !== current_track.tatumIndex) {
    //console.log(tatums[tatumIndex]);
    current_track.tatumIndex = tatumIndex;
    gsap.to(trackAnimation, { 
      tatum: Math.tanh(3*tatums[tatumIndex].confidence),
      ease: "power4.out",
      duration: SMOOTHING_DELAY, 
    });
    gsap.to(trackAnimation, { 
      delay: SMOOTHING_DELAY,
      tatum: 0, 
      duration: tatums[tatumIndex].duration,
    });
  }
}