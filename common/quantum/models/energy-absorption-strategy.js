define(function (require) {

    'use strict';

    var _        = require('underscore');
    var Backbone = require('backbone');

    var PhysicsUtil    = require('common/quantum/models/physics-util');
    var quadraticRoots = require('common/math/quadratic-roots');

    var QuantumConfig = require('../config');
    
    /**
     * Strategy for atoms absorbing energy
     */
    var EnergyAbsorptionStrategy = function() {};

    _.extend(EnergyAbsorptionStrategy.prototype, {

        collideWithElectron: function(atom, electron) {}

    });

    _.extend(EnergyAbsorptionStrategy, {

        _roots: [],

        /**
         * Returns the kinetic energy of an electron at the time it collides with an atom. It does this
         *   by computing the actual time of collision, then the speed of the electron at that time.
         */
        getElectronEnergyAtCollision: function(atom,  electron) {
            var energy = 0;
            var prevDist = electron.getPreviousPosition().distance(atom.getPosition()) - electron.get('radius') - atom.get('radius');
            var collisionDist = prevDist;

            var a = electron.getAcceleration().length() / 2;
            var b = electron.getPreviousVelocity().length();

            var c = -collisionDist;
            var roots = quadraticRoots(a, b, c, this._roots);
            var t = roots[0] >= 0 ? roots[0] : roots[1];
            if (t < 0 || Number.isNaN(t) || !Number.isFinite(t)) {
                energy = 0;
            }
            else {
                var v = electron.getPreviousVelocity().length() + electron.getAcceleration().length() * t;
                energy = QuantumConfig.PIXELS_PER_NM * QuantumConfig.PIXELS_PER_NM * v * v * electron.get('mass') / 2 * PhysicsUtil.EV_PER_JOULE;
            }
            return energy;
        }

    });

    EnergyAbsorptionStrategy.extend = Backbone.Model.extend;


    return EnergyAbsorptionStrategy;
});