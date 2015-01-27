define(function (require) {

    'use strict';

    var Backbone = require('backbone');

    var Constants = require('constants');
    var GRAVITY  = Constants.GRAVITATIONAL_ACCELERATION;
    var GROUND_Y = Constants.GROUND_Y;

    var Trajectory = Backbone.Model.extend({

        defaults: {
            projectile: null, // The projectile instance in motion with this trajectory
            inMotion: false,  // Whether the projectile is still in motion
            range: 0,         // Maximum range of trajectory so far
            height: 0,        // Maximum height of trajectory so far
            time: 0,          // Time in flight (s)
            finished: false,  // Whether the trajectory has started and completed its course

            initialSpeed: 0,
            initialAngle: 0,

            // Simulation variables
            airResistanceEnabled: false,
            altitude: 0
        },

        initialize: function(attributes, options) {
            this.vInit = this.get('initialSpeed');       // Initial speed in m/s
            this.theta = this.get('initialAngle');       // Firing angle in radians
            this.x = 0;                                  // Current position; start at origin
            this.y = 0;                    
            this.lastX = 0;                              // Position at previous time step
            this.lastY = 0;                    
            this.v = this.vInit;                         // Speed of projectile
            this.vX = this.vInit * Math.cos(this.theta); // X- and y-components of velocity
            this.vY = this.vInit * Math.sin(this.theta);
            this.aX = 0;                                 // X-component of acceleration
            this.aY = -GRAVITY;                          // Y-component of acceleration
console.log(this.vInit);
            this.on('change:altitude', this.recalculateAirResistanceTerm);
            this.listenTo(this.get('projectile'), 'change:mass change:area change:dragCoefficient', this.recalculateAirResistanceTerm);

            this.recalculateAirResistanceTerm();
        },

        update: function(simulationTime, deltaTime) {
            if (!this.get('inMotion'))
                return;

            var t = this.get('time');
            var dt = deltaTime;

            this.lastX = this.x;
            this.lastY = this.y;

            if (!this.get('airResistanceEnabled')) {
                t += dt;
                this.x = this.x + this.vX * dt;
                this.y = this.y + this.vY * dt - (0.5) * GRAVITY * dt * dt;
                this.vY = this.vY - GRAVITY * dt;  //vX is constant 
                this.v = Math.sqrt(this.vX * this.vX + this.vY * this.vY);

            }
            else { 
                // If air resistance is so large that results are unphysical, then reduce time step
                if (this.B * this.v * dt > 0.25)
                    dt /= (B * this.v * dt / 0.25);
                
                t += dt;
                this.v = Math.sqrt(this.vX * this.vX + this.vY * this.vY);
                this.aX = -this.B * this.v * this.vX;
                this.aY = -GRAVITY - this.B * this.v * this.vY;
                
                this.x = this.x + this.vX * dt + (0.5) * this.aX * dt * dt;
                this.y = this.y + this.vY * dt + (0.5) * this.aY * dt * dt;
                this.vX = this.vX + this.aX * dt;
                this.vY = this.vY + this.aY * dt;

            }
            
            // See if projectile is below ground
            if (this.y < GROUND_Y) { 
                // Backtrack to moment when projectile hit ground
                var dy = this.y - GROUND_Y;
                var vYGround = -Math.sqrt(this.vY * this.vY - 2 * this.aY * dy);   //vY at ground level

                // Calculate time interval from ground level to y_final
                var delT = (this.vY - vYGround) / this.aY;

                // Reset x_final and y_final
                this.x = this.x + this.vX * (-delT) + 0.5 * this.aX * delT * delT;
                this.y = GROUND_Y;
                t -= delT;

                this.set('finished', true);
                this.stop();
            }
            
            //console.log(this.x, this.y);
            this.get('projectile').set('x', this.x);
            this.get('projectile').set('y', this.y);
            this.set('time', t);
        },

        start: function() {
            this.set('inMotion', true);
        },

        stop: function() {
            this.set('inMotion', false);
            this.trigger('finish');
        },

        recalculateAirResistanceTerm: function() {
            var rho = 1.6 * Math.exp(-this.get('altitude') / 8400);
            var m = this.get('projectile').get('mass');
            var A = this.get('projectile').get('area');
            var C = this.get('projectile').get('dragCoefficient');
            var B = (0.5) * C * A * rho / m;
            this.B = B;
        }

    });

    return Trajectory;
});
