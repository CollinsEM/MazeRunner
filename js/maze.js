"use strict"

var xAxis = new THREE.Vector3(1, 0, 0);
var yAxis = new THREE.Vector3(0, 1, 0);
var zAxis = new THREE.Vector3(0, 0, 1);
var N = new THREE.Vector3( 0, 1, 0);
var S = new THREE.Vector3( 0,-1, 0);
var E = new THREE.Vector3( 1, 0, 0);
var W = new THREE.Vector3(-1, 0, 0);
var eps = 1.0e-6;

class Door {
  /**
   *  @brief Implements semantics for a door between two adjacent cells.
   *
   *  @param cl     cell on the left side of the wall
   *  @param cr     cell on the right side of the wall
   *
   *  The constructor arguments are ordered such that the cell on the
   *  left will be one-step closer to the exit. In other words, a
   *  transition from cr to cl will move the agent towards the exit.
   *  
   *  center specifies the center of the doorway.
   *
   *  normal provides the orientation of the door, but also specifies
   *  the direction of travel towards the exit.
   */
  constructor(cl, cr) {
    this.cl = cl;
    this.cr = cr;
    this.center = { x: 0.5*(cl.center.x + cr.center.x),
                    y: 0.5*(cl.center.y + cr.center.y) };
    this.normal = { x: cl.center.x - cr.center.x,
                    y: cl.center.y - cr.center.y };
  }
  // Compute the time of transition through the door of the center of
  // a sphere with center p0, traveling with velocity v0. Returns null
  // if no transitions are detected.
  detectTransition(p0, v0) {
    if (this.normal.x) {
      return ( Math.abs(v0.x) < eps ? null : (this.center.x - p0.x)/v0.x );
    }
    else {
      return ( Math.abs(v0.y) < eps ? null : (this.center.y - p0.y)/v0.y );
    }
  }
  // Compute the time of impact between the sides of the doorway and a
  // sphere of radius R, center p0, traveling with velocity v0.
  // Returns null if no intersections detected.
  detectCollision(p0, v0, R) {
    var q1 = { x: this.center.x + 0.45*this.normal.y,
               y: this.center.y + 0.45*this.normal.x };
    var q2 = { x: this.center.x - 0.45*this.normal.y,
               y: this.center.y - 0.45*this.normal.x };
    var t1 = this.intersect(q1, p0, v0, R);
    var t2 = this.intersect(q2, p0, v0, R);
    return ( t1 != null ?
             ( t2 != null ?
               ( (q1.x - q2.x)*v0.x + (q1.y - q2.y)*v0.y ? t1 : t2 ) :
               t1 ) :
             ( t2 != null ? t2 : null ) ) ;
  }
  /**
   *  Find the earliest time when the moving point p(t) = p0 + v0*t is
   *  exactly R away from the fixed point q. Return null if no such
   *  solutions exist.
   *
   *  @param q  target location
   *  @param p0 initial location of sphere center
   *  @param v0 initial velocity of sphere
   *  @param R  radius of sphere
   *
   *  Let p1(t) = p0 + v0*t
   *
   *  Compute the distance squared between q and p1
   *
   *    dd  = (p1.x-q.x)^2 + (p1.y-q.y)^2
   *        = (p0.x + vx*t - q.x)^2 + (p0.y + vy*t - q.y)^2
   *        = (p0.x - q.x + vx*t)^2 + (p0.y - q.y + vy*t)^2
   *        = (dx0 + vx*t)*(dx0 + vx*t) + (dy0 + vy*t)*(dy0 + vy*t)
   *        = (dx0*dx0 + 2*dx0*vx*t + vx*vx*t*t) + (dy0*dy0 + 2*dy0*vy*t + vy*vy*t*t)
   *
   *    dx0 = p0.x - q.x,   vx = v0.x
   *    dy0 = p0.y - q.y,   vy = v0.y
   *
   *  When dd = R*R, the outer surface of the sphere is in contact
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
   *    By construction, A >= 0
   *    When A == 0, the velocity is zero and the solution is undefined
   *    When C > 0, the distance from p0 to q is greater than R
   *    When C <= 0, q is already within the object's outer surface
   *    If B*B - 4*A*C < 0 then there are no valid intersections
   */
  intersect(q, p0, v0, R) {
    var dp0 = { x: p0.x - q.x, y: p0.y - q.y };
    var dd0 = ( dp0.x*dp0.x + dp0.y*dp0.y );
    // If d0 < R, or equivalently d0*d0 < R*R, then p0 is already
    // within R distance of q. Therefore, there will likely be one
    // negative and one positive value for t.  Return the earliest
    // time when |p-q|=R.
    //
    // Solving A*t^2 + B*t + C = 0
    var A = v0.x*v0.x + v0.y*v0.y;  // A >= 0
    // If A = 0, then the object is not moving.
    if (A < eps) return null;
    var B = 2*(dp0.x*v0.x + dp0.y*v0.y);
    // C: Distance from skin to corner
    var C = dd0 - R*R;
    var D = B*B - 4*A*C;// D > 0 when object travels within R of corner
    // console.log(A, B, C, D);
    if (D < 0) return null;
    var sqrtD = Math.sqrt(D);
    var t1 = (-B + sqrtD)/(2*A);
    var t2 = (-B - sqrtD)/(2*A);
    var p1 = { x: p0.x + v0.x*t1, y: p0.y + v0.y*t1 };
    var p2 = { x: p0.x + v0.x*t2, y: p0.y + v0.y*t2 };
    // var dd1 = ( dp1.x*dp1.x + dp1.y*dp1.y );
    // var dd2 = ( dp2.x*dp2.x + dp2.y*dp2.y );
    var dp1 = { x: p1.x - p0.x, y: p1.y - p0.y };
    var dp2 = { x: p2.x - p0.x, y: p2.y - p0.y };
    // If both times are negative, then the object is already past the corner
    if (t1<0 && t2<0) {
      return null;
    }
    // If C<0, then object is already in contact with the corner
    else if (C<0) {
      // console.log("C<0:", C, "t1:", t1, "t2:", t2);
      return (t1 < 0 ? t1 : t2);
    }
    // Otherwise, return the time of earliest contact
    else {
      return Math.min(t1, t2);
    }
  }
};

class Wall extends THREE.BufferGeometry {
  /**
   * @brief Implements semantics for a solid wall between adjacent
   * cells
   *
   *  @param cl cell on the left side of the wall
   *  @param cr cell on the right side of the wall
   *
   *  The constructor arguments are ordered such that the cell on the
   *  left is the interior of the cell.
   *
   *  center specifies the center of the wall.
   *
   *  normal provides the orientation of the wall and is directed
   *  inwards towards the center of the cell.
   */
  constructor(cl, cr) {
    super();
    this.cl = cl;
    this.cr = cr;
    this.center = { x: 0.45*cl.center.x + 0.65*cr.center.x,
                    y: 0.45*cl.center.y + 0.65*cr.center.y };
    this.normal = { x: cl.center.x - cr.center.x,
                    y: cl.center.y - cr.center.y };
  }
  buildGeometry() {
  }
  // Compute the time of impact between this wall and a sphere of
  // radius R, center p0, traveling with velocity v0.
  detectCollision(p0, v0, R) {
    if (this.normal.x) {
      return ( v0.x ? (this.center.x + R*this.normal.x - p0.x)/v0.x : null );
    }
    else {
      return ( v0.y ? (this.center.y + R*this.normal.y - p0.y)/v0.y : null );
    }
  }
};

class Cell extends THREE.BufferGeometry {
  constructor(x, y) {
    super();
    this.center = { x: x, y: y };
    this.walls = [];
    this.doors = [];
  }
  buildGeometry() {
    
  }
  detectCollision(dtmax) {
    var dt = dtmax;
    this.walls.forEach( function(wall) {
      var ret = wall.detectCollision();
    } );
    this.doors.forEach( function(door) {
      var ret = door.detectCollision();
    } );
    this
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

var arrow = [], timeout = [];
var it = 0;
class Maze extends THREE.Object3D {
  constructor(ni, nj) {
    super();
    // Array of arrow helpers denoting instantaneous accelerations
    for (var i=0; i<10; ++i) {
      arrow[i] = new THREE.ArrowHelper( new THREE.Vector3(1,0,0),
                                        new THREE.Vector3(0,0,0),
                                        0, 0xff0000 );
      this.add(arrow[i]);
      arrow[i].visible = false;
    }
    // Build Maze
    this.ni = ni;
    this.nj = nj;
    this.cellData = [];
    for (var i=0; i<ni; ++i) {
      this.cellData[i] = [];
      for (var j=0; j<nj; ++j) {
        this.cellData[i][j] = new Cell(i, j);;
      }
    }
    this.cellData[-1] = [ new Cell(-1, 0) ];
    this.buildGeometry(ni, nj);
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
  //
  // Compute the distance to each solid wall. Apply a Coulomb-like
  // potential force to repel the object away from maze walls.
  detectCollision(pos, vel, dtmax, R) {
    // Identify which cell is being queried
    var i0 = Math.round(pos.x);
    var j0 = Math.round(pos.y);
    // Temporary placeholders
    var dt = dtmax;
    var n  = zAxis;
    var v  = vel.clone();
    var p  = pos.clone();
    // console.log(i0, j0);
    // console.log(pos.x, pos.y);
    // console.log(vel.x, vel.y);
    if (i0 < 0 && j <= 0 ) {
      // Exit reached, halt the simulation.
      cont = false;
      dt = -0.1*dtmax;
      n = xAxis;
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
        v.x = (west ? -1 : 1)*vel.x;
        v.y = vel.y;
        p.x = ( west ? i0-0.45 : i0-0.5 );
        p.y = pos.y + vel.y*dt;
      }
    }
    if (vel.y < 0) {
      var south = this.cellData[i0][j0].walls[1];
      var y1 = ( south ? (j0-0.45+R) : (j0-0.5) );
      var t1 = (y1 - pos.y) / vel.y;
      // console.log(south ? "S" : "s", t1, dt);
      if (t1 > 0 && t1 < dt) {
        dt = (south ? t1 : 1.01*t1);
        v.x = vel.x;
        v.y = (south ? -1 : 1)*vel.y;
        p.x = pos.x + vel.x*dt;
        p.y = ( south ? j0-0.45 : j0-0.5 );
      }
    }
    if (vel.x > 0) {
      var east = this.cellData[i0][j0].walls[2];
      var x2 = ( east ? (i0+0.45-R) : (i0+0.5) );
      var t2 = (x2 - pos.x) / vel.x;
      // console.log(east ? "E" : "e", t2, dt);
      if (t2 > 0 && t2 < dt) {
        dt = (east ? t2 : 1.01*t2);
        v.x = (east ? -1 : 1)*vel.x;
        v.y = vel.y;
        p.x = ( east ? i0+0.45 : i0+0.5 );
        p.y = pos.y + vel.y*dt;
      }
    }
    if (vel.y > 0) {
      var north = this.cellData[i0][j0].walls[3];
      var y3 = ( north ? (j0+0.45-R) : (j0+0.5) );
      var t3 = (y3 - pos.y) / vel.y;
      // console.log(north ? "N" : "n", t3, dt);
      if (t3 > 0 && t3 < dt) {
        dt = (north ? t3 : 1.01*t3);
        v.x = vel.x;
        v.y = (north ? -1 : 1)*vel.y;
        p.x = pos.x + vel.x*dt;
        p.y = ( north ? j0+0.45 : j0+0.5 );
      }
    }
    var q;
    for (var w=0; w<4; ++w) {
      if ( this.cellData[i0][j0].walls[w] ) {
        if ( this.cellData[i0][j0].walls[(w+1)%4] ) {
          // Walls on both sides of corner
          var Q1 = [ { x: i0 - 0.45, y: j0 - 0.45 },
                     { x: i0 + 0.45, y: j0 - 0.45 },
                     { x: i0 + 0.45, y: j0 + 0.45 },
                     { x: i0 - 0.45, y: j0 + 0.45 } ];
          // There should be no way for the agent to contact this
          // corner without first coming into contact with the walls
          // on either side.
          q = Q1[w];
        }
        else {
          // Wall to the right of corner, no wall on left
          var Q2 = [ { x: i0 - 0.45, y: j0 - 0.55 },
                     { x: i0 + 0.55, y: j0 - 0.45 },
                     { x: i0 + 0.45, y: j0 + 0.55 },
                     { x: i0 - 0.55, y: j0 + 0.45 } ];
          q = Q2[w];
        }
      }
      else {
        if ( this.cellData[i0][j0].walls[(w+1)%4] ) {
          // Wall to the left of corner, no wall on right
          var Q3 = [ { x: i0 - 0.55, y: j0 - 0.45 },
                     { x: i0 + 0.45, y: j0 - 0.55 },
                     { x: i0 + 0.55, y: j0 + 0.45 },
                     { x: i0 - 0.45, y: j0 + 0.55 } ];
          q = Q3[w];
        }
        else {
          // No wall to either side of the corner
          var Q4 = [ { x: i0 - 0.45, y: j0 - 0.45 },
                     { x: i0 + 0.45, y: j0 - 0.45 },
                     { x: i0 + 0.45, y: j0 + 0.45 },
                     { x: i0 - 0.45, y: j0 + 0.45 } ];
          q = Q4[w];
        }
      }
      var t = this.intersectCorner(q, pos, vel, R);
      if (t != null && t<dt) {
        // console.log(t, dt, dtmax);
        dt = t;
        // Generate an acceleration in the normal direction
        n = { x: pos.x + vel.x*dt - q.x,
              y: pos.y + vel.y*dt - q.y };
        var den = Math.sqrt(n.x*n.x + n.y*n.y);
        n.x /= den; // normalize
        n.y /= den;
        vn = vel.x*n.x + vel.y*n.y;
      }
    }
    window.clearTimeout(timeout[it]);
    arrow[it].position.copy(p);
    arrow[it].setLength(v.length());
    arrow[it].setDirection(v.clone().normalize());
    arrow[it].visible = true;
    timeout[it] = window.setTimeout( function(a) {
      return function() {
        arrow[a].visible = false;
      };
    }(it), 10000 );
    it = (it+1)%arrow.length;
    p = { x: pos.x + vel.x*dt,
          y: pos.y + vel.y*dt };
    // console.log("vx:", vel.x, " => ", vel.x - 2*vn*n.x);
    // console.log("vy:", vel.y, " => ", vel.y - 2*vn*n.y);
    v = { x: vel.x - 2*vn*n.x,
          y: vel.y - 2*vn*n.y };
    return { dt: dt, p: p, v: v };
  }
  intersectWall(x1, x0, v0, R, wall) {
    if (v0 == 0) return null;
    var dx = x1 - x0;
    var t = (x1 - x0)/v0;
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
    var dp0 = { x: p0.x - q.x, y: p0.y - q.y };
    var dd0 = ( dp0.x*dp0.x + dp0.y*dp0.y );
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
    var B = 2*(dp0.x*v0.x + dp0.y*v0.y);
    // C: Distance from skin to corner
    var C = dd0 - R*R;
    var D = B*B - 4*A*C;// D > 0 when object travels within R of corner
    // console.log(A, B, C, D);
    if (D < 0) return null;
    var sqrtD = Math.sqrt(D);
    var t1 = (-B + sqrtD)/(2*A);
    var t2 = (-B - sqrtD)/(2*A);
    var p1 = { x: p0.x + v0.x*t1, y: p0.y + v0.y*t1 };
    var p2 = { x: p0.x + v0.x*t2, y: p0.y + v0.y*t2 };
    // var dd1 = ( dp1.x*dp1.x + dp1.y*dp1.y );
    // var dd2 = ( dp2.x*dp2.x + dp2.y*dp2.y );
    var dp1 = { x: p1.x - p0.x, y: p1.y - p0.y };
    var dp2 = { x: p2.x - p0.x, y: p2.y - p0.y };
    // If both times are negative, then the object is already past the corner
    if (t1<0 && t2<0) {
      return null;
    }
    // If C<0, then object is already in contact with the corner
    else if (C<0) {
      // console.log("C<0:", C, "t1:", t1, "t2:", t2);
      return (t1 < 0 ? t1 : t2);
    }
    // Otherwise, return the time of earliest contact
    else {
      return Math.min(t1, t2);
    }
  }
};

