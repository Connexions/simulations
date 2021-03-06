define(function(require) {

    'use strict';

    var _    = require('underscore');
    var PIXI = require('pixi');

    /*
     * Canvas initialization
     */
    var _renderer = PIXI.autoDetectRenderer(200, 200, { transparent: true, antialias: true });
    var _canvas = _renderer.view;
    var _stage = new PIXI.Container();

    /**
     * Static functions
     */
    var PixiToImage = {

        /**
         * Takes a Pixi DisplayObject, renders it to a canvas,
         *   and generates and returns an image data URI.
         */
        displayObjectToDataURI: function(displayObject, padding) {
            var canvas = this.displayObjectToCanvas(displayObject, padding, _renderer);

            // Return the image imprinted on the canvas
            return canvas.toDataURL('image/png');
        },

        displayObjectToCanvas: function(displayObject, padding, renderer) {
            var canvas = _canvas;
            if (renderer === undefined) {
                renderer = PIXI.autoDetectRenderer(200, 200, { transparent: true, antialias: true });
                canvas = renderer.view;
            }

            var wrapper = this._wrapDisplayObject(displayObject, padding, renderer);
            _stage.addChild(wrapper);

            // Render to the canvas
            renderer.render(_stage);

            // Set the displayObject loose again
            wrapper.removeChild(displayObject);
            _stage.removeChild(wrapper);

            return canvas;
        },

        _wrapDisplayObject: function(displayObject, padding, renderer) {
            if (padding === undefined)
                padding = 0;
            
            // Resize the canvas to make sure it fits.
            renderer.resize(
                displayObject.width + padding * 2,
                displayObject.height + padding * 2
            );

            // Wrap the display object in a container so we can 
            //   move it and fit it in the canvas.
            var wrapper = new PIXI.Container();
            var bounds = displayObject.getBounds();
            var xShift = 0 - bounds.x * displayObject.scale.x + padding;
            var yShift = 0 - bounds.y * displayObject.scale.y + padding;
            wrapper.addChild(displayObject);
            wrapper.x = xShift;
            wrapper.y = yShift;
            
            return wrapper;
        }

    };


    return PixiToImage;
});