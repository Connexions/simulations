define(function (require) {

    'use strict';

    var $ = require('jquery');
    var _ = require('underscore');

    var SimView = require('common/v3/app/sim');

    var CCKSimulation = require('models/simulation');
    var CCKSceneView  = require('views/scene');

    var Constants = require('constants');

    var Assets = require('assets');

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
    var simHtml              = require('text!templates/sim.html');
    var playbackControlsHtml = require('text!templates/playback-controls.html');

    /**
     * 
     */
    var CCKSimView = SimView.extend({

        /**
         * Root element properties
         */
        tagName:   'section',
        className: 'sim-view',

        /**
         * Template for rendering the basic scaffolding
         */
        template:                      _.template(simHtml),
        playbackControlsPanelTemplate: _.template(playbackControlsHtml),

        /**
         * Dom event listeners
         */
        events: {
            'click .play-btn'   : 'play',
            'click .pause-btn'  : 'pause',
            'click .step-btn'   : 'step',
            'click .reset-btn'  : 'reset'
        },

        /**
         * Inits simulation, views, and variables.
         *
         * @params options
         */
        initialize: function(options) {
            options = _.extend({
                title: 'Circuit Construction Kit',
                name: 'cck',
                link: 'circuit-construction-kit-ac'
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
            this.simulation = new CCKSimulation();
        },

        /**
         * Initializes the SceneView.
         */
        initSceneView: function() {
            this.sceneView = new CCKSceneView({
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
                simulation: this.simulation
            };
            this.$el.html(this.template(data));
            this.$('select').selectpicker();
        },

        /**
         * Renders the playback controls at the bottom of the screen
         */
        renderPlaybackControls: function() {
            this.$playbackControls = $(this.playbackControlsPanelTemplate({ unique: this.cid }));

            this.$el.append(this.$playbackControls);
        },

        /**
         * Renders the scene view
         */
        renderSceneView: function() {
            this.sceneView.render();
            this.$('.scene-view-placeholder').replaceWith(this.sceneView.el);
            this.$el.append(this.sceneView.$ui);
        },

        /**
         * Called after every component on the page has rendered to make sure
         *   things like widths and heights and offsets are correct.
         */
        postRender: function() {
            this.sceneView.postRender();
        },

        resetSimulation: function() {
            // Save whether or not it was paused when we reset
            var wasPaused = this.simulation.get('paused');

            // Set pause the updater and reset everything
            this.updater.pause();
            this.updater.reset();
            this.resetComponents();

            // Resume normal function
            this.updater.play();
            this.play();
            this.pausedChanged();
        },

        /**
         * Resets all the components of the view.
         */
        resetComponents: function() {
            SimView.prototype.resetComponents.apply(this);
            
            this.sceneView.reset();
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
        }

    });

    return CCKSimView;
});