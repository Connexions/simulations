define(function(require) {

    'use strict';

    var _    = require('underscore');
    var PIXI = require('pixi');

    var Vector2            = require('common/math/vector2');
    var ModelViewTransform = require('common/math/model-view-transform');

    var Wire     = require('models/components/wire');
    var Junction = require('models/junction');

    var WireView             = require('views/components/wire');
    var ComponentToolboxIcon = require('views/component-toolbox-icon');

    var Constants = require('constants');
    var Assets    = require('assets');

    /**
     * A visual representation of some kind of object supply.  The
     *   user creates new objects with this view.  Dragging from 
     *   the view creates a new object and places it in the scene,
     *   while dragging an existing object back onto this view
     *   destroys it.
     */
    var WireToolboxIcon = ComponentToolboxIcon.extend({

        initialize: function(options) {
            options = _.extend({
                labelText: 'Wire'
            }, options);

            ComponentToolboxIcon.prototype.initialize.apply(this, [options]);
        },

        /**
         * This should be overwritten by child classes to use perhaps the
         *   actual kind of view for the model type with maybe a static
         *   MVT that isn't bound to the scene's MVT.
         */
        createIconSprite: function() {
            var wireModel = new Wire({
                startJunction: new Junction({ position: new Vector2(-50, 0) }),
                endJunction:   new Junction({ position: new Vector2( 50, 0) })
            });
            var mvt = ModelViewTransform.createScaleMapping(0.5);
            var wireView = new WireView({
                mvt: mvt,
                model: wireModel
            });
            return new PIXI.Sprite(wireView.generateTexture());
        },

        /**
         * Creates a new object (of whatever this reservoir contains)
         *   and returns it so it can be added to the scene as a
         *   dummy object.  Note the dummy object will not be added
         *   to the simulation until it gets turned into a real
         *   object after the user drops it.
         */
        createComponentView: function(x, y) {
            var wireModel = new Wire({
                startJunction: new Junction({ position: new Vector2(-50, 0) }),
                endJunction:   new Junction({ position: new Vector2( 50, 0) })
            });
            this.setJunctionPositions(wireModel, x, y);

            var wireView = new WireView({
                mvt: this.mvt,
                model: wireModel
            });
            return wireView;
        }

    });


    return WireToolboxIcon;
});