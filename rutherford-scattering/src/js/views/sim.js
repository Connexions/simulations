define(function (require) {

    'use strict';

    var $ = require('jquery');
    var _ = require('underscore');

    var SimView = require('common/v3/app/sim');

    var RutherfordScatteringSimulation = require('rutherford-scattering/models/simulation');
    var RutherfordScatteringSceneView  = require('rutherford-scattering/views/scene');
    var RutherfordScatteringLegendView = require('rutherford-scattering/views/legend');

    var Constants = require('constants');

    require('nouislider');
    require('bootstrap');
    require('bootstrap-select');

    // CSS
    require('less!rutherford-scattering/styles/sim');
    require('less!rutherford-scattering/styles/playback-controls');
    require('less!common/styles/slider');
    require('less!common/styles/radio');
    require('less!bootstrap-select-less');

    // HTML
    var simHtml = require('text!rutherford-scattering/templates/sim.html');
    var playbackControlsHtml = require('text!rutherford-scattering/templates/playback-controls.html');

    /**
     * This is the umbrella view for everything in a simulation tab.
     *   It will be extended by both the Intro module and the Charts
     *   and contains all the common functionality between the two.
     */
    var RutherfordScatteringSimView = SimView.extend({

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
            'click .play-btn'   : 'play',
            'click .pause-btn'  : 'pause',
            'click .step-btn'   : 'step',
            'click .reset-btn'  : 'reset',

            'click .show-traces-check'  : 'toggleTraces',

            'slide .energy-slider'    : 'changeEnergy',
            'slide .protons-slider'   : 'changeProtons',
            'slide .neutrons-slider'  : 'changeNeutrons',
        },

        /**
         * Inits simulation, views, and variables.
         *
         * @params options
         */
        initialize: function(options) {
            options = _.extend({
                title: 'Rutherford Scattering',
                name: 'rutherford-scattering',
            }, options);

            SimView.prototype.initialize.apply(this, [options]);

            this.initLegend();
            this.initSceneView();
        },

        /**
         * Initializes the Simulation.
         */
        initSimulation: function() {
            this.simulation = new RutherfordScatteringSimulation();
        },

        /**
         * Initializes the SceneView.
         */
        initSceneView: function() {
            this.sceneView = new RutherfordScatteringSceneView({
                simulation: this.simulation
            });
        },

        initLegend: function() {
            this.legendView = new RutherfordScatteringLegendView();
        },

        initControls: function() {
            this.controls = {};

            this.controls.energy = {
                $slider: this.$('.energy-slider')
            };
            this.controls.protons = {
                $slider: this.$('.protons-slider'),
                $value: this.$('.protons-value')
            };
            this.controls.neutrons = {
                $slider: this.$('.neutrons-slider'),
                $value: this.$('.neutrons-value')
            };
        },

        /**
         * Renders everything
         */
        render: function() {
            this.$el.empty();

            this.renderScaffolding();
            this.renderSceneView();
            this.renderPlaybackControls();
            this.renderControls();

            return this;
        },

        /**
         * Renders playback controls
         */
        renderPlaybackControls: function() {
            this.$el.append(playbackControlsHtml);
        },

        /**
         * Renders page content. Should be overriden by child classes
         */
        renderScaffolding: function() {
            var data = {
                Constants: Constants,
                simulation: this.simulation,
                showAtomProperties: this.showAtomProperties
            };
            this.$el.html(this.template(data));
            this.$('select').selectpicker();
        },

        /**
         * Renders the scene view
         */
        renderSceneView: function() {
            this.sceneView.render();
            this.$('.scene-view-placeholder').replaceWith(this.sceneView.el);
        },

        renderLegend: function() {
            this.legendView.render();
            this.$('.legend-panel').append(this.legendView.el);
        },

        renderControls: function() {
            if(!_.isObject(this.controls)){
                this.initControls();
            }

            _.each(this.controls, function(control, controlOf){
                control.$slider.noUiSlider({
                    start: 0,
                    range: {
                        min: 20,
                        max: 150
                    },
                    connect: 'lower'
                });
            });
        },

        /**
         * Called after every component on the page has rendered to make sure
         *   things like widths and heights and offsets are correct.
         */
        postRender: function() {
            this.sceneView.postRender();

            this.renderLegend();
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

        toggleTraces: function(event) {
            if ($(event.target).is(':checked'))
                console.info('show traces');
                // this.sceneView.showTraces();
            else
                console.info('hide traces');
                // this.sceneView.hideTraces();
        },

        changeEnergy: function(event) {
            var value = parseInt($(event.target).val());
            // set model value
            console.info('change energy');
        },

        changeProtons: function(event) {
            var count = parseInt($(event.target).val());
            this.controls.protons.$value.text(count);
            // set model value
            console.info('change proton');
        },

        changeNeutrons: function(event) {
            var count = parseInt($(event.target).val());
            this.controls.neutrons.$value.text(count);
            // set model value
            console.info('change neutrons');
        }

    });

    return RutherfordScatteringSimView;
});
