define(function (require) {

    'use strict';

    var range   = require('common/math/range');
    var Vector2 =require('common/math/vector2');

    var NucleusType  = require('models/nucleus-type');
    var HalfLifeInfo = require('models/half-life-info');

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
     **                       MEASUREMENT SIMULATION                        **
     **                                                                     **
     *************************************************************************/

    var MeasurementSimulation = {};

    MeasurementSimulation.MODE_TREE = 0;
    MeasurementSimulation.MODE_ROCK = 1;

    // Constants that control the conversion between simulation time (which is
    // essentially real time) and model time, which is often thousands or
    // billions of years in this model.
    MeasurementSimulation.INITIAL_TREE_AGING_RATE = HalfLifeInfo.convertYearsToMs(300) / 1000; // 300 years per second.
    MeasurementSimulation.INITIAL_ROCK_AGING_RATE = HalfLifeInfo.convertDaysToMs(90) / 10000;  // 90 days over 10 seconds - this will be the total eruption time (~3 months). 
    MeasurementSimulation.FINAL_ROCK_AGING_RATE   = HalfLifeInfo.convertYearsToMs(1E9) / 5000; // 1 billion years every 5 seconds.

    MeasurementSimulation.AGING_ROCK_EMISSION_TIME        = 4000; // Simulation milliseconds
    MeasurementSimulation.FLYING_ROCK_EMISSION_INTERVAL   =  300; // Simulation millisecond between emission attempts
    MeasurementSimulation.FLYING_ROCK_EMISSION_DEVIATION  = 0.5;
    MeasurementSimulation.FLYING_ROCK_START_EMISSION_TIME =  800; // Simulation milliseconds
    MeasurementSimulation.FLYING_ROCK_END_EMISSION_TIME   = 5000; // Simulation milliseconds
    MeasurementSimulation.ERUPTION_END_TIME               = 6000; // Simulation milliseconds

    MeasurementSimulation.VOLCANO_TOP_POSITION = new Vector2(140, 250);
    MeasurementSimulation.FLYING_ROCK_WIDTH = 8;

    MeasurementSimulation.INITIAL_TREE_WIDTH = 10;
    MeasurementSimulation.INITIAL_AGING_ROCK_WIDTH = 10;

    Constants.MeasurementSimulation = MeasurementSimulation;


    /*************************************************************************
     **                                                                     **
     **                        ANIMATED DATABLE ITEM                        **
     **                                                                     **
     *************************************************************************/

    var AnimatedDatableItem = {};

    /**
     * This enum defines the possible states with respect to closure, which
     *   is the time at which the item begins aging radiometrically and its
     *   radioactive elements start decreasing.  For example, if the item is
     *   organic, closure occurs when the item dies.
     */
    AnimatedDatableItem.CLOSURE_NOT_POSSIBLE = 0; // Closure cannot be forced.
    AnimatedDatableItem.CLOSURE_POSSIBLE = 1;     // Closure has not occurred, but could be forced.
    AnimatedDatableItem.CLOSED = 2;               // Closure has occurred.

    Constants.AnimatedDatableItem = AnimatedDatableItem;

    
    /*************************************************************************
     **                                                                     **
     **                             FLYING ROCK                             **
     **                                                                     **
     *************************************************************************/

    var FlyingRock = {};

    FlyingRock.MIN_ARC_HEIGHT_INCREMENT = 0.6;
    FlyingRock.MAX_ARC_HEIGHT_INCREMENT = 1.7;
    FlyingRock.ARC_HEIGHT_INCREMENT_RANGE = range({
        min: FlyingRock.MIN_ARC_HEIGHT_INCREMENT,
        max: FlyingRock.MAX_ARC_HEIGHT_INCREMENT
    });
    FlyingRock.MAX_X_TRANSLATION_INCREMENT = 10;
    FlyingRock.MAX_ROTATION_CHANGE = Math.PI / 10;
    FlyingRock.NUM_FLIGHT_STEPS = 50;
    FlyingRock.FLIGHT_STEP_INTERVAL = HalfLifeInfo.convertHoursToMs(10);

    Constants.FlyingRock = FlyingRock;


    /*************************************************************************
     **                                                                     **
     **                              AGING ROCK                             **
     **                                                                     **
     *************************************************************************/

    var AgingRock = {};

    AgingRock.FLY_COUNT = 50; // Controls how long it takes the rock to fly out and then hit the ground.
    AgingRock.FINAL_X_TRANSLATION = -100; // Model units
    AgingRock.FINAL_ROCK_WIDTH = 100; // Model units
    AgingRock.ARC_HEIGHT_FACTOR = 0.04; // Higher for higher arc.
    AgingRock.ROTATION_PER_STEP = Math.PI * 0.1605; // Controls rate of rotation when flying.
    AgingRock.COOLING_START_PAUSE_STEPS = 50; // Length of pause before after landing & before starting to cool.
    AgingRock.COOLING_STEPS = 60; // Number of steps to cool down.

    Constants.AgingRock = AgingRock;


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


    /*************************************************************************
     **                                                                     **
     **                            LANDSCAPE VIEW                           **
     **                                                                     **
     *************************************************************************/

    var LandscapeView = {};

    LandscapeView.BACKGROUND_IMAGE_WIDTH = 1600;
    LandscapeView.DEFAULT_BACKGROUND_WIDTH = 1500;
    LandscapeView.SHORT_SCREEN_BACKGROUND_WIDTH = 1060;

    Constants.LandscapeView = LandscapeView;


    /*************************************************************************
     **                                                                     **
     **                          VOLCANO SMOKE VIEW                         **
     **                                                                     **
     *************************************************************************/

    var VolcanoSmokeView = {};

    VolcanoSmokeView.NUM_PARTICLES = 600;
    VolcanoSmokeView.PARTICLE_COLOR = '#ddd';
    VolcanoSmokeView.PARTICLE_SPREAD_ANGLE = Math.PI / 12;
    VolcanoSmokeView.PARTICLE_SPREAD_ANGLE_RANGE = range({ min: -VolcanoSmokeView.PARTICLE_SPREAD_ANGLE / 2, max: VolcanoSmokeView.PARTICLE_SPREAD_ANGLE / 2 }); // radians
    VolcanoSmokeView.PARTICLE_VELOCITY_RANGE = range({ min: 30, max: 80 });
    VolcanoSmokeView.PARTICLE_MAX_ANGULAR_ACCELERATION = 0.34;
    VolcanoSmokeView.PARTICLE_LIFE_SPAN = range({ min: 4, max: 6.0 });
    VolcanoSmokeView.PARTICLE_EMISSION_FREQUENCY = 0.01;
    VolcanoSmokeView.PARTICLE_ALPHA = 0.5;
    VolcanoSmokeView.PARTICLE_FADE_POINT = 0.6;

    Constants.VolcanoSmokeView = VolcanoSmokeView;


    return Constants;
});
