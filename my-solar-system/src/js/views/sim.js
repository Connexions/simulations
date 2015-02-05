define(function (require) {

    'use strict';

    var $ = require('jquery');
    var _ = require('underscore');

    var SimView = require('common/app/sim');

    var Presets       = require('models/presets');
    var MSSSimulation = require('models/simulation');
    var MSSSceneView  = require('views/scene');

    var Constants = require('constants');

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
    var helpDialogHtml = require('text!templates/help-dialog.html');

    /**
     * This is the umbrella view for everything in a simulation tab.
     *   It will be extended by both the Intro module and the Charts
     *   and contains all the common functionality between the two.
     */
    var MSSSimView = SimView.extend({

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
            'click .remove-body-btn': 'removeBody',
            'click .add-body-btn':    'addBody',
            'keyup #body-settings-table input': 'bodySettingsInputKeyup'
        },

        /**
         * Inits simulation, views, and variables.
         *
         * @params options
         */
        initialize: function(options) {
            options = _.extend({
                title: 'My Solar System',
                name: 'my-solar-system',
            }, options);

            SimView.prototype.initialize.apply(this, [options]);

            this.initSceneView();

            this.listenTo(this.simulation, 'change:numBodies', this.updateBodyInputs);
        },

        /**
         * Initializes the Simulation.
         */
        initSimulation: function() {
            this.simulation = new MSSSimulation();
        },

        /**
         * Initializes the SceneView.
         */
        initSceneView: function() {
            this.sceneView = new MSSSceneView({
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
            this.renderHelpDialog();

            this.updateBodyInputs(this.simulation, this.simulation.get('numBodies'));

            return this;
        },

        /**
         * Renders page content. Should be overriden by child classes
         */
        renderScaffolding: function() {
            var data = {
                Constants: Constants,
                simulation: this.simulation,
                presetNames: _.keys(Presets)
            };
            this.$el.html(this.template(data));

            this.$('select').selectpicker();

            this.$('.playback-speed').noUiSlider({
                start: 1,
                range: {
                    'min': [ 0.2 ],
                    '50%': [ 1 ],
                    'max': [ 4 ]
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
         * Renders the help dialog html
         */
        renderHelpDialog: function() {
            this.$('.help-dialog-placeholder').replaceWith(helpDialogHtml);
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

        removeBody: function() {
            this.simulation.removeBody();
            this.$('#preset').val('');
        },

        addBody: function() {
            this.simulation.addBody();
            this.$('#preset').val('');
        },

        updateBodyInputs: function(simulation, numBodies) {
            var $rows = this.$('#body-settings-table tbody tr');

            $rows.each(function(index, row) {
                // Show/hide body input rows
                if (index + 1 <= numBodies)
                    $(row).show();
                else
                    $(row).hide();

                // Hide minus buttons
                $(row).find('.remove-body-btn').hide();
            });

            // Show last minus button if appropriate
            if (numBodies > Constants.MIN_BODIES)
                $rows.eq(numBodies - 1).find('.remove-body-btn').show();

            // Show/hide plus button as appropriate
            if (numBodies < Constants.MAX_BODIES)
                $rows.last().show();
            else
                $rows.last().hide();
        },

        bodySettingsInputKeyup: function(event) {
            var code = event.keyCode || event.which;
            if (code == 13) { // ENTER pressed
                var colIndex = $(event.target).closest('td').index();
                var rowIndex = $(event.target).closest('tr').index();

                if (rowIndex + 1 <= Constants.MAX_BODIES) {
                    $(event.target)
                        .closest('tr')
                        .next()
                        .children()
                        .eq(colIndex)
                        .find('input')
                            .focus();
                }
            }
        }

    });

    return MSSSimView;
});
