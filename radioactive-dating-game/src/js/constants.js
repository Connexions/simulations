define(function (require) {

    'use strict';

    var NucleusType = require('models/nucleus-type');

    var Constants = require('nuclear-physics/constants'); 

    Constants.FRAME_RATE = 25;
    Constants.DELTA_TIME_PER_FRAME = 40;

    // Preferred distance between nucleus centers when placing them on the canvas.
    Constants.PREFERRED_INTER_NUCLEUS_DISTANCE = 15;  // In femtometers.
    // Minimum distance between the center of a nucleus and a wall or other obstacle.
    Constants.MIN_NUCLEUS_TO_OBSTACLE_DISTANCE = 10;  // In femtometers.


    /*************************************************************************
     **                                                                     **
     **                        HALF-LIFE SIMULATION                         **
     **                                                                     **
     *************************************************************************/

    var HalfLifeSimulation = {};

    HalfLifeSimulation.MAX_NUCLEI = 99;
    HalfLifeSimulation.DEFAULT_NUCLEUS_TYPE = NucleusType.CARBON_14;
    
    // Size and position of the bucket of nuclei which the user uses to add
    //   nuclei to the simulation.
    HalfLifeSimulation.BUCKET_ORIGIN_X = 40;
    HalfLifeSimulation.BUCKET_ORIGIN_Y = 40;
    HalfLifeSimulation.BUCKET_WIDTH = 45;
    HalfLifeSimulation.BUCKET_HEIGHT = HalfLifeSimulation.BUCKET_WIDTH * 0.65;

    Constants.HalfLifeSimulation = HalfLifeSimulation;


    /*************************************************************************
     **                                                                     **
     **                        HALF-LIFE SIMULATION                         **
     **                                                                     **
     *************************************************************************/

    var DecayRatesSimulation = {};

    DecayRatesSimulation.MAX_NUCLEI = 1000;
    DecayRatesSimulation.DEFAULT_NUCLEUS_TYPE = NucleusType.CARBON_14;
    
    DecayRatesSimulation.PLACEMENT_LOCATION_SEARCH_COUNT = 100;
    DecayRatesSimulation.DEFAULT_MIN_INTER_NUCLEUS_DISTANCE = 10;

    Constants.DecayRatesSimulation = DecayRatesSimulation;


    /*************************************************************************
     **                                                                     **
     **                       DECAY RATES GRAPH VIEW                        **
     **                                                                     **
     *************************************************************************/

    var DecayRatesGraphView = {};

    DecayRatesGraphView.AXIS_LABEL_FONT    = Constants.NucleusDecayChart.AXIS_LABEL_FONT;
    DecayRatesGraphView.AXIS_LABEL_COLOR   = Constants.NucleusDecayChart.AXIS_LABEL_COLOR;
    DecayRatesGraphView.AXIS_LINE_WIDTH    = Constants.NucleusDecayChart.AXIS_LINE_WIDTH;
    DecayRatesGraphView.AXIS_LINE_COLOR    = Constants.NucleusDecayChart.AXIS_LINE_COLOR;
    DecayRatesGraphView.BORDER_COLOR       = Constants.NucleusDecayChart.AXIS_LINE_COLOR;
    DecayRatesGraphView.BORDER_WIDTH       = 1;
    DecayRatesGraphView.BORDER_ALPHA       = 0.7;
    DecayRatesGraphView.Y_VALUE_LINE_COLOR = Constants.NucleusDecayChart.AXIS_LINE_COLOR;
    DecayRatesGraphView.Y_VALUE_LINE_WIDTH = 1;
    DecayRatesGraphView.Y_VALUE_LINE_ALPHA = 0.1;
    DecayRatesGraphView.TICK_MARK_LENGTH   = Constants.NucleusDecayChart.TICK_MARK_LENGTH;
    DecayRatesGraphView.TICK_MARK_WIDTH    = Constants.NucleusDecayChart.TICK_MARK_WIDTH;
    DecayRatesGraphView.TICK_MARK_COLOR    = Constants.NucleusDecayChart.TICK_MARK_COLOR;
    DecayRatesGraphView.SMALL_LABEL_FONT   = Constants.NucleusDecayChart.SMALL_LABEL_FONT;
    DecayRatesGraphView.LARGE_LABEL_FONT   = Constants.NucleusDecayChart.LARGE_LABEL_FONT;
    DecayRatesGraphView.ISOTOPE_FONT_SIZE  = Constants.NucleusDecayChart.ISOTOPE_FONT_SIZE;

    DecayRatesGraphView.HALF_LIFE_LINE_WIDTH  = Constants.NucleusDecayChart.HALF_LIFE_LINE_WIDTH;
    DecayRatesGraphView.HALF_LIFE_LINE_DASHES = Constants.NucleusDecayChart.HALF_LIFE_LINE_DASHES;
    DecayRatesGraphView.HALF_LIFE_LINE_COLOR  = Constants.NucleusDecayChart.HALF_LIFE_LINE_COLOR;
    DecayRatesGraphView.HALF_LIFE_LINE_ALPHA  = Constants.NucleusDecayChart.HALF_LIFE_LINE_ALPHA;

    DecayRatesGraphView.DECAY_LABEL_COLOR = Constants.NucleusDecayChart.DECAY_LABEL_COLOR
    DecayRatesGraphView.DECAY_LABEL_FONT  = Constants.NucleusDecayChart.DECAY_LABEL_FONT
    DecayRatesGraphView.DECAY_VALUE_FONT  = Constants.NucleusDecayChart.DECAY_VALUE_FONT

    DecayRatesGraphView.POINT_RADIUS = 2;

    Constants.DecayRatesGraphView = DecayRatesGraphView;


    return Constants;
});