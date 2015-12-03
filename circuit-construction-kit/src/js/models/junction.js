define(function (require) {

    'use strict';

    var _ = require('underscore');

    var PositionableObject = require('common/models/positionable-object');

    var silent = { silent: true };

    /**
     * A junction in the circuit connecting two branches (like the nodes in a graph).
     */
    var Junction = PositionableObject.extend({

        defaults: _.extend({}, PositionableObject.prototype.defaults, {
            selected: false,
            // Voltage relative to reference node. To be used in computing
            //   potential drops, to avoid graph traversal.
            voltage: 0
        }),

        initialize: function(attributes, options) {
            PositionableObject.prototype.initialize.apply(this, arguments);
        },

        translateSilent: function(x, y) {
            this.translate(x, y, silent);
        },

        getDistance: function(junction) {
            return this.get('position').distance(junction.get('position'));
        }

    });

    return Junction;
});