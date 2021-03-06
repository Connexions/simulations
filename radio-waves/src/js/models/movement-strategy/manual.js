define(function (require) {

    'use strict';

    var _      = require('underscore');
    var median = require('filters').median;

    var Vector2 = require('common/math/vector2');

    var MovementStrategy = require('models/movement-strategy');

    var HISTORY_LENGTH = 10;

    /**
     * This movement strategy does nothing automatically. It is
     * intended for use when the object in the model to which it
     * applies is to be moved with the mouse.
     */
    var ManualMovementStrategy = function(electron) {
        this.electron = electron;

        this.position = new Vector2(electron.get('position'));
        this.velocity = new Vector2(electron.get('velocity'));

        this.numHistoryEntries = 0;
        this.yPosHistory = [];
        this.yVelHistory = [];
        this.yAccHistory = [];

        this.initHistory();
    };

    /**
     * Instance functions/properties
     */
    _.extend(ManualMovementStrategy.prototype, MovementStrategy.prototype, {

        initHistory: function() {
            for (var i = 0; i < HISTORY_LENGTH; i++) {
                this.yPosHistory.push(0);
                this.yVelHistory.push(0);
                this.yAccHistory.push(0);
            }
        },

    	update: function(deltaTime) {
            if (this.position) {
                this.numHistoryEntries = Math.min(this.numHistoryEntries + 1, HISTORY_LENGTH);
                this.electron.setPosition(this.position);
                for (var i = this.yPosHistory.length - 1; i > 0; i--)
                    this.yPosHistory[i] = this.yPosHistory[i - 1];
                this.yPosHistory[0] = this.electron.get('position').y;
                this.computeKinetics();
            }
        },

        computeKinetics: function() {
            var i;
            var vSum = 0;
            var aSum = 0;

            // Compute velocities
            for (i = 0; i < this.numHistoryEntries - 1; i++) {
                var v = this.yPosHistory[i + 1] - this.yPosHistory[i];
                this.yVelHistory[i] = v;
                vSum += v;
            }
            this.velocityAvg = vSum / this.yVelHistory.length;
            this.velocity.x = this.velocityAvg; // Why the heck is it being stored in the x component???????

            // Compute accelerations
            this.yVelHistory = median(this.yVelHistory, 3);
            for (i = 0; i < this.numHistoryEntries - 2; i++) {
                var a = this.yVelHistory[i + 1] - this.yVelHistory[i];
                this.yAccHistory[i] = a;
                aSum += a;
            }
            this.accelerationAvg = aSum / this.yAccHistory.length;
        },

    	getVelocity: function() {
            return this.velocity;
        },

    	getAcceleration: function() {
            return this.accelerationAvg;
        },

    	getNextPosition: function(position, t) {
            return this.position ? this.position : position;
        },

        setPosition: function(position) {
            this.position.set(position);
        },

    	getMaxAcceleration: function() {
            return 0.1;
        }

    });

    return ManualMovementStrategy;
});