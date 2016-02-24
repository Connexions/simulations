define(function (require, exports, module) {

    'use strict';

    var _ = require('underscore');

    var Simulation = require('common/simulation/simulation');

    var Circuit = require('models/circuit');
    var BeamControl = require('models/beamcontrol');

    /**
     * Constants
     */
    var Constants = require('constants');

    /**
     * Wraps the update function in 
     */
    var PEffectSimulation = Simulation.extend({

        defaults: _.extend(Simulation.prototype.defaults, {
            circuitIsPositive: true
        }),
        
        initialize: function(attributes, options) {
            Simulation.prototype.initialize.apply(this, [attributes, options]);

        },

        /**
         * Initializes the models used in the simulation
         */
        initComponents: function() {
            var circuit = new Circuit({
                voltage: 0
            });
            this.circuit = circuit;

            var beamControl = new BeamControl({
                wavelength: 400,
                intensity: 100
            });
            this.beamControl = beamControl;
        },

        _update: function(time, deltaTime) {
            
        }

    });

    return PEffectSimulation;
});