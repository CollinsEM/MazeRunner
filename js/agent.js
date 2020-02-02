/**
 * The Avatar class describes the appearance of the AI agent, and
 * manages its interaction with the external environment.
 */
class Avatar extends THREE.Group {
  constructor(env, x0, y0) {
    super();
    this.env = env;
    this.radius = 0.25;
    var geom = new THREE.IcosahedronBufferGeometry(this.radius, 2);
    var mat = new THREE.MeshLambertMaterial( { color: 'orange' } );
    this.skin = new THREE.Mesh(geom, mat);
    this.add(this.skin);
    this.position.set(x0, y0, 0.5);
    this.velocity = new THREE.Vector3(Math.random(), Math.random(), 0);
  }
  update(dtmax) {
    var dt = dtmax;
    for (var i=0; dt>0 && i<10; ++i) {
      var obj = this.env.detectCollision(this.position,
                                         this.velocity,
                                         dt, this.radius);
      i
      dt -= obj.dt;
      this.translateX(this.velocity.x*obj.dt);
      this.translateY(this.velocity.y*obj.dt);
      this.velocity.set(obj.vx, obj.vy, 0);
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
      step = true;
    }
  }
};
