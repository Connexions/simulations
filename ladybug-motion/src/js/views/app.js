define(function(require) {
    
    'use strict';

    var PixiAppView = require('common/v3/pixi/view/app');

    var LadybugMotionSimView = require('views/sim');

    var Assets = require('assets');

    require('less!styles/font-awesome');

    var LadybugMotionAppView = PixiAppView.extend({

        assets: Assets.getAssetList(),

        simViewConstructors: [
            LadybugMotionSimView
        ]

    });

    return LadybugMotionAppView;
});
