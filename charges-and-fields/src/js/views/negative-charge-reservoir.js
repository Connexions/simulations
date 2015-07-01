define(function(require) {

    'use strict';

    var _ = require('underscore');

    var Charge = require('models/charge');

    var ObjectReservoir    = require('views/object-reservoir');
    var NegativeChargeView = require('views/negative-charge');

    var Constants = require('constants');

    /**
     * The negative-charge reservoir
     */
    var NegativeChargeReservoir = ObjectReservoir.extend({

        initialize: function(options) {
            options = _.extend({
                labelText: '1 nC',
                labelFont: 'bold 24px Helvetica Neue'
            }, options);

            ObjectReservoir.prototype.initialize.apply(this, [options]);
        },

        /**
         * Creates a new object (of whatever this reservoir contains)
         *   and returns it so it can be added to the scene as a
         *   dummy object.  Note the dummy object will not be added
         *   to the simulation until it gets turned into a real
         *   object after the user drops it.
         */
        createDummyObject: function() {
            var model = new Charge();
            var view = new NegativeChargeView({
                model: model,
                mvt: this.mvt,
                interactive: false
            });
            return view;
        },

        /**
         * Creates the actual object based off of the position of the
         *   dummy object and adds it to the simulation/scene.
         */
        createAndAddObject: function(dummyObject) {
            var charge = new Charge({
                position: dummyObject.get('position'),
                q: Constants.NEGATIVE_CHARGE_VALUE
            });
            this.simulation.addCharge(charge);
        }

    });


    return NegativeChargeReservoir;
});