var scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.001);
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

camera.position.z = 100;

const ballRadius = 30;
var ballGeometry = new THREE.IcosahedronGeometry(ballRadius, 2);
var ballMaterial = new THREE.MeshLambertMaterial({
  color: 0x1DB954,
  wireframe: true,
  wireframeLinewidth: 1.5
});
var ball = new THREE.Mesh(ballGeometry, ballMaterial);
scene.add(ball);

var innerBallGeometry = new THREE.SphereGeometry(5, 32, 32);
var innerBallMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
var innerBall = new THREE.Mesh(innerBallGeometry, innerBallMaterial);
scene.add(innerBall);

var planeGeometry = new THREE.PlaneGeometry(5000, 5000, 200, 200);
var planeMaterial = new THREE.MeshLambertMaterial({
  color: 0x070a07,
  wireframe: true
});

var plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -0.5 * Math.PI;
plane.position.set(0, -50, 0);
scene.add(plane);

// Lights
const hemisphereIntensity = 0.4;
var hemisphere = new THREE.HemisphereLight(0xffffbb, 0x080820, 0);
scene.add(hemisphere);

const lightIntensity = 5;
var light = new THREE.PointLight(0xaaaaaa, 0, 500, 2);
light.castShadow = true;
light.position.set(0, 0, 0);
scene.add(light);

const light2Intensity = 2;
var light2 = new THREE.PointLight(0xaaaaaa, 0, 100, 1);
light2.castShadow = true;
light2.position.set(20, 80, 30);
scene.add(light2);

function animate(timeElapsed) {
  lightsFadeIn();
  moveCamera(timeElapsed);
  breathingBall(timeElapsed);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

function lightsFadeIn() {
  if (hemisphere.intensity < hemisphereIntensity) { hemisphere.intensity += 5e-4; }
  if (light.intensity < lightIntensity) { light.intensity += 5e-3 }
  if (light2.intensity < light2Intensity) { light2.intensity += 5e-3 }
}

function moveCamera(timeElapsed) {
  camera.position.x = ball.position.x + 100 * Math.cos(5e-5 * timeElapsed);
  camera.position.y = ball.position.y + 100 * Math.sin(5e-5 * timeElapsed);
  //camera.position.z = Ball.position.z + 100 * Math.sin( 1e-4 * timeElapsed );
  camera.lookAt(ball.position);
}

function breathingBall(timeElapsed) {
  const scale = 0.05*(Math.sin(1e-3 * timeElapsed) + 1) + (1-0.05) || 1;
  ball.scale.x = scale;
  ball.scale.y = scale;
  ball.scale.z = scale;
}