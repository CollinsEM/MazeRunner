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
function smallestPositiveValue(accum, curr, value) {
  if (value(curr) < 0) return accum;
  if (accum && value(accum) < value(curr)) return accum;
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
  /// @param state Constant acceleration motion state
  /// @param T     Maximum time interval to consider
  /// @param R     Radius of a sphere about the object center for which
  ///              collisions with solid walls should be considered.
  /// @return      An object containing the expected time (t<T) at which
  ///              the object will either leave the current cell
  ///              through an open passage, or collide with a solid
  ///              wall.
  detectCollision(p0, v0, a, dt, R) {
    var i0 = Math.round(p0.x), j0 = Math.round(p0.y);
    var xState = new MotionState(p0.x, v0.x, a.x);
    var yState = new MotionState(p0.y, v0.y, a.y);
    var T = [ dt ];
    T.push( this.cellData[i0][j0].walls[0] ?
            xState.solve(i0-0.45+R) : // contact west wall
            xState.solve(i0-0.50) ) ; // exit west door
    T.push( this.cellData[i0][j0].walls[1] ?
            yState.solve(j0-0.45+R) : // contact south wall
            yState.solve(j0-0.50) ) ; // exit south door
    T.push( this.cellData[i0][j0].walls[2] ?
            xState.solve(i0+0.45-R) : // contact east wall
            xState.solve(i0+0.50) ) ; // exit east door
    T.push( this.cellData[i0][j0].walls[3] ?
            yState.sovle(j0+0.45-R) : // contact north wall
            yState.solve(j0+0.50) ) ; // exit north door
    // Now identify which time is nearest in the future
    var t = T.reduce(smallestPositiveValue, null, (val) => val);
    // console.log(T, t);
    var dp = { x: (v0.x + 0.5*a0.x*t)*t,
               y: (v0.y + 0.5*a0.y*t)*t };
    
    // Assuming no contact with walls or doors, compute the update for
    // the provided time increment.
    var soln = { dt: dt,
                 dp: { x: (0.5*a0.x*dt + v0.x)*dt,
                       y: (0.5*a0.y*dt + v0.y)*dt },
                 dv: { x: a0.x*dt,
                       y: a0.y*dt } };
    var SOLNS = [ soln ];
    return { dt: dt-t, dp: dp };
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
    var next = [ { i: curr.i-1, j: curr.j   },   // WEST
                 { i: curr.i,   j: curr.j-1 },   // SOUTH
                 { i: curr.i+1, j: curr.j   },   // EAST
                 { i: curr.i,   j: curr.j+1 } ]; // NORTH
    while (next.length > 0) {
      var idx = Math.floor(next.length*Math.random());
      if (next[idx].i == prev.i && next[idx].j == prev.j) {
        // The cell indicated by next[idx] is in the direction that we
        // just came from. So, we do not place a wall here.
        this.cellData[curr.i][curr.j].walls[idx] = false;
        // console.log("Not building wall between(", curr.i, curr.j,
        //             ") and (", next[idx].i, next[idx].j, ").");
      }
      else if (next[idx].i<0 || next[idx].i>this.ni-1 ||
               next[idx].j<0 || next[idx].j>this.nj-1 ||
               this.cellData[next[idx].i][next[idx].j].visited ) {
        // The cell indicated by next[idx] has already been
        // visited. So we need to build a wall here. As an
        // alternative, if the formation of loops or rooms within the
        // maze is allowable, then one could presumably allow the
        // presence of an open passageway here with some small
        // probability. In general, we prefer to have few loops if
        // any.
        this.cellData[curr.i][curr.j].walls[idx] = true;
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
        this.recurseDescend(next[idx], curr);
        // console.log("Returned to node:", curr.i, curr.j);
      }
      // Remove next[idx] from the list
      next.splice(idx, 1);
    }
  }
};
