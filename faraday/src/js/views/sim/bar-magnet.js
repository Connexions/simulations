define(function (require) {

    'use strict';

    var $ = require('jquery');
    var _ = require('underscore');

    var BarMagnetSimulation = require('models/simulation/bar-magnet');

    var FaradaySimView     = require('views/sim');
    var BarMagnetSceneView = require('views/scene/bar-magnet');

    var Constants = require('constants');

    // HTML
    var controlsHtml = require('text!templates/bar-magnet.html');

    /**
     * This is the umbrella view for everything in a simulation tab.
     *   It will be extended by both the Intro module and the Charts
     *   and contains all the common functionality between the two.
     */
    var BarMagnetSimView = FaradaySimView.extend({

        /**
         * Template for rendering the basic scaffolding
         */
        controlsTemplate: _.template(controlsHtml),

        /**
         * Inits simulation, views, and variables.
         *
         * @params options
         */
        initialize: function(options) {
            options = _.extend({
                title: 'Bar Magnet',
                name: 'bar-magnet',
                includeEarth: false
            }, options);

            this.includeEarth = options.includeEarth;

            FaradaySimView.prototype.initialize.apply(this, [options]);
        },

        /**
         * Initializes the Simulation.
         */
        initSimulation: function() {
            this.simulation = new BarMagnetSimulation();
        },

        /**
         * Initializes the SceneView.
         */
        initSceneView: function() {
            this.sceneView = new BarMagnetSceneView({
                simulation: this.simulation
            });
        },

        /**
         * Renders everything
         */
        render: function() {
            FaradaySimView.prototype.render.apply(this);

            return this;
        },

        /**
         * Renders page content.
         */
        renderScaffolding: function() {
            FaradaySimView.prototype.renderScaffolding.apply(this);

            var data = {
                Constants: Constants,
                simulation: this.simulation,
                name: this.name,
                includeEarth: this.includeEarth
            };

            this.$('.sim-controls-wrapper').append(this.controlsTemplate(data));

            this.$('.strength-slider').noUiSlider({
                start: 3,
                range: {
                    min: 1,
                    max: 5
                },
                connect: 'lower'
            });
        },

        /**
         * Called after every component on the page has rendered to make sure
         *   things like widths and heights and offsets are correct.
         */
        postRender: function() {
            FaradaySimView.prototype.postRender.apply(this);
        },

        /**
         * Resets all the components of the view.
         */
        resetComponents: function() {
            FaradaySimView.prototype.resetComponents.apply(this);
            
        },


    });

    return BarMagnetSimView;
});