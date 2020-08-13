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

let section, bar, beat, segment, tatum;
section = bar = beat = segment = tatum = 0;

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
  updateTrack();
  if (current_state) {
    if (current_track.analysis && current_track.features) {
      playingSpotlights();
      setTrackColors();
    }
    if (current_state.paused) {
      normalizeBall();
      breathingBall(timeElapsed);
    } else {
      if (current_track.analysis && current_track.features) {
        playingBall(timeElapsed);
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

  const ballOffset = 3*beat
                   + 2*segment
                   + current_track.features.energy;
  const simplexSize = 3*beat
                    + 2*segment
                    + 1.5*current_track.features.energy;
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
  const intensity = (50*segment*current_track.features.energy + 1) * SPOTLIGHT_INTENSITY;
  spotLights.forEach(l => l.intensity = intensity);
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
    if (!l.color.equals(color)) {
      gsap.to(l.color, {
        r: color.r,
        g: color.g,
        b: color.b,
        duration: 1,
      })
    };
  });
}

function updateTrack() {
  // updateCurrentSection();
  // updateCurrentBarSize();
  updateCurrentBeatSize();
  updateCurrentSegmentSize();
  // updateCurrentTatumSize();
}

function updateCurrentBeatSize() {
  const lpfConstant = 7;
  if (current_track && current_track.interpolation && !current_state.paused) {
    beat += (Math.tanh(8*current_track.interpolation.beat.at(current_track.position + (Date.now() - current_track.timestamp)))
              - beat) / lpfConstant;
  } else {
    beat += (0 - beat) / lpfConstant;
  }
  // console.log(beat);
}

function updateCurrentSegmentSize() {
  const lpfConstant = 12;
  if (current_track && current_track.interpolation && !current_state.paused) {
    segment += (current_track.interpolation.segment.at(current_track.position + (Date.now() - current_track.timestamp))
                - segment) / lpfConstant;
  } else {
    segment += (0 - segment) / lpfConstant;
  }
  //console.log(segment);
}