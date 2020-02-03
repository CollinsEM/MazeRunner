"use strict";
var group;
var stats;
var neuronData = [];
var env, gcm;
var maze, agent;
var clock = new THREE.Clock();

// var synapsePos, synapseCol;
// var cortex;
// var pointCloud;
// var neuronPos;
// var neuronCol;
// var neuronSize;
// var proxDendrites;
// var maxNeurons = 1000;
// var r = 800;
// var numLayers = 8;
// var gui;
var SHADOW_MAP_WIDTH = 2048;
var SHADOW_MAP_HEIGHT = 1024;

window.addEventListener( 'load', init, false );
window.addEventListener( 'resize', onWindowResize, false );
window.addEventListener( 'keypress', onWindowKeypress, false );
//--------------------------------------------------------------------
function init() {
  var container = document.getElementById( 'container' );
	stats = new Stats();
	container.appendChild( stats.dom );
  env = new Environment();
  animate();
}
//--------------------------------------------------------------------
function onWindowResize() {
	env.camera.aspect = window.innerWidth / window.innerHeight;
	env.camera.updateProjectionMatrix();
	env.renderer.setSize( window.innerWidth, window.innerHeight );
}
//--------------------------------------------------------------------
var cont = true;
var step = true;
function onWindowKeypress(ev) {
  // console.log(ev);
  switch (ev.key) {
  case 'q':
    cont = !cont;
    break;
  }
  step = true;
}
//--------------------------------------------------------------------
function animate() {
  requestAnimationFrame(animate);
	stats.update();
  env.update(clock.getDelta());
}
