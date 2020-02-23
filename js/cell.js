class Cell extends THREE.BufferGeometry {
  constructor(x, y) {
    super();
    this.center = { x: x, y: y };
    // Flag indicating if a wall is present [ W, S, E, N ]
    this.isWall = [ false, false, false, false ];
    this.walls = [];
    this.doors = [];
    this.buildGeometry();
  }
  buildGeometry() {
    this.walls.forEach( w => w.buildGeometry() );
  }
  detectCollision(p0, v0, R, dtmax) {
    var dt = dtmax;
    var n  = null;
    this.walls.forEach( function(wall) {
      var t = wall.detectCollision(p0, v0, R);
      if (t < dt) {
        dt = t;
        n = wall.normal;
      }
    } );
    this.doors.forEach( function(door) {
      var t1 = door.detectTransition(p0, v0, R);
      if (t1 !== null && t1 < dt) {
        dt = t1;
        n = null;
      }
      var t2 = door.detectCollision(p0, v0, R);
      if (t2 !== null && t2 < dt) {
        dt = t2;
        // var p1 = { x: p0.x + v0.x*t1,
        //            y: p0.y + v0.y*t1 };
        var p  = { x: p0.x + v0.x*t2,
                   y: p0.y + v0.y*t2 };
        var q1 = { x: door.center.x + 0.45*door.normal.y,
                   y: door.center.y + 0.45*door.normal.x };
        var q2 = { x: door.center.x - 0.45*door.normal.y,
                   y: door.center.y - 0.45*door.normal.x };
        var d1 = new THREE.Vector2( p.x - q1.x, p.y - q1.y );
        var d2 = new THREE.Vector2( p.x - q2.x, p.y - q2.y );
        var dd1 = d1.x*d1.x + d1.y*d1.y;
        var dd2 = d2.x*d2.x + d2.y*d2.y;
        n = (dd1 < dd2 ? d1.normalize() : d2.normalize());
      }
    } );
    if (n !== null) {
      var vn = v0.x*n.x + v0.y*n.y;
      return { dt: dt,
               px: p0.x + v0.x*dt,
               py: p0.y + v0.y*dt,
               vx: v0.x - 2*vn*n.x,
               vy: v0.y - 2*vn*n.y };
    }
    else {
      return { dt: dt,
               px: p0.x + v0.x*dt,
               py: p0.y + v0.y*dt,
               vx: v0.x,
               vy: v0.y };
    }
  }
};

