var wallMat = new THREE.MeshLambertMaterial( { color: 0x9999ff,
                                               side: THREE.DoubleSide } );

class Wall extends THREE.Geometry {
  /**
   *  @brief Implements semantics for one side of a solid wall between
   *  adjacent cells.
   *
   *  @param c  interior cell adjacent to this side of the wall
   *  @param n  direction normal to wall
   *
   *  cell   provides a reference to the adjancent interior cell
   *
   *  center specifies the location of the center of the wall.
   *
   *  normal provides the orientation of the wall and is directed
   *  inwards towards the center of the parent cell.
   */
  constructor(c, n) {
    super();
    this.cell = c;
    this.normal = n;
    this.center = { x: c.x - 0.45*n.x,
                    y: c.y - 0.45*n.y };
  }
  // Render exposed surfaces
  buildGeometry() {
    var c = this.center, n = this.normal;
    var dx = (n.x != 0 ? 0 : 0.55);
    var dy = (n.y != 0 ? 0 : 0.55);
    this.vertices.push(new THREE.Vector3(c.x - dx, c.y - dy, 0));
    this.vertices.push(new THREE.Vector3(c.x - dx, c.y - dy, 1));
    this.vertices.push(new THREE.Vector3(c.x + dx, c.y + dy, 0));
    this.vertices.push(new THREE.Vector3(c.x + dx, c.y + dy, 1));
    this.vertices.push(new THREE.Vector3(c.x - dx - 0.05*n.x, c.y - dy - 0.05*n.y, 0));
    this.vertices.push(new THREE.Vector3(c.x - dx - 0.05*n.x, c.y - dy - 0.05*n.y, 1));
    this.vertices.push(new THREE.Vector3(c.x + dx - 0.05*n.x, c.y + dy - 0.05*n.x, 0));
    this.vertices.push(new THREE.Vector3(c.x + dx - 0.05*n.x, c.y + dy - 0.05*n.x, 1));
    this.faces.push(new THREE.Face3(0, 1, 3));
    this.faces.push(new THREE.Face3(0, 3, 2));
    this.faces.push(new THREE.Face3(0, 4, 5));
    this.faces.push(new THREE.Face3(0, 5, 1));
    this.faces.push(new THREE.Face3(1, 5, 7));
    this.faces.push(new THREE.Face3(1, 7, 3));
    this.faces.push(new THREE.Face3(3, 7, 6));
    this.faces.push(new THREE.Face3(3, 6, 2));
    this.computeFaceNormals();
  }
  // Compute the time of impact between this wall and a sphere of
  // radius R, center p0, traveling with velocity v0.
  detectCollision(p0, v0, R) {
    if (this.normal.x*v0.x != 0) {
      var dx = this.center.x + R*this.normal.x - p0.x ;
      var t = dx/v0.x ;
      return ( (t >= 0 || Math.abs(dx) < R) ? t : null ) ;
    }
    else if (this.normal.y*v0.y != 0) {
      var dy = this.center.y + R*this.normal.y - p0.y ;
      var t = dy/v0.y ;
      return ( (t >= 0 || Math.abs(dy) < R) ? t : null ) ;
    }
    else {
      return null;
    }
  }
};

