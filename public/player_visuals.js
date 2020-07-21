var scene = new THREE.Scene();
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

var sphereGeometry = new THREE.IcosahedronGeometry(40, 2);
var sphereMaterial = new THREE.MeshLambertMaterial( { 
  color: 0x1DB954, 
  wireframe: true 
});
var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
scene.add( sphere );

// Lights
var hemisphere = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );
scene.add( hemisphere );

function animate() {
  requestAnimationFrame( animate );

  sphere.rotation.x += 0.0005;
  sphere.rotation.y += 0.0005;
  sphere.position.z -= 0.1;
  camera.position.z -= 0.1;

  renderer.render( scene, camera );
}
animate();

