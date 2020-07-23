var scene = new THREE.Scene();
scene.fog = new THREE.FogExp2( 0x000000, 0.001 );
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

window.addEventListener('resize', onWindowResize, false);
function onWindowResize(){
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

camera.position.z = 100;

// var backSphereGeometry = new THREE.IcosahedronGeometry(500, 1);
// var backSphereMaterial = new THREE.MeshLambertMaterial( { 
//   color: 0x173020, 
//   wireframe: true,
//   wireframeLinewidth: 2.5
// });
// var backSphere = new THREE.Mesh( backSphereGeometry, backSphereMaterial );
// scene.add( backSphere );

var sphereGeometry = new THREE.IcosahedronGeometry(30, 2);
var sphereMaterial = new THREE.MeshLambertMaterial( { 
  color: 0x1DB954, 
  wireframe: true,
  wireframeLinewidth: 1.5
});
var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
scene.add( sphere );

var innerSphereGeometry = new THREE.SphereGeometry( 5, 32, 32 );
var innerSphereMaterial = new THREE.MeshBasicMaterial( {color: 0xffff00} );
var innerSphere = new THREE.Mesh( innerSphereGeometry, innerSphereMaterial );
scene.add( innerSphere );

var planeGeometry = new THREE.PlaneGeometry(5000, 5000, 100, 100);
var planeMaterial = new THREE.MeshLambertMaterial({
    color: 0x070a07,
    side: THREE.DoubleSide,
    wireframe: true
});

var plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -0.5 * Math.PI;
plane.position.set(0, -50, 0);
scene.add(plane);

// Lights
var hemisphere = new THREE.HemisphereLight( 0xffffbb, 0x080820, 0.5 );
scene.add( hemisphere );

var light = new THREE.PointLight( 0xaaaaaa, 5, 500, 2 );
light.castShadow = true;
light.position.set( 0, 0, 0 );
scene.add( light );

var light2 = new THREE.PointLight( 0xaaaaaa, 2, 100, 1 );
light2.castShadow = true;
light2.position.set( 20, 80, 30 );
scene.add( light2 );

function animate(now) {
  camera.position.x = sphere.position.x + 100 * Math.cos( 1e-4 * now );         
  camera.position.y = sphere.position.y + 100 * Math.sin( 5e-5 * now );
  //camera.position.z = sphere.position.z + 100 * Math.sin( 1e-4 * now );
  camera.lookAt( sphere.position );

  renderer.render( scene, camera );
  requestAnimationFrame( animate );
}
animate();

