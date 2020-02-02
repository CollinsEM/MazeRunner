"use strict"

class Wall {
  /// @param cl cell on the left side of the wall
  /// @param cr cell on the right side of the wall
  constructor(cl, cr) {
    this.cl = cl;
    this.cr = cr;
  }
};

class Cell {
  constructor(x, y) {
    this.pos = { x: x, y: y };
    this.visited = false;
    this.walls = [];
    this.doors = [];
  }
};

//--------------------------------------------------------------------
// Find the smallest positive value in an array of scalar values
//--------------------------------------------------------------------
function smallestPositiveValue(accum, curr) {
  if (curr < 0) return accum;
  if (accum && accum < curr) return accum;
  else return curr;
}

class Maze extends THREE.Object3D {
  constructor(ni, nj) {
    super();
    this.ni = ni;
    this.nj = nj;
    this.cellData = [];
    for (var i=0; i<ni; ++i) {
      this.cellData[i] = [];
      for (var j=0; j<nj; ++j) {
        this.cellData[i][j] = new Cell(2*i+1, 2*j+1);
      }
    }
    this.buildGeometry(ni, nj);
  }
  // Given an object of radius R with its center moving between p0 and
  // p1, determine if the object will collide with any of the walls of
  // the maze. If so, then return the time and place of impact.
  /// @param pos   Current location of object
  /// @param vel   Current velocity of object
  /// @param dtmax Maximum time interval to consider
  /// @param R     Radius of a sphere about the object center for which
  ///              collisions with solid walls should be considered.
  /// @return      An object containing the expected time (t<dtmax) at which
  ///              the object will either leave the current cell
  ///              through an open passage, or collide with a solid
  ///              wall.
  detectCollision(pos, vel, dtmax, R) {
    // Identify which cell is being queried
    var i0 = Math.round(pos.x);
    var j0 = Math.round(pos.y);
    // Temporary placeholders
    var dt = dtmax;
    var vx = vel.x;
    var vy = vel.y;
    // console.log(i0, j0);
    // console.log(pos.x, pos.y);
    // console.log(vel.x, vel.y);
    if (i0 < 0 || i0 >= this.ni) {
      return { dt: -0.1*dtmax, vx:-vel.x, vy: vel.y };
    }
    else if (j0 < 0 || j0 >= this.nj) {
      return { dt: -0.1*dtmax, vx: vel.x, vy:-vel.y };
    }
    if (vel.x < 0) {
      var west = this.cellData[i0][j0].walls[0];
      var x0 = ( west ? (i0-0.45+R) : (i0-0.5) );
      var t0 = (x0 - pos.x) / vel.x;
      // console.log(west ? "W" : "w", t0, dt);
      if (t0 > 0 && t0 < dt) {
        dt = (west ? t0 : 1.01*t0);
        vx = (west ? -1 : 1)*vel.x;
        vy = vel.y;
      }
    }
    if (vel.y < 0) {
      var south = this.cellData[i0][j0].walls[1];
      var y1 = ( south ? (j0-0.45+R) : (j0-0.5) );
      var t1 = (y1 - pos.y) / vel.y;
      // console.log(south ? "S" : "s", t1, dt);
      if (t1 > 0 && t1 < dt) {
        dt = (south ? t1 : 1.01*t1);
        vx = vel.x;
        vy = (south ? -1 : 1)*vel.y;
      }
    }
    if (vel.x > 0) {
      var east = this.cellData[i0][j0].walls[2];
      var x2 = ( east ? (i0+0.45-R) : (i0+0.5) );
      var t2 = (x2 - pos.x) / vel.x;
      // console.log(east ? "E" : "e", t2, dt);
      if (t2 > 0 && t2 < dt) {
        dt = (east ? t2 : 1.01*t2);
        vx = (east ? -1 : 1)*vel.x;
        vy = vel.y;
      }
    }
    if (vel.y > 0) {
      var north = this.cellData[i0][j0].walls[3];
      var y3 = ( north ? (j0+0.45-R) : (j0+0.5) );
      var t3 = (y3 - pos.y) / vel.y;
      // console.log(north ? "N" : "n", t3, dt);
      if (t3 > 0 && t3 < dt) {
        dt = (north ? t3 : 1.01*t3);
        vx = vel.x;
        vy = (north ? -1 : 1)*vel.y;
      }
    }
    for (var i=0; i<2; ++i) {
      for (var j=0; j<2; ++j) {
        var q = { x: i0 - 0.5 + i, y: j0 - 0.5 + j };
        var t = this.intersectCorner(q, pos, vel, R);
        if (t != null && t<dt) {
          console.log(t, dt, dtmax);
          dt = t;
          // Reflect the normal component of velocity
          var p = { x: pos.x + vel.x*dt, y: pos.y + vel.y*dt };
          var n = { x: p.x - q.x, y: p.y - q.y };
          var den = Math.sqrt(n.x*n.x + n.y*n.y);
          n.x /= den; // normalize
          n.y /= den;
          var vn = vel.x*n.x + vel.y*n.y;
          console.log("vx:", vel.x, " => ", vel.x - 2*vn*n.x);
          console.log("vy:", vel.y, " => ", vel.y - 2*vn*n.y);
          vx = vel.x - 2*vn*n.x;
          vy = vel.y - 2*vn*n.y;
        }
      }
    }
    return { dt: dt, vx: vx, vy: vy };
  }
  /** Find the time to intersect the nearest corner
   *  @param q  corner location
   *  @param p0 current location of object center
   *  @param v0 current velocity of object
   *  @param R  radius of object
   *
   *  Let p1 = p0 + v0*t
   *
   *  Compute the distance squared between q and p1
   *
   *    dd = (p1.x-q.x)^2 + (p1.y-q.y)^2
   *       = (p0.x + v0.x*t - q.x)^2 + (p0.y + v0.y*t - q.y)^2
   *       = (p0.x - q.x + v0.x*t)^2 + (p0.y - q.y + v0.y*t)^2
   *       = (dx0 + vx*t)*(dx0 + vx*t) + (dy0 + vy*t)*(dy0 + vy*t)
   *       = (dx0*dx0 + 2*dx0*vx*t + vx*vx*t*t) + (dy0*dy0 + 2*dy0*vy*t + vy*vy*t*t)
   *
   *    dx0 = p0.x - q.x,   vx = v0.x
   *    dy0 = p0.y - q.y,   vy = v0.y
   *
   *  When dd = R*R, the outer surface of the object in in contact
   *  with q. Rearranging the terms in this expression, we get:
   *
   *    (vx*vx + vy*vy)*t*t + 2*(dx0*vx + dy0*vy)*t + (dx0*dx0 + dy0*dy0 - R*R) = 0
   *
   *  This is a quadratic equation in t:
   *
   *    A*t^2 + B*t + C = 0
   *
   *    A = (vx*vx + vy*vy)
   *    B = 2*(dx0*vx + dy0*vy)
   *    C = (dx0*dx0 + dy0*dy0 - R*R)
   *
   *  with a solution of:
   *
   *    t = (-B +/- sqrt(B*B - 4*A*C))/(2*A)
   *
   *  Features of note:
   *    * By construction, A >= 0
   *    * When A == 0, the velocity is zero and the solution is undefined
   *    * When C > 0, the distance from p0 to q is greater than R
   *    * When C <= 0, q is already within the object's outer surface
   *    * If B*B - 4*A*C < 0 then there are no valid intersections
   */
  intersectCorner(q, p0, v0, R) {
    var dx0 = p0.x - q.x;
    var dy0 = p0.y - q.y;
    var dd0 = dx0*dx0 + dy0*dy0;
    // If d0 < R, or equivalently d0*d0 < R*R, then we are already too
    // close to a corner.  Compute the time when the intersection
    // occured, and back the object up.
    // if (dd0 < R*R) {
    //   console.log("Object is already too close to a corner:", Math.sqrt(dd0), "<", R);
    //   console.log("p: ", p0, ", q:", q);
    // }
    // Solving A*t^2 + B*t + C = 0
    var A = v0.x*v0.x + v0.y*v0.y;  // A >= 0
    // If A = 0, then the object is not moving.
    if (A == 0) return null;
    var B = 2*(dx0*v0.x + dy0*v0.y);
    var C = dd0 - R*R;  // Distance from skin to corner
    var D = B*B - 4*A*C;// D > 0 when object travels within R of corner
    // console.log(A, B, C, D);
    if (D < 0) return null;
    var sqrtD = Math.sqrt(D);
    var t1 = (-B + sqrtD)/(2*A);
    var t2 = (-B - sqrtD)/(2*A);
    // If both times are negative, then the object is already past the corner
    if (t1<0 && t2<0) {
      return null;
    }
    // Otherwise, return the time of earliest contact
    else if (C<0) {
      console.log("C<0:", C, "t1:", t1, "t2:", t2);
      return (t1 < 0 ? t1 : t2);
    }
    else {
      return Math.min(t1, t2);
    }
    
  }
  buildGeometry(ni, nj) {
    //------------------------------------------------------------
    // Build outer boundary walls
    //------------------------------------------------------------
    this.geometry = new THREE.Geometry();
    this.geometry.vertices.push( new THREE.Vector3(  -0.50,   -0.50, 0) );
    this.geometry.vertices.push( new THREE.Vector3(ni-0.50,   -0.50, 0) );
    this.geometry.vertices.push( new THREE.Vector3(  -0.50, nj-0.50, 0) );
    this.geometry.vertices.push( new THREE.Vector3(ni-0.50, nj-0.50, 0) );
    this.geometry.vertices.push( new THREE.Vector3(  -0.50,   -0.50, 1) );
    this.geometry.vertices.push( new THREE.Vector3(ni-0.50,   -0.50, 1) );
    this.geometry.vertices.push( new THREE.Vector3(  -0.50, nj-0.50, 1) );
    this.geometry.vertices.push( new THREE.Vector3(ni-0.50, nj-0.50, 1) );
    this.geometry.vertices.push( new THREE.Vector3(  -0.50,    0.45, 0) );
    this.geometry.vertices.push( new THREE.Vector3(  -0.50,    0.45, 1) );
    // this.geometry.faces.push( new THREE.Face3( 0, 1, 3 ) );
    // this.geometry.faces.push( new THREE.Face3( 0, 3, 2 ) );
    this.geometry.faces.push( new THREE.Face3( 0, 1, 5 ) );
    this.geometry.faces.push( new THREE.Face3( 0, 5, 4 ) );
    this.geometry.faces.push( new THREE.Face3( 1, 7, 5 ) );
    this.geometry.faces.push( new THREE.Face3( 1, 3, 7 ) );
    this.geometry.faces.push( new THREE.Face3( 2, 6, 7 ) );
    this.geometry.faces.push( new THREE.Face3( 2, 7, 3 ) );
    this.geometry.faces.push( new THREE.Face3( 8, 9, 6 ) );
    this.geometry.faces.push( new THREE.Face3( 8, 6, 2 ) );
    //------------------------------------------------------------
    // Generate maze structure while building interior walls
    //------------------------------------------------------------
    var root = { i: 0, j: 0 };
    var start = { i: -1, j: 0};
    this.recurseDescend(root, start);
    this.geometry.vertices.forEach( function(v) {
      v.x = Math.min(Math.max(v.x, -0.5), ni-0.5);
      v.y = Math.min(Math.max(v.y, -0.5), nj-0.5);
    } );
    this.geometry.computeFaceNormals();
    var material = new THREE.MeshLambertMaterial( { color: 0x9999ff,
                                                    side: THREE.DoubleSide } );
    var mesh = new THREE.Mesh( this.geometry, material );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.add( mesh );
  }
  recurseDescend(curr, prev) {
    // console.log("Visiting node:", curr.i, curr.j);
    this.cellData[curr.i][curr.j].visited = true;
    var next = [ { i: curr.i-1, j: curr.j,   dir: 0 },   // WEST
                 { i: curr.i,   j: curr.j-1, dir: 1 },   // SOUTH
                 { i: curr.i+1, j: curr.j,   dir: 2 },   // EAST
                 { i: curr.i,   j: curr.j+1, dir: 3 } ]; // NORTH
    while (next.length > 0) {
      var idx = Math.floor(next.length*Math.random());
      if (next[idx].i == prev.i && next[idx].j == prev.j) {
        // The cell indicated by next[idx] is in the direction that we
        // just came from. So, we do not place a wall here.
        // console.log("Setting wall", next[idx].dir, " to false.");
        this.cellData[curr.i][curr.j].walls[next[idx].dir] = false;
        // console.log("Not building wall between(", curr.i, curr.j,
        //             ") and (", next[idx].i, next[idx].j, ").");
      }
      else if (next[idx].i<0 || next[idx].i>this.ni-1 ||
               next[idx].j<0 || next[idx].j>this.nj-1 ||
               this.cellData[next[idx].i][next[idx].j].visited ) {
        // The cell indicated by next[idx] has already been visited or
        // will take us outside of the bounds of the maze. So we need
        // to build a wall here. As an alternative, if the formation
        // of loops or rooms within the maze is allowable, then one
        // could presumably allow the presence of an open passageway
        // here with some small probability. In general, we prefer to
        // have few loops if any.
        // console.log("Setting wall", next[idx].dir, " to true.");
        this.cellData[curr.i][curr.j].walls[next[idx].dir] = true;
        // Create a wall between curr and next.
        // console.log("Building wall between (", curr.i, curr.j,
        //             ") and (", next[idx].i, next[idx].j, ").");
        var di = next[idx].i - curr.i;
        var dj = next[idx].j - curr.j;
        var p0 = this.geometry.vertices.length;
        if (di > 0) {
          this.geometry.vertices.push(new THREE.Vector3(curr.i+0.45, curr.j-0.55, 0));
          this.geometry.vertices.push(new THREE.Vector3(curr.i+0.45, curr.j-0.55, 1));
          this.geometry.vertices.push(new THREE.Vector3(curr.i+0.45, curr.j+0.55, 0));
          this.geometry.vertices.push(new THREE.Vector3(curr.i+0.45, curr.j+0.55, 1));
          this.geometry.vertices.push(new THREE.Vector3(curr.i+0.50, curr.j-0.55, 0));
          this.geometry.vertices.push(new THREE.Vector3(curr.i+0.50, curr.j-0.55, 1));
          this.geometry.vertices.push(new THREE.Vector3(curr.i+0.50, curr.j+0.55, 0));
          this.geometry.vertices.push(new THREE.Vector3(curr.i+0.50, curr.j+0.55, 1));
        }
        else if (di < 0) {
          this.geometry.vertices.push(new THREE.Vector3(curr.i-0.45, curr.j-0.55, 0));
          this.geometry.vertices.push(new THREE.Vector3(curr.i-0.45, curr.j-0.55, 1));
          this.geometry.vertices.push(new THREE.Vector3(curr.i-0.45, curr.j+0.55, 0));
          this.geometry.vertices.push(new THREE.Vector3(curr.i-0.45, curr.j+0.55, 1));
          this.geometry.vertices.push(new THREE.Vector3(curr.i-0.50, curr.j-0.55, 0));
          this.geometry.vertices.push(new THREE.Vector3(curr.i-0.50, curr.j-0.55, 1));
          this.geometry.vertices.push(new THREE.Vector3(curr.i-0.50, curr.j+0.55, 0));
          this.geometry.vertices.push(new THREE.Vector3(curr.i-0.50, curr.j+0.55, 1));
        }
        else if (dj > 0) {
          this.geometry.vertices.push(new THREE.Vector3(curr.i-0.55, curr.j+0.45, 0));
          this.geometry.vertices.push(new THREE.Vector3(curr.i-0.55, curr.j+0.45, 1));
          this.geometry.vertices.push(new THREE.Vector3(curr.i+0.55, curr.j+0.45, 0));
          this.geometry.vertices.push(new THREE.Vector3(curr.i+0.55, curr.j+0.45, 1));
          this.geometry.vertices.push(new THREE.Vector3(curr.i-0.55, curr.j+0.50, 0));
          this.geometry.vertices.push(new THREE.Vector3(curr.i-0.55, curr.j+0.50, 1));
          this.geometry.vertices.push(new THREE.Vector3(curr.i+0.55, curr.j+0.50, 0));
          this.geometry.vertices.push(new THREE.Vector3(curr.i+0.55, curr.j+0.50, 1));
        }
        else if (dj < 0) {
          this.geometry.vertices.push(new THREE.Vector3(curr.i-0.55, curr.j-0.45, 0));
          this.geometry.vertices.push(new THREE.Vector3(curr.i-0.55, curr.j-0.45, 1));
          this.geometry.vertices.push(new THREE.Vector3(curr.i+0.55, curr.j-0.45, 0));
          this.geometry.vertices.push(new THREE.Vector3(curr.i+0.55, curr.j-0.45, 1));
          this.geometry.vertices.push(new THREE.Vector3(curr.i-0.55, curr.j-0.50, 0));
          this.geometry.vertices.push(new THREE.Vector3(curr.i-0.55, curr.j-0.50, 1));
          this.geometry.vertices.push(new THREE.Vector3(curr.i+0.55, curr.j-0.50, 0));
          this.geometry.vertices.push(new THREE.Vector3(curr.i+0.55, curr.j-0.50, 1));
        }
        this.geometry.faces.push(new THREE.Face3(p0  , p0+1, p0+3));
        this.geometry.faces.push(new THREE.Face3(p0  , p0+3, p0+2));
        this.geometry.faces.push(new THREE.Face3(p0  , p0+4, p0+5));
        this.geometry.faces.push(new THREE.Face3(p0  , p0+5, p0+1));
        this.geometry.faces.push(new THREE.Face3(p0+1, p0+5, p0+7));
        this.geometry.faces.push(new THREE.Face3(p0+1, p0+7, p0+3));
        this.geometry.faces.push(new THREE.Face3(p0+3, p0+7, p0+6));
        this.geometry.faces.push(new THREE.Face3(p0+3, p0+6, p0+2));
      }
      else {
        // Proceed to the next unvisited cell indicated by next[idx]
        // console.log("Setting wall", next[idx].dir, " to false.");
        this.cellData[curr.i][curr.j].walls[next[idx].dir] = false;
        this.recurseDescend(next[idx], curr);
        // console.log("Returned to node:", curr.i, curr.j);
      }
      // Remove next[idx] from the list
      next.splice(idx, 1);
    }
  }
};

