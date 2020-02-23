"use strict";

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
      return Math.min(t1, t2);
    }
    // Otherwise, return the time of earliest contact
    else {
      return Math.min(t1, t2);
    }
  }
};
