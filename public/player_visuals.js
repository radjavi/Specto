import * as THREE from 'https://unpkg.com/three@0.119.1/build/three.module.js';
import Stats from 'https://unpkg.com/three@0.119.1/examples/jsm/libs/stats.module.js';
// import { OrbitControls } from 'https://unpkg.com/three@0.119.1/examples/jsm/controls/OrbitControls.js';

let simplex = new SimplexNoise()

// Three.js
var scene, camera, renderer, stats;

// Constants
const BALL_RADIUS = 30;
const HEMISPHERE_INTENSITY = 0.03;
const SPOTLIGHT_INTENSITY = 0.75;

// Objects
// Ball
var ballGeometry = new THREE.IcosahedronGeometry(BALL_RADIUS, 3);
var ballMaterial = new THREE.MeshPhongMaterial({
  color: 0xf234dc,
  wireframe: true,
  wireframeLinewidth: 1.5,
});
var ball = new THREE.Mesh(ballGeometry, ballMaterial);

// Floor
var floorGeometry = new THREE.PlaneGeometry(800, 800, 20, 20);
var floorMaterial = new THREE.MeshPhongMaterial({
  color: 0x000000,
  shininess: 5,
});
var floor = new THREE.Mesh(floorGeometry, floorMaterial);

// Floor Wireframe
var floorWireMaterial = new THREE.MeshPhongMaterial({
  color: 0x3d34f2,
  wireframe: true,
  wireframeLinewidth: 2,
});
var floorWire = new THREE.Mesh(floorGeometry, floorWireMaterial);

// Hemisphere light
var hemisphere = new THREE.HemisphereLight(0xffffff, 0x222222, 0);

// Spotlight
var spotLights = [
  createSpotlight(0xf234dc), 
  createSpotlight(0x3d34f2),
]

let beat, segment, energy, tempo;
beat = segment = energy = tempo = 0;

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

  scene.fog = new THREE.FogExp2(0x000000, 0.006);

  // Ball
  ball.castShadow = true;
  scene.add(ball);

  // Floor
  floor.receiveShadow = true;
  floor.rotation.x = -0.5 * Math.PI;
  floor.position.set(0, -70, 0);
  scene.add(floor);

  // Floor Wire
  floorWire.receiveShadow = true;
  floorWire.rotation.x = -0.5 * Math.PI;
  floorWire.position.set(0, -70, 0);
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
    animateToTrack(timeElapsed);
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

function animateToTrack(timeElapsed) {
  updateTrack();
  animateBall(timeElapsed);
  if (current_state) {
    if (current_track.analysis && current_track.features) {
      animateLights();
      setTrackColors();
    }
  }
}

function animateBall(timeElapsed) {
  const ballOffset = 3*beat
                   + 2*segment
                   + energy;
  const simplexSize = 3*beat
                    + 2*segment
                    + 1.5*energy;
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

function animateLights() {
  const intensity = (50*segment*energy + 1) * SPOTLIGHT_INTENSITY;
  spotLights.forEach(l => l.intensity = intensity);
}

function gsapSpotlight(light) {
  gsap.to(light, {
    angle: Math.random() * 2. + 1.,
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

function setTrackColors() {
  const valence = current_track.features.valence;
  const color1 = new THREE.Color(`hsl(
    ${180 + 140*energy * (valence < 0.5 ? 1 : -1)}, 
    ${Math.round(70 + 30*valence)}%, 
    ${Math.round(35 + 15*valence)}%)
  `);
  const color2 = new THREE.Color(`hsl(
    ${180 + (40 + 140*energy) * (valence < 0.5 ? 1 : -1)}, 
    ${Math.round(70 + 30*valence)}%, 
    ${Math.round(35 + 15*valence)}%)
  `);
  //console.log(`Valence: ${valence}, Energy: ${energy}`);
  if (!spotLights[0].color.equals(color1)) {
    gsap.to(spotLights[0].color, { r: color1.r, g: color1.g, b: color1.b, duration: 1 });
  }
  if (!spotLights[1].color.equals(color2)) {
    gsap.to(spotLights[1].color, { r: color2.r, g: color2.g, b: color2.b, duration: 1 });
  }
  if (!floorWireMaterial.color.equals(color1)) {
    gsap.to(floorWireMaterial.color, { r: color1.r, g: color1.g, b: color1.b, duration: 1 });
  }
  if (!ballMaterial.color.equals(color2)) {
    gsap.to(ballMaterial.color, { r: color2.r, g: color2.g, b: color2.b, duration: 1 });
  }
}

function updateTrack() {
  updateEnergy();
  updateTempo();
  updateCurrentBeat();
  updateCurrentSegment();
}

function updateEnergy() {
  if (current_track && current_track.features) {
    energy += (current_track.features.energy - energy) / 7;
  } else {
    energy += (0 - energy) / 20;
  }
}

function updateTempo() {
  if (current_track && current_track.features) {
    tempo = current_track.features.tempo;
  } else {
    tempo = 0;
  }
  //console.log(tempo);
}

function updateCurrentBeat() {
  if (current_track && current_track.interpolation && !current_state.paused) {
    beat += (Math.tanh(8*current_track.interpolation.beat.at(current_track.position + (Date.now() - current_track.timestamp)))
              - beat) / 7;
  } else {
    beat += (0 - beat) / 20;
  }
  // console.log(beat);
}

function updateCurrentSegment() {
  if (current_track && current_track.interpolation && !current_state.paused) {
    segment += (current_track.interpolation.segment.at(current_track.position + (Date.now() - current_track.timestamp))
                - segment) / 12;
  } else {
    segment += (0 - segment) / 20;
  }
  //console.log(segment);
}