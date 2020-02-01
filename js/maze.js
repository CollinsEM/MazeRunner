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
  /// @param T     Maximum time interval to consider
  /// @param R     Radius of a sphere about the object center for which
  ///              collisions with solid walls should be considered.
  /// @return      An object containing the expected time (t<T) at which
  ///              the object will either leave the current cell
  ///              through an open passage, or collide with a solid
  ///              wall.
  detectCollision(pos, vel, dtmax, R) {
    // Identify which cell is being queried
    var i0 = Math.round(pos.x);
    var j0 = Math.round(pos.y);
    // console.log(i0, j0);
    // console.log(pos.x, pos.y);
    // console.log(vel.x, vel.y);
    if (i0 < 0 || i0 >= this.ni) {
      return { dt: -0.1*dtmax, vx:-vel.x, vy: vel.y };
    }
    else if (j0 < 0 || j0 >= this.nj) {
      return { dt: -0.1*dtmax, vx: vel.x, vy:-vel.y };
    }
    var RR  = R*R;
    var dt = dtmax;
    var vx = vel.x, vxSq = vx*vx;
    var vy = vel.y, vySq = vy*vy;
    // Find the time to intersect the nearest corner
    for (var i=0; i<2; ++i) {
      var x = i0 - 0.5 + i;
      var dx = pos.x - dx;
      var dxSq = dx*dx;
      for (var j=0; j<2; ++j) {
        var y = j0 - 0.5 + j;
        var dy = pos.y - y;
        var dySq = dy*dy;
        var dpSq = dxSq + dySq;
        var A = vxSq + vySq;
        var B = -(dx*vel.x + dy*vel.y);
        var C = dxSq + dySq - RSq;
        var D = B*B - 4*A*C;
        if (dpSq < RSq) {
          var ax = dx/RSq;
          var ay = dy/RSq;
          console.log("Close to corner:", i, j);
          console.log(A, B, C, D);
        }
        if (D >= 0) {
          D = Math.sqrt(D);
          var t1 = (-B + D)/(2*A);
          var t2 = (-B - D)/(2*A);
          console.log("t1:", t1, ", t2:", t2);
          if (t1 > 0 && t1 < dt) {
            dt = t1;
            var x1 = pos.x + vel.x*dt;
            var y1 = pos.y + vel.y*dt;
            var r  = { x: x1 - x, y: y1 - y };
            var dr = Math.sqrt(r.x*r.x + r.y*r.y);
            var n  = { x: r.x/dr, y: r.y/dr };
            var vn = (vel.x*n.x + vel.y*n.y);
            console.log("normal: ", n);
            vx = vel.x - 2*vn*n.x;
            vy = vel.y - 2*vn*n.y;
            console.log("velocity: ", vx, vy);
          }
          if (t2 > 0 && t2 < dt) {
            dt = t2;
            var x1 = pos.x + vel.x*dt;
            var y1 = pos.y + vel.y*dt;
            var r  = { x: x1 - x, y: y1 - y };
            var dr = Math.sqrt(r.x*r.x + r.y*r.y);
            var n  = { x: r.x/dr, y: r.y/dr };
            var vn = (vel.x*n.x + vel.y*n.y);
            console.log("normal: ", n);
            vx = vel.x - 2*vn*n.x;
            vy = vel.y - 2*vn*n.y;
            console.log("velocity: ", vx, vy);
          }
        }
      }
    }
    var x, y;
    if (vel.x < 0) {
      x = i0 - 0.55;
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
      y = j0 - 0.55;
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
      x = i0 + 0.55;
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
      y = i0 + 0.55;
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
    
    return { dt: dt, vx: vx, vy: vy };
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

