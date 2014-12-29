////////////////////////////////////////////////////////////////////////////////
//
// Delaunay Triangulation Code, by Joshua Bell
//
// Inspired by: http://www.codeguru.com/cpp/data/mfc_database/misc/article.php/c8901/
//
// This work is hereby released into the Public Domain. To view a copy of the public 
// domain dedication, visit http://creativecommons.org/licenses/publicdomain/ or send 
// a letter to Creative Commons, 171 Second Street, Suite 300, San Francisco, 
// California, 94105, USA.
//
////////////////////////////////////////////////////////////////////////////////

(function(global) {

  var EPSILON = 1.0e-6;

  //------------------------------------------------------------
  // Vertex class
  //------------------------------------------------------------

  function Vertex(x, y) {
    this.x = x;
    this.y = y;
  }

  //------------------------------------------------------------
  // Triangle class
  //------------------------------------------------------------

  function Triangle(v0, v1, v2) {
    this.v0 = v0;
    this.v1 = v1;
    this.v2 = v2;

    this.calcCircumcircle();
  }

  Triangle.prototype.calcCircumcircle = function() {
    // From: http://www.exaflop.org/docs/cgafaq/cga1.html

    var A = this.v1.x - this.v0.x;
    var B = this.v1.y - this.v0.y;
    var C = this.v2.x - this.v0.x;
    var D = this.v2.y - this.v0.y;

    var E = A * (this.v0.x + this.v1.x) + B * (this.v0.y + this.v1.y);
    var F = C * (this.v0.x + this.v2.x) + D * (this.v0.y + this.v2.y);

    var G = 2.0 * (A * (this.v2.y - this.v1.y) - B * (this.v2.x - this.v1.x));

    var dx, dy;

    if (Math.abs(G) < EPSILON) {
      // Collinear - find extremes and use the midpoint

      var minx = Math.min(this.v0.x, this.v1.x, this.v2.x);
      var miny = Math.min(this.v0.y, this.v1.y, this.v2.y);
      var maxx = Math.max(this.v0.x, this.v1.x, this.v2.x);
      var maxy = Math.max(this.v0.y, this.v1.y, this.v2.y);

      this.center = new Vertex((minx + maxx) / 2, (miny + maxy) / 2);

      dx = this.center.x - minx;
      dy = this.center.y - miny;
    } else {
      var cx = (D * E - B * F) / G;
      var cy = (A * F - C * E) / G;

      this.center = new Vertex(cx, cy);

      dx = this.center.x - this.v0.x;
      dy = this.center.y - this.v0.y;
    }

    this.radius_squared = dx * dx + dy * dy;
    this.radius = Math.sqrt(this.radius_squared);
  };

  Triangle.prototype.inCircumcircle = function(v) {
    var dx = this.center.x - v.x;
    var dy = this.center.y - v.y;
    var dist_squared = dx * dx + dy * dy;

    return (dist_squared <= this.radius_squared);
  };

  //------------------------------------------------------------
  // Edge class
  //------------------------------------------------------------

  function Edge(v0, v1) {
    this.v0 = v0;
    this.v1 = v1;
  }

  Edge.prototype.equals = function(other) {
    return (this.v0 === other.v0 && this.v1 === other.v1);
  };

  Edge.prototype.inverse = function() {
    return new Edge(this.v1, this.v0);
  };

  //------------------------------------------------------------
  // triangulate
  //
  // Perform the Delaunay Triangulation of a set of vertices.
  //
  // vertices: Array of Vertex objects
  //
  // returns: Array of Triangles
  //------------------------------------------------------------
  function triangulate(vertices) {
    var triangles = [];

    //
    // First, create a "supertriangle" that bounds all vertices
    //
    var st = createBoundingTriangle(vertices);

    triangles.push(st);

    //
    // Next, begin the triangulation one vertex at a time
    //
    vertices.forEach(function(vertex) {
      // NOTE: This is O(n^2) - can be optimized by sorting vertices
      // along the x-axis and only considering triangles that have 
      // potentially overlapping circumcircles
      triangles = addVertex(vertex, triangles);
    });

    //
    // Remove triangles that shared edges with "supertriangle"
    //
    triangles = triangles.filter(function(triangle) {
      return !(triangle.v0 == st.v0 || triangle.v0 == st.v1 || triangle.v0 == st.v2 ||
        triangle.v1 == st.v0 || triangle.v1 == st.v1 || triangle.v1 == st.v2 ||
        triangle.v2 == st.v0 || triangle.v2 == st.v1 || triangle.v2 == st.v2);
    });

    return triangles;
  }

  // Internal: create a triangle that bounds the given vertices, with room to spare
  function createBoundingTriangle(vertices) {
    // NOTE: There's a bit of a heuristic here. If the bounding triangle 
    // is too large and you see overflow/underflow errors. If it is too small 
    // you end up with a non-convex hull.

    var minx, miny, maxx, maxy;
    vertices.forEach(function(vertex) {
      if (minx === undefined || vertex.x < minx) { minx = vertex.x; }
      if (miny === undefined || vertex.y < miny) { miny = vertex.y; }
      if (maxx === undefined || vertex.x > maxx) { maxx = vertex.x; }
      if (maxy === undefined || vertex.y > maxy) { maxy = vertex.y; }
    });

    var dx = (maxx - minx) * 10;
    var dy = (maxy - miny) * 10;

    var stv0 = new Vertex(minx - dx, miny - dy * 3);
    var stv1 = new Vertex(minx - dx, maxy + dy);
    var stv2 = new Vertex(maxx + dx * 3, maxy + dy);

    return new Triangle(stv0, stv1, stv2);
  }

  // Internal: update triangulation with a vertex 
  function addVertex(vertex, triangles) {
    var edges = [];

    // Remove triangles with circumcircles containing the vertex

    triangles = triangles.filter(function(triangle) {
      if (triangle.inCircumcircle(vertex)) {
        edges.push(new Edge(triangle.v0, triangle.v1));
        edges.push(new Edge(triangle.v1, triangle.v2));
        edges.push(new Edge(triangle.v2, triangle.v0));
        return false;
      }

      return true;
    });

    edges = uniqueEdges(edges);

    // Create new triangles from the unique edges and new vertex
    edges.forEach(function(edge) {
      triangles.push(new Triangle(edge.v0, edge.v1, vertex));
    });

    return triangles;
  }

  // Internal: remove duplicate edges from an array
  function uniqueEdges(edges) {
    // TODO: This is O(n^2), make it O(n) with a hash or some such
    var uniqueEdges = [];
    for (var i = 0; i < edges.length; ++i) {
      var edge1 = edges[i];
      var unique = true;

      for (var j = 0; j < edges.length; ++j) {
        if (i === j)
          continue;
        var edge2 = edges[j];
        if (edge1.equals(edge2) || edge1.inverse().equals(edge2)) {
          unique = false;
          break;
        }
      }

      if (unique)
        uniqueEdges.push(edge1);
    }

    return uniqueEdges;
  }

  global.Vertex = Vertex;
  global.Triangle = Triangle;
  global.Edge = Edge;
  global.triangulate = triangulate;

}(self));
