define(function (require) {

    'use strict';

    var Backbone = require('backbone');

    var Vector2 = require('common/math/vector2');
    var Pool    = require('object-pool');

    var Constants = require('constants');

    /**
     * Because Backbone models only see shallow changes, we need to
     *   create new objects when assigning a new value to an attribute
     *   if we want the event system to pick up the change.  Creating
     *   and destroying objects is expensive in a real-time system,
     *   especially when it's happening each frame on a lot of objects,
     *   so we're going to use an object pool to reuse old objects
     *   instead of just throwing them away.
     */
    var vectorPool = Pool({
        init: function() {
            return new Vector2();
        },
        enable: function(vector) {
            vector.set(0, 0);
        }
    });

    /**
     * 
     */
    var WaveSensor = Backbone.Model.extend({

        defaults: {
            enabled: false,
            bodyPosition: null,
            probe1Position: null,
            probe2Position: null
        },
        
        initialize: function(attributes, options) {
            // Create vectors
            this.set('bodyPosition',   vectorPool.create().set(this.get('bodyPosition')));
            this.set('probe1Position', vectorPool.create().set(this.get('probe1Position')));
            this.set('probe2Position', vectorPool.create().set(this.get('probe2Position')));

            this.initSeries();

            this.maxSeriesLength = 200;
        },

        initSeries: function() {
            this.series = [{
                values: [],
                times: []
            },{
                values: [],
                times: []
            }];
        },

        addProbe1Sample: function(sample, time) {
            this.addSampleToSeries(sample, time, this.series[0]);
        },

        addProbe2Sample: function(sample, time) {
            this.addSampleToSeries(sample, time, this.series[1]);
        },

        addSampleToSeries: function(sample, time, series) {
            series.values.unshift(sample);
            series.times.unshift(time);

            // Keep it to a manageable size
            if (series.values.length > this.maxSeriesLength) {
                series.values.splice(series.values.length - 1, 1);
                series.times.splice(series.times.length - 1, 1);
            }
        },

        clearSamples: function() {
            this.initSeries();
        },

        getProbe1Series: function() {
            return this.series[0];
        },

        getProbe2Series: function() {
            return this.series[1];
        },

        setBodyPosition: function(x, y) {
            var oldBodyPosition = this.get('bodyPosition');
            
            if (x instanceof Vector2)
                this.set('bodyPosition', vectorPool.create().set(x));
            else
                this.set('bodyPosition', vectorPool.create().set(x, y));

            // Only remove it at the end or we might be given the same one
            vectorPool.remove(oldBodyPosition);
        },

        translateBody: function(x, y) {
            var oldBodyPosition = this.get('bodyPosition');
            var newBodyPosition = vectorPool.create().set(this.get('bodyPosition'));

            if (x instanceof Vector2)
                this.set('bodyPosition', newBodyPosition.add(x));
            else
                this.set('bodyPosition', newBodyPosition.add(x, y));
            
            // Only remove it at the end or we might be given the same one
            vectorPool.remove(oldBodyPosition);
        },

        setProbe1Position: function(x, y) {
            var oldProbePosition = this.get('probe1Position');
            
            if (x instanceof Vector2)
                this.set('probe1Position', vectorPool.create().set(x));
            else
                this.set('probe1Position', vectorPool.create().set(x, y));

            // Only remove it at the end or we might be given the same one
            vectorPool.remove(oldProbePosition);
        },

        translateProbe1: function(x, y) {
            var oldProbe1Position = this.get('probe1Position');
            var newProbe1Position = vectorPool.create().set(this.get('probe1Position'));

            if (x instanceof Vector2)
                this.set('probe1Position', newProbe1Position.add(x));
            else
                this.set('probe1Position', newProbe1Position.add(x, y));
            
            // Only remove it at the end or we might be given the same one
            vectorPool.remove(oldProbe1Position);
        },

        setProbe2Position: function(x, y) {
            var oldProbePosition = this.get('probe2Position');
            
            if (x instanceof Vector2)
                this.set('probe2Position', vectorPool.create().set(x));
            else
                this.set('probe2Position', vectorPool.create().set(x, y));

            // Only remove it at the end or we might be given the same one
            vectorPool.remove(oldProbePosition);
        },

        translateProbe2: function(x, y) {
            var oldProbe2Position = this.get('probe2Position');
            var newProbe2Position = vectorPool.create().set(this.get('probe2Position'));

            if (x instanceof Vector2)
                this.set('probe2Position', newProbe2Position.add(x));
            else
                this.set('probe2Position', newProbe2Position.add(x, y));
            
            // Only remove it at the end or we might be given the same one
            vectorPool.remove(oldProbe2Position);
        },

        /**
         * We need to make sure we release the model's vector
         *   back into the vector pool or we get memory leaks,
         *   so destroy must be called on all bodyPositionable
         *   objects when we're done with them.
         */
        destroy: function(options) {
            this.trigger('destroy', this, this.collection, options);
            vectorPool.remove(this.get('bodyPosition'));
            vectorPool.remove(this.get('probe1Position'));
            vectorPool.remove(this.get('probe2Position'));
        }

    }, Constants.WaveSensor);

    return WaveSensor;
});
