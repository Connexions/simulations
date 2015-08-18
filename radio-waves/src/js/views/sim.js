define(function (require) {

    'use strict';

    var $ = require('jquery');
    var _ = require('underscore');

    var SimView = require('common/app/sim');

    var RadioWavesSimulation = require('models/simulation');
    var RadioWavesSceneView  = require('views/scene');

    var Constants = require('constants');

    var Assets = require('assets');

    require('nouislider');
    require('bootstrap');
    require('bootstrap-select');

    // CSS
    require('less!styles/sim');
    require('less!common/styles/slider');
    require('less!common/styles/radio');
    require('less!bootstrap-select-less');

    // HTML
    var simHtml = require('text!templates/sim.html');

    /**
     * This is the umbrella view for everything in a simulation tab.
     *   It will be extended by both the Intro module and the Charts
     *   and contains all the common functionality between the two.
     */
    var RadioWavesSimView = SimView.extend({

        /**
         * Root element properties
         */
        tagName:   'section',
        className: 'sim-view',

        /**
         * Template for rendering the basic scaffolding
         */
        template: _.template(simHtml),

        /**
         * Dom event listeners
         */
        events: {
            'click #electron-positions-check'       : 'toggleElectronPositions',
            'click #transmitter-movement-manual'    : 'manualClicked',
            'click #transmitter-movement-oscillate' : 'oscillateClicked'
        },

        /**
         * Inits simulation, views, and variables.
         *
         * @params options
         */
        initialize: function(options) {
            options = _.extend({
                title: 'Radio Waves & Electromagnetic Fields',
                name: 'radio-waves',
            }, options);

            SimView.prototype.initialize.apply(this, [options]);

            this.initSceneView();
        },

        /**
         * Initializes the Simulation.
         */
        initSimulation: function() {
            this.simulation = new RadioWavesSimulation();
        },

        /**
         * Initializes the SceneView.
         */
        initSceneView: function() {
            this.sceneView = new RadioWavesSceneView({
                simulation: this.simulation
            });
        },

        /**
         * Renders everything
         */
        render: function() {
            this.$el.empty();

            this.renderScaffolding();
            this.renderSceneView();

            return this;
        },

        /**
         * Renders page content. Should be overriden by child classes
         */
        renderScaffolding: function() {
            var data = {
                Constants: Constants,
                simulation: this.simulation,
                Assets: Assets,
                electronSrc: ''
            };
            this.$el.html(this.template(data));

            this.$('.frequency-slider').noUiSlider({
                start: 1,
                connect: 'lower',
                range: {
                    'min': 0.2,
                    'max': 1
                }
            });

            this.$('.amplitude-slider').noUiSlider({
                start: 1,
                connect: 'lower',
                range: {
                    'min': 0.2,
                    'max': 1
                }
            });
        },

        /**
         * Renders the scene view
         */
        renderSceneView: function() {
            this.sceneView.render();
            this.$('.scene-view-placeholder').replaceWith(this.sceneView.el);
        },

        /**
         * Called after every component on the page has rendered to make sure
         *   things like widths and heights and offsets are correct.
         */
        postRender: function() {
            this.sceneView.postRender();
        },

        /**
         * Resets all the components of the view.
         */
        resetComponents: function() {
            SimView.prototype.resetComponents.apply(this);
            this.initSceneView();
        },

        /**
         * This is run every tick of the updater.  It updates the wave
         *   simulation and the views.
         */
        update: function(time, deltaTime) {
            // Update the model
            this.simulation.update(time, deltaTime);

            var timeSeconds = time / 1000;
            var dtSeconds   = deltaTime / 1000;

            // Update the scene
            this.sceneView.update(timeSeconds, dtSeconds, this.simulation.get('paused'));
        },

        toggleElectronPositions: function(event) {
            if ($(event.target).is(':checked'))
                this.sceneView.showElectronPositionPlots();
            else
                this.sceneView.hideElectronPositionPlots();
        },

        manualClicked: function(event) {
            this.simulation.setTransmittingElectronMovementStrategyToManual();
            this.$('.oscillation-controls').addClass('disabled');
            this.$('.frequency-slider').attr('disabled', 'disabled');
            this.$('.amplitude-slider').attr('disabled', 'disabled');
        },

        oscillateClicked: function(event) {
            this.simulation.setTransmittingElectronMovementStrategyToSinusoidal();
            this.$('.oscillation-controls').removeClass('disabled');
            this.$('.frequency-slider').removeAttr('disabled');
            this.$('.amplitude-slider').removeAttr('disabled');
        }

    });

    return RadioWavesSimView;
});
