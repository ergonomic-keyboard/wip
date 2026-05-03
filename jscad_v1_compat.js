// JSCAD v1 compatibility shim for v2 (openjscad.xyz)
// Prepend this to ergogen-generated .jscad files to run them on v2 viewers.

const { path2, geom2 } = require('@jscad/modeling').geometries
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { union, subtract } = require('@jscad/modeling').booleans
const { translate, rotate } = require('@jscad/modeling').transforms

class Path2DCompat {
  constructor(points) {
    this.points = points.map(p => [p[0], p[1]])
    this.closed = false
  }
  appendPoint(p) {
    this.points.push([p[0], p[1]])
    return this
  }
  appendArc(endpoint, options) {
    // Approximate arc as straight line (simplified — arcs are small fillets)
    this.points.push([endpoint[0], endpoint[1]])
    return this
  }
  close() {
    this.closed = true
    return this
  }
  innerToCAG() {
    const pts = this.points
    return { type: 'geom2', geometry: geom2.fromPoints(pts), union: function(other) { return new UnionResult(this, other) }, extrude: function(opts) { return extrudeLinear({ height: opts.offset[2] }, this.geometry) } }
  }
}

class UnionResult {
  constructor(a, b) {
    this.geometry = union(a.geometry, b.geometry)
  }
  union(other) {
    return new UnionResult(this, other)
  }
  subtract(other) {
    this.geometry = subtract(this.geometry, other.geometry)
    return this
  }
  extrude(opts) {
    return extrudeLinear({ height: opts.offset[2] }, this.geometry)
  }
  getBounds() {
    const bounds = require('@jscad/modeling').measurements.measureBoundingBox(this.geometry)
    return [{ x: bounds[0][0], y: bounds[0][1] }, { x: bounds[1][0], y: bounds[1][1] }]
  }
}

const CSG = {
  Path2D: function(points) { return new Path2DCompat(points) }
}
