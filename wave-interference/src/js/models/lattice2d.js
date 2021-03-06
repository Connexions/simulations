

define(function(require) {

	'use strict';

	var _ = require('underscore');

	/**
	 * Modelled after PhET's Lattice2D, these objects are used to store values of
	 *   [pressures, water level, etc.] in a 2-D grid.
	 */
	var Lattice2D = function(options) {

		// Default values
		options = _.extend({
			initialValue: 0
		}, options);
		
		// Object properties
		this.data   = options.data || []; // The lattice point values
		this.width  = options.width || (options.data && options.data.length ? options.data[0].length : 60);
		this.height = options.height || (options.data ? options.data.length : 60);

		// For resetting
		this.initialValue = options.initialValue;

		// Set initial value of lattice points
		if (!options.data) {
			var row, x, y;
			for (x = 0; x < this.width; x++) {
				row = [];
				for (y = 0; y < this.height; y++) {
					row.push(options.initialValue);
				}
				this.data.push(row);
			}
		}
		
	};

	/*
	 * I'm declaring some variables that exist in this function's scope so that
	 *   1) These functions aren't pushing and popping off the stack every time
	 *        they're called (and this is important because these functions are
	 *        called very frequently) and
	 *   2) I don't want to make them public properties on the object.
	 *
	 *                                                               -- Patrick
	 */

	var sum,
	    count,
	    i,
	    j,
	    clone,
	    row;

	_.extend(Lattice2D.prototype, {

		/**
		 * Finds the average value in a square sample space centered on the
		 *   specified (x,y) cooridnate. Sample size here is more like a 
		 *   radius in that it's half [- 1] of the square's side length.
		 */
		avg: function(x, y, sampleSize) {
			sum = 0;
			count = 0;

			for (i = x - sampleSize; i <= x + sampleSize; i++) {
				for (j = y - sampleSize; j <= y + sampleSize; j++) {
					if (this.contains(i, j)) {
						sum += this.data[i][j];
						count++;
					}
				}
			}
			return sum / count;
		},

		/**
		 * This is my version of PhET's "copy" function, but their wave
		 *   simulation model was calling this every step, creating a
		 *   whole bunch of objects and arrays to be garbage collected,
		 *   so I'm only going to use this like three times and then
		 *   reuse them with my "copy" function down below.
		 */
		clone: function() {
			clone = this._deepCloneArray(this.data);

			return new Lattice2D({
				width:  this.width,
				height: this.height,
				data:   clone
			});
		},

		/**
		 * Used internally in a couple places
		 */
		_deepCloneArray: function(src) {
			clone = [];
			for (i = 0; i < src.length; i++) {
				row = [];
				for (j = 0; j < src[i].length; j++) {
					row.push(src[i][j]);
				}
				clone.push(row);
			}
			return clone;
		},

		/**
		 * This function copies the data from a source Lattice2D into
		 *   this Lattice2D. Forces it to change size if the source
		 *   is a different size.
		 */
		copy: function(source) {
			if (source.height != this.height || source.width != this.height) {
				/*
				 * If it changed size, we can't get around recreating
				 *   the whole array.
				 */
				this.width  = source.width;
				this.height = source.height;
				this.data   = this._deepCloneArray(source.data);
			}
			else {
				for (i = 0; i < this.width; i++) {
					for (j = 0; j < this.height; j++) {
						this.data[i][j] = source.data[i][j];
					}
				}
			}
		},

		/**
		 * Copies just a specified area from a source lattice to a 
		 *   specified area in this one.  This function has a lot
		 *   of parameters, and while it would be cleaner to use
		 *   an options object, I want to minimize load on the
		 *   garbage collector in this function because it is used 
		 *   multiple times each frame.
		 */
		copyArea: function(source, width, height, srcOffsetX, srcOffsetY, dstOffsetX, dstOffsetY) {
			for (i = 0; i < width; i++) {
				for (j = 0; j < height; j++) {
					this.data[i + dstOffsetX][j + dstOffsetY] = source.data[i + srcOffsetX][j + srcOffsetY];
				}
			}
		},

		/**
		 * Resets all values to a specific one.  If an initial 
		 *   value was originally specified, it uses that as a
		 *   fallback.
		 */
		reset: function(initialValue) {
			if (initialValue === undefined) {
				if (this.initialValue === undefined)
					initialValue = 0;
				else
					initialValue = this.initialValue;
			}
				
			for (i = 0; i < this.width; i++) {
				for (j = 0; j < this.height; j++) {
					this.data[i][j] = initialValue;
				}
			}
		},

		/**
		 * Gets the value of a specific lattice point
		 */
		getValue: function(x, y) {
			return this.data[x][y];
		},

		/**
		 * Determines if a specific xy coordinate is within bounds
		 */
		contains: function(x, y) {
			return (x >= 0 && x < this.width && y >= 0 && y < this.height);
		}

	});

	return Lattice2D;
});