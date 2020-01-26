/**
 * The Avatar class describes the appearance of the AI agent, and
 * manages its interaction with the external environment.
 */
class Avatar extends THREE.Group {
  constructor(env) {
    super();
    this.env = env;
    var geom = new THREE.IcosahedronBufferGeometry(0.25, 2);
    var mat = new THREE.MeshLambertMaterial( { color: 'orange' } );
    this.skin = new THREE.Mesh(geom, mat);
    this.add(this.skin);
    
    this.pos = { x: 0.0, y: 0.0, z: 0.0 };
    this.vel = { x: 0.0, y: 0.0, z: 0.0 };
    this.acc = { x: 0.0, y: 0.0, z: 0.0 };
    // this.vel = { x: 1.0, y: 0.0, z: 0.0 };
    // this.acc = { x:-0.1, y: 0.0, z: 0.0 };
  }
  update(dt) {
    var p0 = { x: this.pos.x, y: this.pos.y };
    var v0 = { x: this.vel.x, y: this.vel.y };
    var a0 = { x: this.acc.x, y: this.acc.y };
    var dp = { x: (v0.x + 0.5*a0.x*dt)*dt,
               y: (v0.y + 0.5*a0.y*dt)*dt };
    var dv = { x: a0.x*dt,
               y: a0.y*dt };
    this.pos.x = p0.x + dp.x;
    this.pos.y = p0.y + dp.y;
    this.vel.x = v0.x + dv.x;
    this.vel.y = v0.y + dv.y;
    
    this.translateX(dp.x);
    this.translateY(dp.y);
  }
};

class Agent {
  constructor(env) {
    this.avatar = new Avatar(env);
    this.env = env;
  }
  update(dt) {
    this.avatar.update(dt);
  }
};
