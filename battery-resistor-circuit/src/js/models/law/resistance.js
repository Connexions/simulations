define(function (require) {

    'use strict';

    var _ = require('underscore');

    var Law                 = require('models/law');
    var OscillatePropagator = require('models/propagator/oscillate');
    var Core                = require('models/free-particle/core');

    /**
     * 
     */
    var Resistance = function(start, end, numCores, wirePatch, amplitude, freq, decay, system) {
        this.system = system;
        this.decay = decay;
        this.freq = freq;
        this.amplitude = amplitude;
        this.wirePatch = wirePatch;
        this.start = start;
        this.end = end;
        this.numCores = numCores;
        this.cores = [];
    };

    /**
     * Instance functions/properties
     */
    _.extend(Resistance.prototype, Law.prototype, {
        
        /**
         * Note that this only gets called when the number of cores changes, because
         *   we remove it from the system at the end of this function and only add
         *   it back when the number of cores changes.
         */
        update: function(deltaTime, system) {
            this.removeCores();
            this.layoutCores();
            this.system.removeLaw(this);
        },

        coreCountChanged: function(value) {
            if (value !== this.numCores) {
                this.numCores = value;
                this.system.addLaw(this); // Register the update to happen synchronously
            }
        },

        removeCores: function() {
            for (var i = this.cores.length - 1; i >= 0; i--) {
                var particle = this.cores[i];
                this.system.removeParticle(particle);
                this.cores.splice(i, 1);
            }
        },

        layoutCores: function() {
            var coreSpacing = this.getCoreSpacing();
            for (var i = 0; i < this.numCores; i++) {
                var scalarPosition = start + (coreSpacing * i) + 15;
                if (this.numCores === 1)
                    scalarPosition = (end - start) / 2 + start;
                
                var x0 = this.wirePatch.getPosition(scalarPosition);
                var axis = new Vector2(1, 0);
                
                var oscillator = new OscillatePropagator(x0, 0 /* instead of this.amplitude */, this.freq, this.decay, axis);
                var core = new Core({
                    position: x0,
                    origin: x0, 
                    scalarPosition: scalarPosition,
                    charge: 0,
                    propagator: oscillator
                });

                this.system.addParticle(core);
                this.cores.push(core);
            }
        },

        getCoreSpacing: function() {
            if (this.numCores <= 1)
                return 0;
            
            var coreSpan = this.end - this.start;
            var coreSpacing = coreSpan / (this.numCores - 1);

            return coreSpacing;
        }

    });

    return Resistance;
});