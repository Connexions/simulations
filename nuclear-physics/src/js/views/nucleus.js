define(function(require) {

    'use strict';

    var PIXI = require('pixi');

    var PixiView = require('common/v3/pixi/view');

    var ParticleGraphicsGenerator = require('views/particle-graphics-generator');
    var IsotopeSymbolGenerator    = require('views/isotope-symbol-generator');

    /**
     * 
     */
    var NucleusView = PixiView.extend({

        /**
         * Initializes the new NucleusView.
         */
        initialize: function(options) {
            options = _.extend({
                showSymbol: true,
                symbolSize: null,
                hideNucleons: false
            }, options);

            this.mvt = options.mvt;
            this.renderer = options.renderer;
            this.showSymbol = options.showSymbol;
            this.symbolSize = options.symbolSize;
            this.hideNucleons = options.hideNucleons;

            this.initGraphics();

            this._numProtons = this.model.get('numProtons');
            this._numNeutrons = this.model.get('numNeutrons');
        },

        /**
         * Initializes everything for rendering graphics
         */
        initGraphics: function() {
            this.updateMVT(this.mvt);
        },

        update: function(time, deltaTime) {
            this.updatePosition();

            if (this._numProtons !== this.model.get('numProtons') || this._numNeutrons !== this.model.get('numNeutrons')) {
                this._numProtons = this.model.get('numProtons');
                this._numNeutrons = this.model.get('numNeutrons');
                this.nucleusChanged();
            }
        },

        /**
         * Updates the model-view-transform and anything that
         *   relies on it.
         */
        updateMVT: function(mvt) {
            this.mvt = mvt;

            this.updateSprite();
            this.updateSymbol();
            this.updatePosition(this.model, this.model.get('position'));
        },

        updateSprite: function() {
            if (this.nucleusSprite)
                this.displayObject.removeChild(this.nucleusSprite);

            this.nucleusSprite = ParticleGraphicsGenerator.generateNucleus(this.model, this.mvt, this.renderer, this.hideNucleons);
            this.displayObject.addChild(this.nucleusSprite);
        },

        updateSymbol: function() {
            if (this.symbol)
                this.displayObject.removeChild(this.symbol);

            if (this.showSymbol) {
                var fontSize;
                if (this.symbolSize !== null)
                    fontSize = this.symbolSize;
                else if (this.hideNucleons)
                    fontSize = this.nucleusSprite.width * 0.36;
                else
                    fontSize = this.mvt.modelToViewDeltaX(this.model.get('diameter')) * 0.55;
                    
                this.symbol = IsotopeSymbolGenerator.generate(this.model, fontSize);
                this.displayObject.addChild(this.symbol);
            }
        },

        updatePosition: function() {
            var viewPosition = this.mvt.modelToView(this.model.get('position'));
            this.displayObject.x = viewPosition.x;
            this.displayObject.y = viewPosition.y;
        },

        nucleusChanged: function() {
            this.updateSprite();
            this.updateSymbol();
        },

        showLabel: function() {
            this.showSymbol = true;
            this.updateSprite();
            this.updateSymbol();
        },

        hideLabel: function() {
            this.showSymbol = false;
            this.updateSprite();
            this.updateSymbol();
        }

    });


    return NucleusView;
});