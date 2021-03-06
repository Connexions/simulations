define(function (require) {

    'use strict';

    var _ = require('underscore');

    var Block = require('models/element/block');

    /**
     * Constants
     */
    var Constants = require('constants');
    var EnergyContainerCategory = Constants.EnergyContainerCategory;

    /**
     * 
     */
    var Brick = Block.extend({

        defaults: _.extend({}, Block.prototype.defaults, {
            energyContainerCategory: EnergyContainerCategory.BRICK,

            density:      Constants.Brick.DENSITY,
            specificHeat: Constants.Brick.SPECIFIC_HEAT
        })

    }, Constants.Brick);

    return Brick;
});
