define(function (require) {

    'use strict';

    var _          = require('underscore');
    var ClipperLib = require('clipper-lib');

    var BooleanShape = require('models/shape/boolean-shape');
    var Intersection = require('models/intersection');

    /**
     * Creates a shape that is the difference of two shapes. It contains a point x iff: A contains x && B does not contain x
     * 
     * CSG intro: https://secure.wikimedia.org/wikipedia/en/wiki/Constructive_solid_geometry
     * Rationale for intersection: http://groups.csail.mit.edu/graphics/classes/6.838/F01/lectures/SmoothSurfaces/0the_s040.html
     *
     * Note to self: TODO: When drawing these, Pixi v3 can now do alpha masks, so we should be able to draw
     *   a color to a canvas and clear a section of it to create an inverted mask.
     */
    var ShapeDifference = function(a, b) {
        BooleanShape.apply(this, arguments);

        this.a = a;
        this.b = b;
    };

    /**
     * Instance functions/properties
     */
    _.extend(ShapeDifference.prototype, BooleanShape.prototype, {

        /**
         * Translates the shape
         */
        translate: function(dx, dy) {
            this.a.translate(dx, dy);
            this.b.translate(dx, dy);
        },

        /**
         * Rotates the shape
         */
        rotate: function(radians) {
            this.a.rotate(radians);
            this.b.rotate(radians);
        },

        /**
         * Returns a piecewise curve approximation
         */
        toPiecewiseCurve: function() {
            return this.clipPiecewiseCurves(
                this.a.toPiecewiseCurve(), 
                this.b.toPiecewiseCurve(), 
                ClipperLib.ClipType.ctDifference
            );
        },

        /**
         * Compute the intersections of the specified ray
         */
        getIntersections: function(tail, direction) {
            var i;
            var a = this.a;
            var b = this.b;

            // For CSG difference, intersection points need to be at the boundary
            //   of one surface, and either be INSIDE A, or OUTSIDE B
            var result = [];

            // Find all intersections with A that are outside of B
            var intersectionsWithA = a.getIntersections(tail, direction);
            for (i = 0; i < intersectionsWithA.length; i++) {
                if (!b.contains(intersectionsWithA[i].getPoint()))
                    result.push(intersectionsWithA[i]);
                else
                    intersectionsWithA[i].destroy();
            }

            // Find all intersections with B that are in A
            var intersectionsWithB = b.getIntersections(tail, direction);
            for (i = 0; i < intersectionsWithB.length; i++) {
                if (a.contains(intersectionsWithB[i].getPoint()))
                    result.push(intersectionsWithB[i]);
                else
                    intersectionsWithB[i].destroy();
            }

            return result;
        },

        /**
         * Returns a rectangle representing the bounds of the shape
         */
        getBounds: function() {
            throw 'Not yet implemented';
        },

        /**
         * Returns the point that will be used to place the rotation drag handle (or null
         *   if not rotatable, like for circles)
         */
        getReferencePoint: function() {
            // Return the first viable reference point
            if (this.a.getReferencePoint())
                return this.a.getReferencePoint();
            else
                return this.b.getReferencePoint();
        },

        /**
         * Returns whether the shape contains a given point
         */
        contains: function(point) {
            return this.a.contains(point) && !this.b.contains(point);
        },

        /**
         * Clones this shape instance and returns it
         */
        clone: function() {
            return new ShapeDifference(this.a.clone(), this.b.clone());
        }

    });

    return ShapeDifference;
});
