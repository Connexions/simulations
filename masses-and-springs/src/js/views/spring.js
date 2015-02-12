
define(function(require) {

    'use strict';

    // var PIXI = require('pixi');
    var PIXI = require('common/pixi/extensions');

    
    var PixiView = require('common/pixi/view');
    var Colors   = require('common/colors/colors');
    // var Vector2  = require('common/math/vector2');
    var PiecewiseCurve = require('common/math/piecewise-curve');

    var Assets = require('assets');

    var Constants = require('constants');

    /**
     * A view that represents a movable target model
     */
    var Spring = PixiView.extend({

        initialize: function(options) {
            this.mvt = options.mvt;

            this.sceneWidth = options.sceneWidth;
            this.sceneHeight = options.sceneHeight;

            this.initGraphics();

            this.updateMVT(this.mvt);

            this.listenTo(this.model, 'change:k', this.drawSpring);
            this.listenTo(this.model, 'change:y2', this.drawSpring);
        },

        initGraphics: function() {
            this.spring = new PIXI.Graphics();
            this.displayObject.addChild(this.spring);
        },

        calculateSpringViewModel: function(){
            this.viewModel = this.viewModel || {};

            this.viewModel.x = this.model.x * this.sceneWidth;
            this.viewModel.y1 = this.model.y1 * this.sceneHeight;
            this.viewModel.y2 = this.model.y2 * this.sceneHeight;
            this.viewModel.restL = this.model.restL * this.sceneHeight;
            this.viewModel.thickness = this.model.k * Spring.THICKNESS_FACTOR;

            this.viewModel.ringOffset = 2 * Spring.RING_RADIUS;
            this.viewModel.coilsLength = this.viewModel.y2 - this.viewModel.y1 - 3 * Spring.RING_RADIUS;
            this.viewModel.color = Colors.parseHex(Spring.COLOR);
        },

        drawSpring: function(){

            var curve = new PiecewiseCurve();
            var points;

            this.calculateSpringViewModel();
            points = this.makeCoilPoints();

            this.spring.clear();
            // set a fill and line style
            this.spring.lineStyle(this.viewModel.thickness, this.viewModel.color, 1);

            // draw curves for spring
            _.each(points, function(point, iter){
                if (iter === 0){
                    curve.moveTo.apply(curve, point);
                }else if (point.length > 4){
                    curve.curveTo.apply(curve, point);
                }else{
                    curve.lineTo.apply(curve, point);
                }
            }, this);

            this.spring.drawPiecewiseCurve(curve, 0, 0);

        },

        makeCoilPoints: function(){

            var points = [];
            var coilCount = 0;

            this.makeCoilRing(points, this.viewModel.x, this.viewModel.y1);

            while(coilCount < Spring.COILS){
                this.makeBezierCoilPoint(points, this.viewModel.x, this.viewModel.y1 + this.viewModel.ringOffset, coilCount);
                coilCount ++;
            }

            this.makeCoilClose(points);

            return points;
        },

        makeCoilRing: function(points, x, y){

            var radius = Spring.RING_RADIUS;

            x = x - radius;
            y = y + 2 * radius;

            points.push([
                x + radius, y
            ]);
            points.push([
                x + (2 * radius), y,
                x + (2 * radius), y - (1.5 * radius),
                x + radius, y - (1.5 * radius)
            ]);
            points.push([
                x, y - (1.5 * radius),
                x, y,
                x + radius, y
            ]);
        },

        makeBezierCoilPoint: function(points, x, y, coilCount){
            var fromCenter = Spring.WIDTH/2;
            var coilHeight = this.viewModel.coilsLength / Spring.COILS;

            points.push([
                x, y + (coilCount + 0.25) * coilHeight,
                x + fromCenter, y + (coilCount + 0.25) * coilHeight,
                x + fromCenter, y + (coilCount + 0.5) * coilHeight
            ]);
            points.push([
                x, y + (coilCount + 0.75) * coilHeight,
                x - fromCenter, y + (coilCount + 0.75) * coilHeight,
                x - fromCenter, y + (coilCount + 1) * coilHeight
            ]);
        },

        makeCoilClose: function(points){
            points[points.length - 1] = [this.viewModel.x, this.viewModel.y2 - Spring.RING_RADIUS];
            points[points.length] = [this.viewModel.x, this.viewModel.y2];
        },

        updateMVT: function(mvt) {
            this.mvt = mvt;

            // this.updatePosition();
            this.drawSpring();
        }

    }, Constants.SpringDefaults);

    return Spring;
});
