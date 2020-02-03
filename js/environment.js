/**
 * 
 */
class Environment {
  constructor() {
    this.container = document.getElementById( 'container' );

    this.aspect = window.innerWidth / window.innerHeight;
    
	  this.camera = new THREE.PerspectiveCamera( 45, this.aspect, 1, 4000 );
    this.camera.position.set(0, 0, 10);
    this.camera.up.set(0, 0, 1);
    
	  this.controls = new THREE.OrbitControls( this.camera, this.container );

	  this.scene = new THREE.Scene();

	  this.renderer = new THREE.WebGLRenderer( { antialias: true } );
    this.renderer.setClearColor( 0x000000 );
	  this.renderer.setPixelRatio( window.devicePixelRatio );
	  this.renderer.setSize( window.innerWidth, window.innerHeight );
	  // this.renderer.gammaInput = true;
	  // this.renderer.gammaOutput = true;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
	  this.container.appendChild( this.renderer.domElement );
    
    // soft white light
    var light = new THREE.AmbientLight( 0x222222 );
    this.scene.add( light );
    
    // White directional light at half intensity shining from the top.
    var spotLight1 = new THREE.SpotLight( 0xffffff );
    spotLight1.position.set( 150, -100, 100 );
    spotLight1.castShadow = true;
    spotLight1.shadow.mapSize.width = 1024;
    spotLight1.shadow.mapSize.height = 1024;
    spotLight1.shadow.camera.near = 500;
    spotLight1.shadow.camera.far = 4000;
    spotLight1.shadow.camera.fov = 30;
    this.scene.add( spotLight1 );
    
    var spotLight2 = new THREE.SpotLight( 0xffffff );
    spotLight2.position.set( 100, 150, 100 );
    spotLight2.castShadow = true;
    spotLight2.shadow.mapSize.width = 1024;
    spotLight2.shadow.mapSize.height = 1024;
    spotLight2.shadow.camera.near = 500;
    spotLight2.shadow.camera.far = 4000;
    spotLight2.shadow.camera.fov = 30;
    this.scene.add( spotLight2 );
    
	  this.group = new THREE.Group();
    var ni = 10, nj = 10;
  
    this.maze = new Maze(ni, nj);
    this.group.add( this.maze );

    // Initialize Agent at this position
    var x0 = Math.floor(ni*Math.random());
    var y0 = Math.floor(nj*Math.random());
    this.agent = new Agent( this.maze, x0, y0 );
    this.group.add( this.agent.avatar );
    
	  this.group.position.set(-ni/2, -nj/2, 0);
    this.camera.position.set(0, 0, Math.sqrt(ni*ni + nj*nj));
    
	  this.scene.add( this.group );
  }
  update(dt) {
    this.agent.update(dt);
	  this.render();
  }
  render() {
    this.renderer.render( this.scene, this.camera );
  }
};
