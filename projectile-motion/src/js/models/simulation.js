define(function (require, exports, module) {

    'use strict';

    var _ = require('underscore');

    var Simulation = require('common/simulation/simulation');

    var Cannon     = require('models/cannon');
    var Projectile = require('models/projectile');
    var Trajectory = require('models/trajectory');
    var Target     = require('models/target');
    var David      = require('models/david');

    /**
     * Constants
     */
    var Constants = require('constants');

    /**
     * Wraps the update function in 
     */
    var ProjectileMotionSimulation = Simulation.extend({

        defaults: _.extend(Simulation.prototype.defaults, {
            initialSpeed: 18, // m/s
            airResistanceEnabled: false,
            altitude: 0,
            currentProjectile: null, // Current projectile instance that is set for launch or is in motion
            currentTrajectory: null  // Current trajectory instance--not created until cannon is fired
        }),
        
        initialize: function(attributes, options) {
            Simulation.prototype.initialize.apply(this, [attributes, options]);

            /* We always keep a projectile object that sits and waits to be launched
             *   so that the user can modify the projectile's properties.
             */   
            this.set('currentProjectile', new Projectile());

            this.on('change:altitude', function() {
                if (this.get('currentTrajectory'))
                    this.get('currentTrajectory').set('altitude', this.get('altitude'));
            });
            this.on('change:airResistanceEnabled', function() {
                if (this.get('currentTrajectory'))
                    this.get('currentTrajectory').set('airResistanceEnabled', this.get('airResistanceEnabled'));
            });
        },

        /**
         * Initializes the models used in the simulation
         */
        initComponents: function() {
            var cannon = new Cannon({
                x:     Constants.Cannon.START_X,
                y:     Constants.Cannon.START_Y,
                angle: Constants.Cannon.START_ANGLE
            });
            this.cannon = cannon;

            this.target = new Target();
            this.david  = new David();

            this.collisionObjects = [
                this.target,
                this.david
            ];
        },

        _update: function(time, deltaTime) {
            if (this.get('currentTrajectory'))
                this.get('currentTrajectory').update(time, deltaTime);
        },

        fireCannon: function() {
            // Abort any currently running trajectories
            if (this.get('currentTrajectory'))
                this.get('currentTrajectory').abort();

            var trajectory = new Trajectory({
                projectile: this.get('currentProjectile'),
                initialSpeed: this.get('initialSpeed'),
                initialAngle: -this.cannon.firingAngle(),
                initialX: this.cannon.firingX(),
                initialY: this.cannon.firingY(),
                airResistanceEnabled: this.get('airResistanceEnabled'),
                altitude: this.get('altitude'),
                collisionObjects: this.collisionObjects
            });
            this.set('currentTrajectory', trajectory);

            this.listenTo(trajectory, 'finish', function() {
                // Stop listening and forget trajectory
                this.stopListening(trajectory);
                this.set('currentTrajectory', null);

                // Make a new projectile and ready it for launch
                var newProjectile = this.get('currentProjectile').clone();
                newProjectile.reset();
                this.set('currentProjectile', newProjectile);
            });

            this.trigger('projectile-launched', this.get('currentProjectile'));

            trajectory.start();
            this.cannon.fire();
        }

    });

    return ProjectileMotionSimulation;
});
