class MotionState {
  /**
   * @param p0 Initial position
   * @param v0 Initial velocity
   */
  constructor(p0, v0) {
    this.p0 = p0 || 0;
    this.v0 = v0 || 0;
  }
  //--------------------------------------------------------------------
  solve(p1) {
    return ( this.v0==0 ? [] : [(p1-this.p0)/this.v0] );
  }
  //--------------------------------------------------------------------
  update(dt) {
    return { p: (0.5*this.a*dt + this.v0)*dt + this.p0,
             v: (this.a*dt + this.v0) };
  }
};

/**
 * The Avatar class describes the appearance of the AI agent, and
 * manages its interaction with the external environment.
 */
class Avatar extends THREE.Group {
  constructor(env) {
    super();
    this.env = env;
    this.rad = 0.25;
    var geom = new THREE.IcosahedronBufferGeometry(this.rad, 2);
    var mat = new THREE.MeshLambertMaterial( { color: 'orange' } );
    this.skin = new THREE.Mesh(geom, mat);
    this.add(this.skin);

    this.xState = new MotionState(0, 0);
    this.yState = new MotinoState(0, 0);
  }
  update(dt) {
    var obj = { dt: dt };
    while (obj.dt > 0) {
      obj = this.env.detectCollision(this.xState, this.yState, obj.dt, this.rad);
      this.translateX(obj.px - this.px);
      this.translateY(obj.py - this.py);
      this.px = obj.px;
      this.vx = obj.vx;
      this.py = obj.py;
      this.vy = obj.vy;
    }
  }
};

class Agent {
  constructor(env) {
    this.env = env;
    this.avatar = new Avatar(env);
  }
  update(dt) {
    this.avatar.update(dt);
  }
};
