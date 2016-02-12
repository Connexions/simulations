define(function(require) {

    'use strict';

    var $        = require('jquery');
    var _        = require('underscore');
    var Backbone = require('backbone'); Backbone.$ = $;

    var PixiToImage        = require('common/v3/pixi/pixi-to-image');
    var ModelViewTransform = require('common/math/model-view-transform');
    var Vector2            = require('common/math/vector2');

    // CSS
    require('less!styles/legend');

    // HTML
    var templateHtml = require('text!templates/legend.html');

    /**
     * 
     */
    var LegendView = Backbone.View.extend({

        className: 'legend-view',

        template: _.template(templateHtml),

        initialize: function(options) {
            options = _.extend({
                scale: 1
            }, options);

            this.scale = options.scale;

            this.initMVT();
            this.initItems();
        },

        /**
         * Initializes the MVT to be used for rendering the items
         */
        initMVT: function() {
            this.mvt = new ModelViewTransform.createSinglePointScaleMapping(
                new Vector2(0, 0), 
                new Vector2(0, 0), 
                this.scale
            );
        },

        /**
         * Creates the views and labels that will be used to render the legend
         */
        initItems: function() {
            this.items = [];
        },

        /**
         * Renders content and canvas for heatmap
         */
        render: function() {
            var items = _.map(this.items, function(item) {
                return {
                    label: item.label,
                    img: PixiToImage.displayObjectToDataURI(item.displayObject)
                };
            });

            this.$el.html(this.template({ items: items }));

            return this;
        },

        getMVT: function() {
            return this.mvt;
        }

    });

    return LegendView;
});
