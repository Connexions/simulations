define(function (require) {

    'use strict';

    var $ = require('jquery');
    var _ = require('underscore');

    var SimView = require('common/app/sim');

    var GreenhouseEffectSimulation = require('models/simulation/greenhouse-effect');
    var TemplateSceneView  = require('views/scene');

    var Constants = require('constants');
    var Assets    = require('assets');

    require('nouislider');
    require('bootstrap');
    require('bootstrap-select');

    // CSS
    require('less!styles/sim');
    require('less!styles/playback-controls');
    require('less!common/styles/slider');
    require('less!common/styles/radio');
    require('less!bootstrap-select-less');

    // HTML
    var simHtml              = require('text!templates/sim-greenhouse.html');
    var playbackControlsHtml = require('text!templates/playback-controls-greenhouse.html');

    /**
     * SimView for the Greenhouse Effects tab
     */
    var GreenhouseSimView = SimView.extend({

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
            'click .reset-btn'  : 'reset',

            'click .all-photons-check' : 'toggleAllPhotons',
            'click .add-cloud-btn'     : 'addCloud',
            'click .remove-cloud-btn'  : 'removeCloud',

            'click #atmosphere-type-today'          : 'setAtmosphereToday',
            'click #atmosphere-type-seventeen-fifty': 'setAtmosphere1750',
            'click #atmosphere-type-ice-age'        : 'setAtmosphereIceAge',
            'click #atmosphere-type-custom'         : 'setAtmosphereCustom',

            'slide .concentration-slider': 'changeConcentration'
        },

        /**
         * Inits simulation, views, and variables.
         *
         * @params options
         */
        initialize: function(options) {
            options = _.extend({
                title: 'Greenhouse Effect',
                name: 'greenhouse-effect',
            }, options);

            SimView.prototype.initialize.apply(this, [options]);

            this.initSceneView();

            this.listenTo(this.simulation, 'change:paused', this.pausedChanged);
            this.pausedChanged(this.simulation, this.simulation.get('paused'));
        },

        /**
         * Initializes the Simulation.
         */
        initSimulation: function() {
            this.simulation = new GreenhouseEffectSimulation();
        },

        /**
         * Initializes the SceneView.
         */
        initSceneView: function() {
            this.sceneView = new TemplateSceneView({
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
            this.renderPlaybackControls();

            return this;
        },

        /**
         * Renders page content. Should be overriden by child classes
         */
        renderScaffolding: function() {
            var data = {
                Constants: Constants,
                simulation: this.simulation,
                unique: this.cid,
                iconSize: 18,
                sunlightPhotonSrc: Assets.Images.PHOTON_SUNLIGHT,
                infraredPhotonSrc: Assets.Images.PHOTON_INFRARED,
                Assets: Assets
            };
            this.$el.html(this.template(data));
            
            var scale = Constants.Atmosphere.CONCENTRATION_RESOLUTION;
            this.$('.concentration-slider').noUiSlider({
                connect: 'lower',
                start: this.simulation.atmosphere.get('greenhouseGasConcentration') * scale,
                range: {
                    'min': Constants.Atmosphere.MIN_GREENHOUSE_GAS_CONCENTRATION * scale,
                    'max': Constants.Atmosphere.MAX_GREENHOUSE_GAS_CONCENTRATION * scale
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
         * Renders playback controls
         */
        renderPlaybackControls: function() {
            this.$el.append(playbackControlsHtml);

            this.$('.playback-speed').noUiSlider({
                start: 0.5,
                range: {
                    'min': 0.01,
                    'max': 1
                }
            });
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

        /**
         * The simulation changed its paused state.
         */
        pausedChanged: function() {
            if (this.simulation.get('paused'))
                this.$el.removeClass('playing');
            else
                this.$el.addClass('playing');
        },

        /**
         * Toggles between showing all photons and only
         *   some of the photons.
         */
        toggleAllPhotons: function(event) {
            if ($(event.target).is(':checked'))
                this.sceneView.showAllPhotons();
            else
                this.sceneView.showFewerPhotons();
        },

        /**
         * Adds a cloud to the sim.
         */
        addCloud: function() {
            this.simulation.addCloud();
        },

        /**
         * Removes a cloud from the sim.
         */
        removeCloud: function() {
            this.simulation.removeCloud();
        },

        /**
         * Sets the atmosphere to today's
         */
        setAtmosphereToday: function() {
            this.sceneView.showTodayScene();
        },

        /**
         * Sets the atmosphere to 1750's
         */
        setAtmosphere1750: function() {
            this.sceneView.show1750Scene();
        },

        /**
         * Sets the atmosphere to an ice age's
         */
        setAtmosphereIceAge: function() {
            this.sceneView.showIceAgeScene();
        },

        /**
         * Sets the atmosphere to custom
         */
        setAtmosphereCustom: function() {
            this.sceneView.showTodayScene();
        },

        /**
         * Changes the greenhouse gas concentration and makes
         *   sure we're on custom atmosphere mode.
         */
        changeConcentration: function(event) {
            var concentration = parseFloat($(event.target).val()) / Constants.Atmosphere.CONCENTRATION_RESOLUTION;
            this.simulation.atmosphere.set('greenhouseGasConcentration', concentration);
            this.sceneView.showTodayScene();
        }

    });

    return GreenhouseSimView;
});
