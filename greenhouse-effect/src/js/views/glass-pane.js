define(function(require) {

    'use strict';

    var _    = require('underscore');
    var PIXI = require('pixi');
    require('common/pixi/extensions');
    
    var PixiView = require('common/pixi/view');

    var Constants = require('constants');

    /**
     * A view that represents a photon
     */
    var GlassPaneView = PixiView.extend({

        /**
         * Initializes the new GlassPaneView.
         */
        initialize: function(options) {
            this.initGraphics();
            this.updateMVT(options.mvt);
        },

        initGraphics: function() {
            this.glassPane = new PIXI.Graphics();
            this.displayObject.addChild(this.glassPane);
        },

        drawGlassPane: function() {
            var bounds = this.model.get('bounds');
            this.glassPane.beginFill(0xFFFFFF, 0.5);
            this.glassPane.drawRect(
                this.mvt.modelToViewX(bounds.x), 
                this.mvt.modelToViewY(bounds.y), 
                this.mvt.modelToViewDeltaX(bounds.w), 
                Math.abs(this.mvt.modelToViewDeltaY(bounds.h))
            );
            this.glassPane.endFill();
        },

        /**
         * Updates the model-view-transform and anything that
         *   relies on it.
         */
        updateMVT: function(mvt) {
            this.mvt = mvt;

            this.drawGlassPane();
        }

    });

    return GlassPaneView;
});