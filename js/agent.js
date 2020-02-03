/**
 * The Avatar class describes the appearance of the AI agent, and
 * manages its interaction with the external environment.
 */
class Avatar extends THREE.Group {
  constructor(env, x0, y0) {
    super();
    this.env = env;
    this.radius = 0.25;
    this.geom = new THREE.IcosahedronBufferGeometry(this.radius, 0);
    this.verts = this.geom.getAttribute("position");
    // console.log("numVerticies:", this.verts.count/3);
    this.mat = new THREE.MeshLambertMaterial( { color: 'orange', wireframe: true } );
    this.skin = new THREE.Mesh(this.geom, this.mat);
    this.add(this.skin);
    this.position.set(x0, y0, 0.5);
    this.velocity = new THREE.Vector3(Math.random(), Math.random(), 0);
    this.len = this.velocity.length();
    this.dir = this.velocity.clone().normalize();
    this.arrow = new THREE.ArrowHelper( this.dir,
                                        new THREE.Vector3(0,0,0),
                                        this.len, 0xffff00 );
    this.add(this.arrow);
  }
  update(dtmax) {
    var dt = dtmax;
    for (var i=0; dt>0 && i<10; ++i) {
      var obj = this.env.detectCollision(this.position,
                                         this.velocity,
                                         dt, this.radius);
      
      dt -= obj.dt;
      this.position.copy(obj.p);
      this.velocity.copy(obj.v);
      this.arrow.setLength(this.velocity.length());
      this.arrow.setDirection(this.velocity.clone().normalize());
    }
  }
};

class Agent {
  constructor(env, x0, y0) {
    this.env = env;
    this.avatar = new Avatar(env, x0, y0);
  }
  update(dt) {
    if (step) {
      this.avatar.update(dt);
      step = cont;
    }
  }
};
