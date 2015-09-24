define(function (require) {

    'use strict';

    var _ = require('underscore');

    var Law = require('models/law');

    /**
     * Class for holding info about the wire system and updating particles
     */
    var WireSystem = function(propagator) {
        this.particles = [];
    };

    /**
     * Instance functions/properties
     */
    _.extend(WireSystem.prototype, Law.prototype, {

        update: function(deltaTime, system) {
            for (var i = 0; i < this.particles.length; i++) {
                this.particles[i].propagate(deltaTime);
            }
        }

    });

    return WireSystem;
});