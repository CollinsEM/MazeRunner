"use strict";
var group;
var container, stats;
var neuronData = [];
var camera, scene, renderer;
var synapsePos, synapseCol;
var cortex;
var pointCloud;
var neuronPos;
var neuronCol;
var neuronSize;
var proxDendrites;
var maxNeurons = 1000;
var r = 800;
var numLayers = 8;
var gui;
var SHADOW_MAP_WIDTH = 2048;
var SHADOW_MAP_HEIGHT = 1024;

window.addEventListener( 'load', init, false );
window.addEventListener( 'resize', onWindowResize, false );

//--------------------------------------------------------------------
function init() {
	container = document.getElementById( 'container' );

	stats = new Stats();
	container.appendChild( stats.dom );

  var aspect = window.innerWidth / window.innerHeight;
	camera = new THREE.PerspectiveCamera( 45, aspect, 1, 4000 );
  camera.position.set(0, 0, 10);
  camera.up.set(0, 0, 1);
  
	var controls = new THREE.OrbitControls( camera, container );

	scene = new THREE.Scene();

	renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setClearColor( 0x000000 );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
	container.appendChild( renderer.domElement );
  
  // soft white light
  var light = new THREE.AmbientLight( 0x222222 );
  scene.add( light );
  
  // White directional light at half intensity shining from the top.
  var spotLight1 = new THREE.SpotLight( 0xffffff );
  spotLight1.position.set( 150,-100, 100 );
  spotLight1.castShadow = true;
  spotLight1.shadow.mapSize.width = 1024;
  spotLight1.shadow.mapSize.height = 1024;
  spotLight1.shadow.camera.near = 500;
  spotLight1.shadow.camera.far = 4000;
  spotLight1.shadow.camera.fov = 30;
  scene.add( spotLight1 );
  
  var spotLight2 = new THREE.SpotLight( 0xffffff );
  spotLight2.position.set( 100, 150, 100 );
  spotLight2.castShadow = true;
  spotLight2.shadow.mapSize.width = 1024;
  spotLight2.shadow.mapSize.height = 1024;
  spotLight2.shadow.camera.near = 500;
  spotLight2.shadow.camera.far = 4000;
  spotLight2.shadow.camera.fov = 30;
  scene.add( spotLight2 );
  
  var group = initScene();
	scene.add( group );
  
  animate();
}
//--------------------------------------------------------------------
function initScene() {
	group = new THREE.Group();
  var ni = 20, nj = 20;
  var maze = new Maze(ni, nj);
  group.add( maze );
	group.position.set(-ni/2, -nj/2, 0);
  camera.position.set(0, 0, Math.sqrt(ni*ni + nj*nj));
  return group;
}
//--------------------------------------------------------------------
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}
//--------------------------------------------------------------------
function animate() {
  requestAnimationFrame(animate);
	stats.update();
	render();
  return;
}

function render() {
	var time = Date.now() * 0.005;
	// group.rotation.y = time * 0.01;
	renderer.render( scene, camera );
}

