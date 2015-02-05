define(function (require, exports, module) {

    'use strict';

    var _ = require('underscore');

    var Simulation = require('common/simulation/simulation');
    var Vector2    = require('common/math/vector2');

    var Body    = require('models/body');
    var Presets = require('models/presets');

    /**
     * Constants
     */
    var Constants = require('constants');

    /**
     * Wraps the update function in 
     */
    var MSSSimulation = Simulation.extend({

        defaults: _.extend(Simulation.prototype.defaults, {
            numBodies: 2,
            speed: 7,
            time: 0
        }),
        
        initialize: function(attributes, options) {
            Simulation.prototype.initialize.apply(this, [attributes, options]);

            this.initComponents();

            this.on('change:speed', this.shiftSpeed);
            this.on('change:numBodies', this.updateNumBodies);
        },

        /**
         * Initializes the models used in the simulation
         */
        initComponents: function() {
            this.maxAccel = 0;

            this.timeStep = Constants.DEFAULT_TIME_STEP;
            this.numStepsPerFrame = Constants.DEFAULT_NUM_STEPS_PER_FRAME;

            this.velCM = new Vector2();

            this.updateNumBodies(this, this.get('numBodies'));

            this.integrationOn = false;
            this.steppingForward = false;
            this.resettingNumBodies = false;
            this.cmMotionRemoved = false;
            this.wantCMMotionRemoved = true;
            this.collisionJustOccurred = false;
        },

        reset: function() {

        },

        _update: function(time, deltaTime) {
            
        },

        /**
         * Steps forward N steps and then updates the bodies' final property values.
         */
        stepForwardNTimes: function(n) {
            for (var i = 0; i < n; i++)
                this.stepForwardVelocityVerlet();
            
            for (var j = 0; j < this.bodies.length; j++)
                this.bodies[j].updateAttributes();
        },

        stepForwardVelocityVerlet: function() {

        },

        setForcesAndAccels: function() {

        },

        setVelCM: function() {

        },

        addBody: function() {
            if (this.get('numBodies') === Constants.MAX_BODIES)
                return false;
            else
                this.set('numBodies', this.get('numBodies') + 1);
        },

        removeBody: function() {
            if (this.get('numBodies') <= Constants.MIN_BODIES)
                return false;
            else
                this.set('numBodies', this.get('numBodies') - 1);
        },

        shiftSpeed: function(simulation, speed) {
            if (speed > Constants.STEP_TIMES.length - 1 || speed < 0)
                throw 'Invalid speed setting';

            if (this.integrationOn) {
                this.stopIntegration();
                this.maxAccel = 0;
                this.timeStep = Constants.STEP_TIMES[speed];
                this.numStepsPerFrame = Constants.STEP_COUNTS_PER_FRAME[speed];
                this.startIntegration();
            }
            else {
                this.maxAccel = 0;
                this.timeStep = Constants.STEP_TIMES[speed];
                this.numStepsPerFrame = Constants.STEP_COUNTS_PER_FRAME[speed];
            }
        },

        updateNumBodies: function(simulation, numBodies) {
            this.stopIntegration();
            this.resettingNumBodies = true;

            this.initBodies();
            this.initForces();
            this.setForcesAndAccels();
            this.reset();
            this.setVelCM();

            this.resettingNumBodies = false;
        },

        initForces: function() {
            this.forces = [];
            for (var i = 0; i < Constants.MAX_BODIES; i++) {
                this.forces[i] = [];
                for (var j = 0; j < Constants.MAX_BODIES; j++)
                    this.forces[i][j] = new Vector2();
            }
        },

        initBodies: function() {
            // List of all the initial body models
            var bodies = [
                new Body({ mass: 200, x:   0, y: 0, vx: 0, vy:   -1 }),
                new Body({ mass:  10, x: 142, y: 0, vx: 0, vy:  140 }),
                new Body({ mass:   0, x: 166, y: 0, vx: 0, vy:   74 }),
                new Body({ mass:   0, x: -84, y: 0, vx: 0, vy: -133 })
            ];

            // Only take what we need
            this.bodies = [];
            for (var i = 0; i < this.get('numBodies'); i++)
                this.bodies.push(bodies[i]);

            // Make sure the views know we've got new bodies
            this.trigger('bodies-reset');
        },

        stopIntegration: function() {
            if (this.integrationOn && !this.steppingForward) {

            }
        },

        startIntegration: function() {

        },

        loadPreset: function(presetNumber) {

        }

    });

    return MSSSimulation;
});
