class Cell {
  constructor() {
    this.visited = false;
    this.neighbors = [];
  }
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
        this.cellData[i][j] = new Cell();
      }
    }
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
    var root = { i: 0, j: 0 };
    var start = { i: -1, j: 0};
    this.recurseDescend(root, start);
    this.geometry.vertices.forEach( function(v) {
      v.x = Math.min(Math.max(v.x, -0.5), ni-0.5);
      v.y = Math.min(Math.max(v.y, -0.5), nj-0.5);
    } );
    this.geometry.computeFaceNormals();
    var material = new THREE.MeshLambertMaterial( {color: 0x9999ff,
                                                   side: THREE.DoubleSide } );
    var mesh = new THREE.Mesh( this.geometry, material );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.add( mesh );
  }
  recurseDescend(curr, prev) {
    // console.log("Visiting node:", curr.i, curr.j);
    this.cellData[curr.i][curr.j].visited = true;
    var next = [ { i: curr.i-1, j: curr.j }, { i: curr.i, j: curr.j-1 },
                 { i: curr.i+1, j: curr.j }, { i: curr.i, j: curr.j+1 } ];
    while (next.length > 0) {
      var idx = Math.floor(next.length*Math.random());
      if (next[idx].i == prev.i && next[idx].j == prev.j) {
        // console.log("Not building wall between(", curr.i, curr.j,
        //             ") and (", next[idx].i, next[idx].j, ").");
      }
      else if (next[idx].i<0 || next[idx].i>this.ni-1 ||
               next[idx].j<0 || next[idx].j>this.nj-1 ||
               this.cellData[next[idx].i][next[idx].j].visited ) {
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
        // Mark this node as visited and proceed to the next
        this.recurseDescend(next[idx], curr);
        // console.log("Returned to node:", curr.i, curr.j);
      }
      next.splice(idx, 1);
    }
  }
};
