define(function (require) {

    'use strict';

    var Vector2        = require('common/math/vector2');
    var Rectangle      = require('common/math/rectangle');
    var Functions      = require('common/math/functions');
    var PiecewiseCurve = require('common/math/piecewise-curve');
    var range          = require('common/math/range');

    var ThermalContactArea = require('models/thermal-contact-area');


    /*************************************************************************
     **                                                                     **
     **                         UNIVERSAL CONSTANTS                         **
     **                                                                     **
     *************************************************************************/

    var Constants = {}; 

    Constants.ROOM_TEMPERATURE           = 296;    // In Kelvin.
    Constants.FREEZING_POINT_TEMPERATURE = 273.15; // In Kelvin.
    Constants.BOILING_POINT_TEMPERATURE  = 373.15; // In Kelvin.

    // Time values for normal and fast-forward motion.
    Constants.FRAMES_PER_SECOND              = 30.0;
    Constants.FAST_FORWARD_TIMESCALE         = 4;
    Constants.SIM_TIME_PER_TICK_NORMAL       = 1 / Constants.FRAMES_PER_SECOND;
    Constants.SIM_TIME_PER_TICK_FAST_FORWARD = Constants.SIM_TIME_PER_TICK_NORMAL * Constants.FAST_FORWARD_TIMESCALE;
    Constants.MAX_HEAT_EXCHANGE_TIME_STEP    = Constants.SIM_TIME_PER_TICK_NORMAL;

    // Constants used for creating projections that have a 3D-ish look.
    Constants.Z_TO_X_OFFSET_MULTIPLIER = -0.25;
    Constants.Z_TO_Y_OFFSET_MULTIPLIER = -0.25;
    Constants.MAP_Z_TO_XY_OFFSET = function(zValue) {
        return new Vector2(zValue * Constants.Z_TO_X_OFFSET_MULTIPLIER, zValue * Constants.Z_TO_Y_OFFSET_MULTIPLIER);
    };
    Constants.PERSPECTIVE_ANGLE = Math.atan2(-Constants.Z_TO_Y_OFFSET_MULTIPLIER, -Constants.Z_TO_X_OFFSET_MULTIPLIER);
    Constants.PERSPECTIVE_EDGE_PROPORTION = Math.sqrt(
        Math.pow(Constants.Z_TO_X_OFFSET_MULTIPLIER, 2) +
        Math.pow(Constants.Z_TO_Y_OFFSET_MULTIPLIER, 2) 
    );

    // For comparing temperatures.
    Constants.SIGNIFICANT_TEMPERATURE_DIFFERENCE = 1E-3; // In degrees K.

    // Threshold for deciding when two temperatures can be considered equal.
    Constants.TEMPERATURES_EQUAL_THRESHOLD = 1E-6; // In Kelvin.

    Constants.WATER_FILL_COLOR = '#afeeee';

    // Model-view transform scale factor for Energy Systems tab.
    Constants.ENERGY_SYSTEMS_MVT_SCALE_FACTOR = 2200;

    /*************************************************************************
     **                                                                     **
     **                      ENERGY CONTAINER CATEGORIES                    **
     **                                                                     **
     *************************************************************************/

    var EnergyContainerCategory =  {
        IRON:  'iron',
        BRICK: 'brick',
        WATER: 'water',
        AIR:   'air'
    };

    Constants.EnergyContainerCategory = EnergyContainerCategory;


    /*************************************************************************
     **                                                                     **
     **                           INTRO SIMULATION                          **
     **                                                                     **
     *************************************************************************/

    var IntroSimulation = {};
    /**
     * Minimum distance allowed between two objects.  This basically prevents
     *   floating point issues.
     */
    IntroSimulation.MIN_INTER_ELEMENT_DISTANCE = 1E-9; // In meters

    /** 
     * Threshold of temperature difference between the bodies in a multi-body
     *   system below which energy can be exchanged with air.
     */
    IntroSimulation.MIN_TEMPERATURE_DIFF_FOR_MULTI_BODY_AIR_ENERGY_EXCHANGE = 2.0; // In degrees K, empirically determined

    // Initial thermometer location, intended to be away from any model objects.
    IntroSimulation.INITIAL_THERMOMETER_LOCATION = new Vector2( 100, 100 );

    IntroSimulation.NUM_THERMOMETERS = 3;
    
    IntroSimulation.BEAKER_WIDTH = 0.085; // In meters.
    IntroSimulation.BEAKER_HEIGHT = IntroSimulation.BEAKER_WIDTH * 1.1;

    // Flag that can be turned on in order to print out some profiling info.
    IntroSimulation.ENABLE_INTERNAL_PROFILING = false;

    Constants.IntroSimulation = IntroSimulation;

    var IntroSimulationView = {};

    IntroSimulationView.BURNER_WIDTH_SCALE = 0.7;
    IntroSimulationView.BURNER_HEIGHT_TO_WIDTH_RATIO = 0.8;

    Constants.IntroSimulationView = IntroSimulationView;


    /*************************************************************************
     **                                                                     **
     **                               ELEMENT                               **
     **                                                                     **
     *************************************************************************/

    var IntroElementView = {};

    IntroElementView.TEXT_FONT = '32px Arial';
    IntroElementView.SMALL_TEXT_FONT = '22px Arial';

    Constants.IntroElementView = IntroElementView;

    /*************************************************************************
     **                                                                     **
     **                                BLOCK                                **
     **                                                                     **
     *************************************************************************/

    var Block = {};
    
    // Height and width of all block surfaces, since it is a cube.
    Block.SURFACE_WIDTH = 0.045; // In meters
    // Number of slices where energy chunks may be placed.
    Block.NUM_ENERGY_CHUNK_SLICES = 4;
    Block.MAX_TEMPERATURE = 450; // Degrees Kelvin, value is pretty much arbitrary. Whatever works.

    Constants.Block = Block;

    var BlockView = {};

    BlockView.PERSPECTIVE_ANGLE = Math.atan2(-Constants.Z_TO_Y_OFFSET_MULTIPLIER, -Constants.Z_TO_X_OFFSET_MULTIPLIER);
    BlockView.PERSPECTIVE_EDGE_PROPORTION = Math.sqrt(
        Math.pow(Constants.Z_TO_X_OFFSET_MULTIPLIER, 2) + Math.pow(Constants.Z_TO_Y_OFFSET_MULTIPLIER, 2) 
    );
    BlockView.LINE_WIDTH = 3;

    Constants.BlockView = BlockView;


    /*************************************************************************
     **                                                                     **
     **                                BRICK                                **
     **                                                                     **
     *************************************************************************/

    var Brick  = {};

    Brick.SPECIFIC_HEAT = 840; // In J/kg-K, source = design document.
    Brick.DENSITY = 3300; // In kg/m^3, source = design document plus some tweaking to keep chunk numbers reasonable.

    // Some constants needed for energy chunk mapping.
    Brick.ENERGY_AT_ROOM_TEMPERATURE = Math.pow(Block.SURFACE_WIDTH, 3) * Brick.DENSITY * Brick.SPECIFIC_HEAT * Constants.ROOM_TEMPERATURE; // In joules.
    Brick.ENERGY_AT_WATER_FREEZING_TEMPERATURE = Math.pow(Block.SURFACE_WIDTH, 3) * Brick.DENSITY * Brick.SPECIFIC_HEAT * Constants.FREEZING_POINT_TEMPERATURE; // In joules.

    Brick.NUM_ENERGY_CHUNKS_AT_FREEZING  = 1.25;
    Brick.NUM_ENERGY_CHUNKS_AT_ROOM_TEMP = 2.4; // Close to rounding to 3 so that little energy needed to transfer a chunk.

    Constants.Brick = Brick;

    var BrickView = {};

    BrickView.FILL_COLOR = '#d6492e'; 
    BrickView.TEXT_COLOR = '#000';

    Constants.BrickView = BrickView;


    /*************************************************************************
     **                                                                     **
     **                                 IRON                                **
     **                                                                     **
     *************************************************************************/

    var Iron = {};

    Iron.SPECIFIC_HEAT = 450; // In J/kg-K, source = design document.
    Iron.DENSITY = 7800; // In kg/m^3, source = design document

    Constants.Iron = Iron;

    var IronBlockView = {};

    IronBlockView.FILL_COLOR = '#888';
    IronBlockView.TEXT_COLOR = '#000';

    Constants.IronBlockView = IronBlockView;


    /*************************************************************************
     **                                                                     **
     **                                BURNER                               **
     **                                                                     **
     *************************************************************************/

    var Burner = {};

    Burner.WIDTH = 0.075; // In meters.
    Burner.HEIGHT = Burner.WIDTH * 1;
    Burner.EDGE_TO_HEIGHT_RATIO = 0.2; // Multiplier empirically determined for best look.
    Burner.MAX_ENERGY_GENERATION_RATE = 5000; // joules/sec, empirically chosen.
    Burner.CONTACT_DISTANCE = 0.001; // In meters.
    Burner.ENERGY_CHUNK_CAPTURE_DISTANCE = 0.2; // In meters, empirically chosen.

    //
    Burner.PERSPECTIVE_ANGLE = Math.PI / 4;

    // Because of the way that energy chunks are exchanged between thermal
    //   modeling elements within this simulation, things can end up looking a
    //   bit odd if a burner is turned on with nothing on it.  To account for
    //   this, a separate energy generation rate is used when a burner is
    //   exchanging energy directly with the air.
    Burner.MAX_ENERGY_GENERATION_RATE_INTO_AIR = Burner.MAX_ENERGY_GENERATION_RATE * 0.3; // joules/sec, multiplier empirically chosen.

    Constants.Burner = Burner;

    var BurnerView = {};

    BurnerView.HOT_COLOR  = '#ff4500';
    BurnerView.COLD_COLOR = '#0000f0';
    BurnerView.TEXT_FONT  = 'bold 17px Arial';
    BurnerView.TEXT_COLOR = '#000';
    BurnerView.SMALL_TEXT_FONT  = 'bold 12px Arial';

    Constants.BurnerView = BurnerView;

    /*************************************************************************
     **                                                                     **
     **                                BEAKER                               **
     **                                                                     **
     *************************************************************************/

    var Beaker = {};

    Beaker.MATERIAL_THICKNESS = 0.001; // In meters.
    Beaker.NUM_SLICES = 6;
    Beaker.STEAMING_RANGE = 10; // Number of degrees Kelvin over which steam is emitted.

    // Constants that control the nature of the fluid in the beaker.
    Beaker.WATER_SPECIFIC_HEAT = 3000; // In J/kg-K.  The real value for water is 4186, but this was adjusted so that there
                                       //   aren't too many chunks and so that a chunk is needed as soon as heating starts.
    Beaker.WATER_DENSITY = 1000.0; // In kg/m^3, source = design document (and common knowledge).
    Beaker.INITIAL_FLUID_LEVEL = 0.5;

    Constants.Beaker = Beaker;

    var BeakerView = {};

    BeakerView.LINE_COLOR = '#ccc';
    BeakerView.LINE_WIDTH = 3;
    BeakerView.PERSPECTIVE_PROPORTION = -Constants.Z_TO_Y_OFFSET_MULTIPLIER;
    BeakerView.TEXT_FONT = '32px Arial';
    BeakerView.SHOW_MODEL_RECT = false;
    BeakerView.FILL_COLOR = '#fff';
    BeakerView.FILL_ALPHA = 0.30;

    BeakerView.WATER_FILL_COLOR = Constants.WATER_FILL_COLOR;
    BeakerView.WATER_FILL_ALPHA = 0.5;
    BeakerView.WATER_LINE_COLOR = '#82A09E';
    BeakerView.WATER_LINE_WIDTH = 2;

    BeakerView.STEAMING_RANGE = 10; // Number of degrees Kelvin over which steam is visible.
    BeakerView.STEAM_PARTICLE_COLOR = '#fff';
    BeakerView.STEAM_PARTICLE_SPEED_RANGE           = range({ min: 100, max: 125 }); // In screen coords (basically pixels) per second.
    BeakerView.STEAM_PARTICLE_RADIUS_RANGE          = range({ min: 15,  max: 40  }); // In screen coords (basically pixels).
    BeakerView.STEAM_PARTICLE_LIFE_RANGE            = range({ min: 2,   max: 4   }); // Seconds to live
    BeakerView.STEAM_PARTICLE_PRODUCTION_RATE_RANGE = range({ min: 20,  max: 40  }); // Particles per second.
    BeakerView.STEAM_PARTICLE_GROWTH_RATE = 0.2; // Proportion per second.
    BeakerView.MAX_STEAM_PARTICLE_OPACITY = 0.7; // Proportion, 1 is max.
    BeakerView.NUM_STEAM_PARTICLES = 200;

    Constants.BeakerView = BeakerView;


    /*************************************************************************
     **                                                                     **
     **                                BURNER                               **
     **                                                                     **
     *************************************************************************/

    var BurnerStandView = {};
    // Constants that control some aspect of appearance.  These can be made
    // into constructor params if it is ever desirable to do so.
    BurnerStandView.LINE_WIDTH = 4;
    BurnerStandView.LINE_COLOR = '#000';
    BurnerStandView.LINE_JOIN  = 'bevel';
    BurnerStandView.PERSPECTIVE_ANGLE = Math.PI / 4; // Positive is counterclockwise, a value of 0 produces a non-skewed rectangle.

    Constants.BurnerStandView = BurnerStandView;


    /*************************************************************************
     **                                                                     **
     **                             THERMOMETER                             **
     **                                                                     **
     *************************************************************************/

    var ThermometerView = {};
    
    ThermometerView.NUM_TICK_MARKS = 13;
    ThermometerView.TICK_MARK_THICKNESS = 2; // pixels
    ThermometerView.LIQUID_COLOR = '#ed1c24';
    ThermometerView.HEIGHT_IN_METERS = 0.081;

    Constants.ThermometerView = ThermometerView;


    var ThermometerClipsView = {};

    ThermometerClipsView.BASE_WIDTH = 0.118; // Meters
    ThermometerClipsView.CLIP_WIDTH = 0.038; // Meters tall

    Constants.ThermometerClipsView = ThermometerClipsView;


    /*************************************************************************
     **                                                                     **
     **                                 AIR                                 **
     **                                                                     **
     *************************************************************************/

    var Air = {};
    // 2D size of the air.  It is sized such that it will extend off the left,
    // right, and top edges of screen for the most common aspect ratios of the
    // view.
    Air.WIDTH  = 0.7; 
    Air.HEIGHT = 0.3;

    // The thickness of the slice of air being modeled.  This is basically the
    // z dimension, and is used solely for volume calculations.
    Air.DEPTH = 0.1; // In meters.

    // Constants that define the heat carrying capacity of the air.
    Air.SPECIFIC_HEAT = 1012; // In J/kg-K, source = design document.
    Air.DENSITY = 10; // In kg/m^3, far denser than real air, done to make things cool faster.

    // Derived constants.
    Air.VOLUME = Air.WIDTH * Air.HEIGHT * Air.DEPTH;
    Air.MASS = Air.VOLUME * Air.DENSITY;
    Air.INITIAL_ENERGY = Air.MASS * Air.SPECIFIC_HEAT * Constants.ROOM_TEMPERATURE;
    Air.THERMAL_CONTACT_AREA = new ThermalContactArea(new Rectangle(-Air.WIDTH / 2, 0, Air.WIDTH, Air.HEIGHT), true);

    Constants.Air = Air;


    /*************************************************************************
     **                                                                     **
     **                             ENERGY TYPES                            **
     **                                                                     **
     *************************************************************************/
    
    Constants.EnergyTypes = {
        THERMAL:    0,
        ELECTRICAL: 1,
        MECHANICAL: 2,
        LIGHT:      3,
        CHEMICAL:   4,
        HIDDEN:     5
    };


    /*************************************************************************
     **                                                                     **
     **                            ENERGY CHUNKS                            **
     **                                                                     **
     *************************************************************************/

    // Constant used by all of the "energy systems" in order to keep the amount
    // of energy generated, converted, and consumed consistent.
    Constants.MAX_ENERGY_PRODUCTION_RATE = 10000; // In joules/sec.

    // Constants that control the speed of the energy chunks
    Constants.ENERGY_CHUNK_VELOCITY = 0.04; // In meters/sec.

    // Constant function for energy chunk mapping. The basis for this function
    // is that the brick has 2 energy chunks at room temp, one at the freezing
    // point of water.
    var _energyToNumChunks = Functions.createLinearFunction(
        Brick.ENERGY_AT_WATER_FREEZING_TEMPERATURE,
        Brick.ENERGY_AT_ROOM_TEMPERATURE,
        Brick.NUM_ENERGY_CHUNKS_AT_FREEZING,
        Brick.NUM_ENERGY_CHUNKS_AT_ROOM_TEMP
    );

    Constants.numChunksToEnergy = _energyToNumChunks.createInverse();

    Constants.energyToNumChunks = function(energy) {
        return Math.max(Math.round(_energyToNumChunks(energy)), 0);
    };

    Constants.ENERGY_PER_CHUNK = Constants.numChunksToEnergy(2) - Constants.numChunksToEnergy(1);

    var EnergyChunkCollectionView = {};
    
    EnergyChunkCollectionView.Z_DISTANCE_WHERE_FULLY_FADED = 0.1; // In meters
    EnergyChunkCollectionView.WIDTH = 0.012; // In meters

    Constants.EnergyChunkCollectionView = EnergyChunkCollectionView;
    

    /*************************************************************************
     **                                                                     **
     **                       ENERGY CHUNK DISTRIBUTOR                      **
     **                                                                     **
     *************************************************************************/

    var EnergyChunkDistributor = {};

    EnergyChunkDistributor.OUTSIDE_CONTAINER_FORCE = 0.01; // In Newtons, empirically determined.
    EnergyChunkDistributor.ZERO_VECTOR = new Vector2(0, 0);

    // Parameters that can be adjusted to change they nature of the redistribution.
    EnergyChunkDistributor.MAX_TIME_STEP = 5E-3;         // In seconds, for algorithm that moves the points.
    EnergyChunkDistributor.ENERGY_CHUNK_MASS = 1E-3;     // In kilograms, chosen arbitrarily.
    EnergyChunkDistributor.FLUID_DENSITY = 1000;         // In kg / m ^ 3, same as water, used for drag.
    EnergyChunkDistributor.ENERGY_CHUNK_DIAMETER = 1E-3; // In meters, chosen empirically.
    EnergyChunkDistributor.ENERGY_CHUNK_CROSS_SECTIONAL_AREA = Math.PI * Math.pow(EnergyChunkDistributor.ENERGY_CHUNK_DIAMETER, 2); // Treat energy chunk as if it is shaped like a sphere.
    EnergyChunkDistributor.DRAG_COEFFICIENT = 500;       // Unitless, empirically chosen.

    // Thresholds for deciding whether or not to perform redistribution. These value
    //   should be chosen such that particles spread out, then stop all movement.
    EnergyChunkDistributor.REDISTRIBUTION_THRESHOLD_ENERGY = 1E-4; // In joules, I think.

    // Number of times to attempt an even distribution of energy chunks on first load
    EnergyChunkDistributor.NUM_INITIAL_DISTRIBUTION_ATTEMPTS = 1000; // 1000

    Constants.EnergyChunkDistributor = EnergyChunkDistributor;


    /*************************************************************************
     **                                                                     **
     **                    ENERGY CHUNK WANDER CONTROLLER                   **
     **                                                                     **
     *************************************************************************/

    var EnergyChunkWanderController = {};

    EnergyChunkWanderController.MIN_VELOCITY = 0.06; // In m/s.
    EnergyChunkWanderController.MAX_VELOCITY = 0.10; // In m/s.
    EnergyChunkWanderController.MIN_TIME_IN_ONE_DIRECTION = 0.4;
    EnergyChunkWanderController.MAX_TIME_IN_ONE_DIRECTION = 0.8;
    EnergyChunkWanderController.DISTANCE_AT_WHICH_TO_STOP_WANDERING = 0.05; // In meters, empirically chosen.
    EnergyChunkWanderController.MAX_ANGLE_VARIATION = Math.PI * 0.2; // Max deviation from angle to destination, in radians, empirically chosen.

    Constants.EnergyChunkWanderController = EnergyChunkWanderController;


    /*************************************************************************
     **                                                                     **
     **                            HEAT TRANSFER                            **
     **                                                                     **
     *************************************************************************/

    /**
     * Constants that control the rate of heat transfer between the various 
     * elements that can contain heat and maps for looking up transfer
     * rates for any two model elements that are capable of exchanging heat.
     *
     * @author John Blanco
     */
    var HeatTransfer = {
        // Heat transfer values.  NOTE: Originally, these were constants, but the
        // design team requested that they be changeable via a developer control,
        // which is why they are now properties.
        BRICK_IRON_HEAT_TRANSFER_FACTOR:             1000,
        BRICK_WATER_HEAT_TRANSFER_FACTOR:            1000,
        BRICK_AIR_HEAT_TRANSFER_FACTOR:              50,
        IRON_WATER_HEAT_TRANSFER_FACTOR:             1000,
        IRON_AIR_HEAT_TRANSFER_FACTOR:               50,
        WATER_AIR_HEAT_TRANSFER_FACTOR:              50,
        AIR_TO_SURROUNDING_AIR_HEAT_TRANSFER_FACTOR: 10000
    };

    // Maps for obtaining transfer constants for a given thermal element.
    var HEAT_TRANSFER_FACTORS_FOR_BRICK = {};
    HEAT_TRANSFER_FACTORS_FOR_BRICK[EnergyContainerCategory.IRON]  = HeatTransfer.BRICK_IRON_HEAT_TRANSFER_FACTOR;
    HEAT_TRANSFER_FACTORS_FOR_BRICK[EnergyContainerCategory.WATER] = HeatTransfer.BRICK_WATER_HEAT_TRANSFER_FACTOR;
    HEAT_TRANSFER_FACTORS_FOR_BRICK[EnergyContainerCategory.AIR]   = HeatTransfer.BRICK_AIR_HEAT_TRANSFER_FACTOR;

    var HEAT_TRANSFER_FACTORS_FOR_IRON = {};
    HEAT_TRANSFER_FACTORS_FOR_IRON[EnergyContainerCategory.BRICK] = HeatTransfer.BRICK_IRON_HEAT_TRANSFER_FACTOR;
    HEAT_TRANSFER_FACTORS_FOR_IRON[EnergyContainerCategory.WATER] = HeatTransfer.BRICK_WATER_HEAT_TRANSFER_FACTOR;
    HEAT_TRANSFER_FACTORS_FOR_IRON[EnergyContainerCategory.AIR]   = HeatTransfer.BRICK_AIR_HEAT_TRANSFER_FACTOR;

    var HEAT_TRANSFER_FACTORS_FOR_WATER = {};
    HEAT_TRANSFER_FACTORS_FOR_WATER[EnergyContainerCategory.BRICK] = HeatTransfer.BRICK_WATER_HEAT_TRANSFER_FACTOR;
    HEAT_TRANSFER_FACTORS_FOR_WATER[EnergyContainerCategory.IRON]  = HeatTransfer.IRON_WATER_HEAT_TRANSFER_FACTOR;
    HEAT_TRANSFER_FACTORS_FOR_WATER[EnergyContainerCategory.AIR]   = HeatTransfer.WATER_AIR_HEAT_TRANSFER_FACTOR;

    var HEAT_TRANSFER_FACTORS_FOR_AIR = {};
    HEAT_TRANSFER_FACTORS_FOR_AIR[EnergyContainerCategory.BRICK] = HeatTransfer.BRICK_AIR_HEAT_TRANSFER_FACTOR;
    HEAT_TRANSFER_FACTORS_FOR_AIR[EnergyContainerCategory.IRON]  = HeatTransfer.IRON_AIR_HEAT_TRANSFER_FACTOR;
    HEAT_TRANSFER_FACTORS_FOR_AIR[EnergyContainerCategory.WATER] = HeatTransfer.WATER_AIR_HEAT_TRANSFER_FACTOR;

    var CONTAINER_CATEGORY_MAP = {};
    CONTAINER_CATEGORY_MAP[EnergyContainerCategory.BRICK] = HEAT_TRANSFER_FACTORS_FOR_BRICK;
    CONTAINER_CATEGORY_MAP[EnergyContainerCategory.IRON]  = HEAT_TRANSFER_FACTORS_FOR_IRON;
    CONTAINER_CATEGORY_MAP[EnergyContainerCategory.WATER] = HEAT_TRANSFER_FACTORS_FOR_WATER;
    CONTAINER_CATEGORY_MAP[EnergyContainerCategory.AIR]   = HEAT_TRANSFER_FACTORS_FOR_AIR;

    HeatTransfer.CONTAINER_CATEGORY_MAP = CONTAINER_CATEGORY_MAP;

    HeatTransfer.getHeatTransferFactor = function(container1, container2) {
        return this.CONTAINER_CATEGORY_MAP[container1][container2];
    };

    Constants.HeatTransfer = HeatTransfer;


    /*************************************************************************
     **                                                                     **
     **                       ENERGY SYSTEMS SIMULATION                     **
     **                                                                     **
     *************************************************************************/

    var EnergySystemsSimulation = {};

    EnergySystemsSimulation.OFFSET_BETWEEN_ELEMENTS   = new Vector2(0,     -0.4);
    EnergySystemsSimulation.ENERGY_SOURCE_POSITION    = new Vector2(-0.15,  0);
    EnergySystemsSimulation.ENERGY_CONVERTER_POSITION = new Vector2(-0.025, 0);
    EnergySystemsSimulation.ENERGY_USER_POSITION      = new Vector2( 0.089,  0);

    EnergySystemsSimulation.TRANSITION_DURATION = 0.5;

    Constants.EnergySystemsSimulation = EnergySystemsSimulation;


    var EnergySystemsSimulationView = {};

    EnergySystemsSimulationView.DEFAULT_MVT_SCALE = Constants.ENERGY_SYSTEMS_MVT_SCALE_FACTOR;
    EnergySystemsSimulationView.SHORT_SCREEN_MVT_SCALE = EnergySystemsSimulationView.DEFAULT_MVT_SCALE * 0.74;

    Constants.EnergySystemsSimulationView = EnergySystemsSimulationView;


    /*************************************************************************
     **                                                                     **
     **                           FAUCET AND WATER                          **
     **                                                                     **
     *************************************************************************/

    var Faucet = {};

    Faucet.OFFSET_FROM_CENTER_TO_WATER_ORIGIN = new Vector2(0.065, 0.08); // was 0.065, 0.08
    Faucet.FALLING_ENERGY_CHUNK_VELOCITY = 0.09; // In meters/second.
    Faucet.MAX_WATER_WIDTH = 0.015; // In meters.
    Faucet.ENERGY_CHUNK_TRANSFER_DISTANCE_RANGE = range({ min: 0.05, max: 0.06 });
    Faucet.MAX_DISTANCE_FROM_FAUCET_TO_BOTTOM_OF_WATER = 0.5; // In meters.

    Constants.Faucet = Faucet;

    var WaterDrop = {};

    WaterDrop.MAX_DISTANCE_FROM_FAUCET_TO_BOTTOM_OF_WATER = Faucet.MAX_DISTANCE_FROM_FAUCET_TO_BOTTOM_OF_WATER; // In meters.
    WaterDrop.ACCELERATION_DUE_TO_GRAVITY = new Vector2(0, -0.15);

    Constants.WaterDrop = WaterDrop;


    /*************************************************************************
     **                                                                     **
     **                         ELECTRICAL GENERATOR                        **
     **                                                                     **
     *************************************************************************/

    var ElectricalGenerator = {};

    // Attributes of the wheel and generator.
    ElectricalGenerator.WHEEL_MOMENT_OF_INERTIA = 5; // In kg.
    ElectricalGenerator.RESISTANCE_CONSTANT = 3; // Controls max speed and rate of slow down, empirically determined.
    ElectricalGenerator.MAX_ROTATIONAL_VELOCITY = Math.PI / 2; // In radians/sec, empirically determined.

    // Images used to represent this model element in the view.
    ElectricalGenerator.WHEEL_CENTER_OFFSET = new Vector2(0, 0.03);
    ElectricalGenerator.LEFT_SIDE_OF_WHEEL_OFFSET = new Vector2(-0.03, 0.03);
    ElectricalGenerator.CONNECTOR_OFFSET = new Vector2(0.057, -0.04);
    ElectricalGenerator.WHEEL_RADIUS = 0.0388; //WHEEL_HUB_IMAGE.getWidth() / 2;
    ElectricalGenerator.WIRE_OFFSET = new Vector2(0.0185, -0.015);

    // Offsets used to create the paths followed by the energy chunks.
    ElectricalGenerator.START_OF_WIRE_CURVE_OFFSET = new Vector2(ElectricalGenerator.WHEEL_CENTER_OFFSET).add(0.01,  -0.05);
    ElectricalGenerator.WIRE_CURVE_POINT_1_OFFSET  = new Vector2(ElectricalGenerator.WHEEL_CENTER_OFFSET).add(0.015, -0.06);
    ElectricalGenerator.WIRE_CURVE_POINT_2_OFFSET  = new Vector2(ElectricalGenerator.WHEEL_CENTER_OFFSET).add(0.03,  -0.07);
    ElectricalGenerator.CENTER_OF_CONNECTOR_OFFSET = ElectricalGenerator.CONNECTOR_OFFSET;

    Constants.ElectricalGenerator = ElectricalGenerator;


    /*************************************************************************
     **                                                                     **
     **                               LIGHT BULB                            **
     **                                                                     **
     *************************************************************************/

    var LightBulb = {};

    // Offsets need for creating the path followed by the energy chunks.  These
    // were empirically determined based on images, will need to change if the
    // images are changed.
    LightBulb.OFFSET_TO_LEFT_SIDE_OF_WIRE       = new Vector2(-0.04,   -0.04);
    LightBulb.OFFSET_TO_LEFT_SIDE_OF_WIRE_BEND  = new Vector2(-0.02,   -0.04);
    LightBulb.OFFSET_TO_FIRST_WIRE_CURVE_POINT  = new Vector2(-0.01,   -0.0375);
    LightBulb.OFFSET_TO_SECOND_WIRE_CURVE_POINT = new Vector2(-0.001,  -0.025);
    LightBulb.OFFSET_TO_THIRD_WIRE_CURVE_POINT  = new Vector2(-0.0005, -0.0175);
    LightBulb.OFFSET_TO_BOTTOM_OF_CONNECTOR     = new Vector2( 0,      -0.01);
    LightBulb.OFFSET_TO_RADIATE_POINT           = new Vector2( 0,       0.066);

    // Miscellaneous other constants.
    LightBulb.RADIATED_ENERGY_CHUNK_MAX_DISTANCE = 0.5;
    LightBulb.THERMAL_ENERGY_CHUNK_TIME_ON_FILAMENT = range({ min: 2, max: 2.5 });
    LightBulb.ENERGY_TO_FULLY_LIGHT = Constants.MAX_ENERGY_PRODUCTION_RATE;
    LightBulb.LIGHT_CHUNK_LIT_BULB_RADIUS = 0.1; // In meters.
    LightBulb.LIGHT_CHANGE_RATE = 0.5; // In proportion per second.
    LightBulb.FILAMENT_WIDTH = 0.03;

    Constants.LightBulb = LightBulb;


    var IncandescentLightBulbView = {};

    IncandescentLightBulbView.RAY_COLOR = '#fff71c';

    Constants.IncandescentLightBulbView = IncandescentLightBulbView;

    var FluorescentLightBulbView = {};

    FluorescentLightBulbView.RAY_COLOR = '#FFFEB0';

    Constants.FluorescentLightBulbView = FluorescentLightBulbView;


    /*************************************************************************
     **                                                                     **
     **                             LIGHT RAY VIEW                          **
     **                                                                     **
     *************************************************************************/

    var LightRayView = {};

    LightRayView.LINE_WIDTH = 2;
    LightRayView.SEARCH_ITERATIONS = 15;
    LightRayView.FADE_COEFFICIENT_IN_AIR = 0.005;

    Constants.LightRayView = LightRayView;


    /*************************************************************************
     **                                                                     **
     **                                  SUN                                **
     **                                                                     **
     *************************************************************************/

    var Sun = {};

    Sun.RADIUS = 0.02; // In meters, apparent size, not (obviously) actual size.
    Sun.OFFSET_TO_CENTER_OF_SUN = new Vector2(-0.05, 0.12);
    Sun.ENERGY_CHUNK_EMISSION_PERIOD = 0.11; // In seconds.
    Sun.MAX_DISTANCE_OF_E_CHUNKS_FROM_SUN = 0.5; // In meters.

    // Constants that control the nature of the emission sectors.  These are
    //   used to make emission look random yet still have a fairly steady rate
    //   within each sector.  One sector is intended to point at the solar panel.
    Sun.NUM_EMISSION_SECTORS = 10;
    Sun.EMISSION_SECTOR_SPAN = 2 * Math.PI / Sun.NUM_EMISSION_SECTORS;
    Sun.EMISSION_SECTOR_OFFSET = Sun.EMISSION_SECTOR_SPAN * 0.71; // Used to tweak sector positions to make sure solar panel gets consistent flow of E's.

    Constants.Sun = Sun;


    var SunView = {};

    SunView.INNER_FILL_COLOR = '#fff';
    SunView.OUTER_FILL_COLOR = '#ffd700';
    SunView.GRADIENT_END = 0.7;
    SunView.LINE_WIDTH = 1;
    SunView.LINE_COLOR = '#ffff00';
    SunView.RAY_COLOR = SunView.LINE_COLOR;
    SunView.RAY_DISTANCE = 1000;

    SunView.PANEL_WIDTH  = 0.065;
    SunView.PANEL_HEIGHT = 0.088;
    SunView.PANEL_OFFSET = new Vector2(-0.05, 0.035);
    
    SunView.SLIDER_WIDTH = 8;
    SunView.SLIDER_BG_FILL_TOP = '#444';
    SunView.SLIDER_BG_FILL_BOTTOM = '#fff';
    SunView.SLIDER_BG_LINE_COLOR = '#333';
    SunView.SLIDER_HANDLE_FILL_COLOR = '#fff';
    SunView.SLIDER_HANDLE_LINE_COLOR = '#888';

    SunView.LABEL_COLOR = '#000';
    SunView.LABEL_FONT = '16px Arial';
    SunView.LABEL_TITLE_FONT = '20px Arial';
    SunView.FONT_FAMILY = 'Arial';
    SunView.LABEL_FONT_SIZE = 16;
    SunView.TITLE_FONT_SIZE = 20;

    SunView.CLOUD_ICON_WIDTH = 50;

    Constants.SunView = SunView;


    /*************************************************************************
     **                                                                     **
     **                                 CLOUD                               **
     **                                                                     **
     *************************************************************************/

    var Cloud = {};

    Cloud.CLOUD_WIDTH = 0.035; // In meters, though obviously not to scale.  Empirically determined.
    Cloud.CLOUD_HEIGHT = 0.0191; // In meters, the height that, given the width above, will maintain the right aspect ratio for the image

    Constants.Cloud = Cloud;


    /*************************************************************************
     **                                                                     **
     **                              SOLAR PANEL                            **
     **                                                                     **
     *************************************************************************/

    var SolarPanel = {};

    SolarPanel.SOLAR_PANEL_OFFSET = new Vector2(0, 0.044);

    SolarPanel.CONVERTER_OFFSET = new Vector2(0.015, -0.040);
    SolarPanel.CONNECTOR_OFFSET = new Vector2(0.057, -0.040);
    SolarPanel.WIRE_OFFSET = new Vector2(SolarPanel.CONVERTER_OFFSET).add(0.009, 0.024);
    SolarPanel.POST_OFFSET = new Vector2(SolarPanel.CONVERTER_OFFSET).add(0, 0.04);

    // Constants used for creating the path followed by the energy chunks.
    //   Many of these numbers were empirically determined based on the images,
    //   and will need updating if the images change.
    SolarPanel.OFFSET_TO_CONVERGENCE_POINT  = new Vector2(SolarPanel.CONVERTER_OFFSET.x, 0.01);
    SolarPanel.OFFSET_TO_FIRST_CURVE_POINT  = new Vector2(SolarPanel.CONVERTER_OFFSET.x, -0.025);
    SolarPanel.OFFSET_TO_SECOND_CURVE_POINT = new Vector2(SolarPanel.CONVERTER_OFFSET.x + 0.005, -0.033);
    SolarPanel.OFFSET_TO_THIRD_CURVE_POINT  = new Vector2(SolarPanel.CONVERTER_OFFSET.x + 0.015, SolarPanel.CONNECTOR_OFFSET.y);
    SolarPanel.OFFSET_TO_CONNECTOR_CENTER   = SolarPanel.CONNECTOR_OFFSET;

    // Inter chunk spacing time for when the chunks reach the 'convergence
    //   point' at the bottom of the solar panel.  It is intended to
    //   approximately match the rate at which the sun emits energy chunks.
    SolarPanel.MIN_INTER_CHUNK_TIME = 1 / (Sun.ENERGY_CHUNK_EMISSION_PERIOD * Sun.NUM_EMISSION_SECTORS);

    SolarPanel.PANEL_IMAGE_ASPECT_RATIO = 2.069149; // determined empirically and will have to change if the image changes
    SolarPanel.PANEL_IMAGE_WIDTH = 0.15;
    SolarPanel.PANEL_IMAGE_HEIGHT = SolarPanel.PANEL_IMAGE_WIDTH / SolarPanel.PANEL_IMAGE_ASPECT_RATIO;
    SolarPanel.PANEL_IMAGE_BOUNDS = new Rectangle(
        -SolarPanel.PANEL_IMAGE_WIDTH / 2,
        -SolarPanel.PANEL_IMAGE_HEIGHT / 2,
        SolarPanel.PANEL_IMAGE_WIDTH,
        SolarPanel.PANEL_IMAGE_HEIGHT
    );

    // This would seem to make the opposite of what I would think is the
    //   absoprtion width (0.8 * width) would be, but it's purposely not
    //   the entire surface area of the panel so it will not always hit
    //   at the left and top edges.
    var absorptionZoneWidth = SolarPanel.PANEL_IMAGE_WIDTH * 0.2;

    SolarPanel.ABSORPTION_SHAPE = new PiecewiseCurve()
        .moveTo(SolarPanel.PANEL_IMAGE_BOUNDS.left(),                        SolarPanel.PANEL_IMAGE_BOUNDS.bottom())
        .lineTo(SolarPanel.PANEL_IMAGE_BOUNDS.right() - absorptionZoneWidth, SolarPanel.PANEL_IMAGE_BOUNDS.top())
        .lineTo(SolarPanel.PANEL_IMAGE_BOUNDS.right(),                       SolarPanel.PANEL_IMAGE_BOUNDS.top())
        .lineTo(SolarPanel.PANEL_IMAGE_BOUNDS.left()  + absorptionZoneWidth, SolarPanel.PANEL_IMAGE_BOUNDS.bottom())
        //.lineTo(SolarPanel.PANEL_IMAGE_BOUNDS.left(),                        SolarPanel.PANEL_IMAGE_BOUNDS.bottom())
        .close();

    Constants.SolarPanel = SolarPanel;


    /*************************************************************************
     **                                                                     **
     **                             BEAKER HEATER                           **
     **                                                                     **
     *************************************************************************/

    var BeakerHeater = {};

    BeakerHeater.HEATER_ELEMENT_OFFSET = new Vector2(-0.002, 0.022);
    BeakerHeater.BEAKER_OFFSET         = new Vector2( 0,     0.025);
    BeakerHeater.THERMOMETER_OFFSET    = new Vector2( 0.033, 0.035);

    // Offsets need for creating the path followed by the energy chunks.  These
    // were empirically determined based on images, will need to change if the
    // images are changed.
    BeakerHeater.OFFSET_TO_LEFT_SIDE_OF_WIRE       = new Vector2(-0.04,   -0.04);
    BeakerHeater.OFFSET_TO_LEFT_SIDE_OF_WIRE_BEND  = new Vector2(-0.02,   -0.04);
    BeakerHeater.OFFSET_TO_FIRST_WIRE_CURVE_POINT  = new Vector2(-0.01,   -0.0375);
    BeakerHeater.OFFSET_TO_SECOND_WIRE_CURVE_POINT = new Vector2(-0.001,  -0.025);
    BeakerHeater.OFFSET_TO_THIRD_WIRE_CURVE_POINT  = new Vector2(-0.0005, -0.0175);
    BeakerHeater.OFFSET_TO_BOTTOM_OF_CONNECTOR     = new Vector2(0,       -0.01);
    BeakerHeater.OFFSET_TO_CONVERSION_POINT        = new Vector2(0,        0.012);

    BeakerHeater.BEAKER_WIDTH = 0.075; // In meters.
    BeakerHeater.BEAKER_HEIGHT = BeakerHeater.BEAKER_WIDTH * 0.9;
    BeakerHeater.HEATING_ELEMENT_ENERGY_CHUNK_VELOCITY = 0.0075; // In meters/sec, quite slow.
    BeakerHeater.HEATER_ELEMENT_HEIGHT = 60 / Constants.ENERGY_SYSTEMS_MVT_SCALE_FACTOR;
    BeakerHeater.MAX_HEAT_GENERATION_RATE = 5000; // Joules/sec, not connected to incoming energy.
    BeakerHeater.HEAT_ENERGY_CHANGE_RATE = 0.5; // In proportion per second.

    BeakerHeater.RADIATED_ENERGY_CHUNK_TRAVEL_DISTANCE = 0.2; // In meters.
    BeakerHeater.RADIATION_NUM_DIRECTION_CHANGES = 4; // Empirically chosen
    BeakerHeater.RADIATION_NOMINAL_TRAVEL_VECTOR = new Vector2(0, BeakerHeater.RADIATED_ENERGY_CHUNK_TRAVEL_DISTANCE / BeakerHeater.RADIATION_NUM_DIRECTION_CHANGES);

    Constants.BeakerHeater = BeakerHeater;


    /*************************************************************************
     **                                                                     **
     **                                 TEAPOT                              **
     **                                                                     **
     *************************************************************************/

    var Teapot = {};

    Teapot.TEAPOT_OFFSET = new Vector2(0.0, 0.015);

    // Offsets and other constants used for energy paths.  These are mostly
    //   empirically determined and coordinated with the image.
    Teapot.SPOUT_BOTTOM_OFFSET     = new Vector2(0.03, 0.02);
    Teapot.SPOUT_TIP_OFFSET        = new Vector2(0.25, 0.3);
    Teapot.ACTUAL_SPOUT_TIP_OFFSET = new Vector2(0.0475, 0.045); // I made this because the one above is nowhere close to the tip
    Teapot.DISTANT_TARGET_OFFSET   = new Vector2(1,    1);
    Teapot.WATER_SURFACE_HEIGHT_OFFSET = 0; // From teapot position, in meters.
    Teapot.THERMAL_ENERGY_CHUNK_Y_ORIGIN = -0.05; // In meters, must be coordinated with heater position.
    Teapot.THERMAL_ENERGY_CHUNK_X_ORIGIN_RANGE = range({ min: -0.015, max: 0.015 }); // In meters, must be coordinated with heater position.

    // Miscellaneous other constants.
    Teapot.MAX_ENERGY_CHANGE_RATE = Constants.MAX_ENERGY_PRODUCTION_RATE / 5; // In joules/second
    Teapot.COOLING_CONSTANT = 0.1; // Controls rate at which tea pot cools down, empirically determined.
    Teapot.COOL_DOWN_COMPLETE_THRESHOLD = 30; // In joules/second
    Teapot.ENERGY_CHUNK_TRANSFER_DISTANCE_RANGE = range({ min: 0.12, max: 0.15 });
    Teapot.ENERGY_CHUNK_WATER_TO_SPOUT_TIME = 0.7; // Used to keep chunks evenly spaced.
    Teapot.MECHANICAL_ENERGY_CHUNK_RATE = 0.2; // Proportion of energy chunks that will be mechanical vs thermal

    Constants.Teapot = Teapot;


    var TeapotView = {};

    TeapotView.BURNER_WIDTH = 120; // Empirically determined.
    TeapotView.BURNER_HEIGHT = TeapotView.BURNER_WIDTH * 0.80;
    TeapotView.BURNER_OPENING_HEIGHT = TeapotView.BURNER_WIDTH * 0.2;

    TeapotView.NUM_STEAM_PARTICLES = 400;
    TeapotView.STEAM_PARTICLE_RADIUS_RANGE = range({ min:  8, max: 40 });
    TeapotView.STEAM_PARTICLE_LIFE_RANGE   = range({ min:  2.5, max:  3.5 }); // Seconds to live
    TeapotView.STEAM_PARTICLE_COLOR = BeakerView.STEAM_PARTICLE_COLOR;
    TeapotView.STEAM_PARTICLE_MAX_ALPHA = 0.2;
    TeapotView.STEAM_PARTICLE_FADE_POINT = 0.8; // percent of life at which to start fading
    TeapotView.STEAM_EMISSION_ANGLE = Math.PI / 7;
    TeapotView.MAX_STEAM_PARTICLE_EMISSION_RATE = 100; // particles per second
    TeapotView.MAX_STEAM_CLOUD_CENTER_DISTANCE = 140; // pixels, rotated
    TeapotView.STEAM_CLOUD_RADIUS = 50;
    TeapotView.STEAM_CLOUD_REPELLANT_FORCE = 0.3; // a velocity modifier
    TeapotView.STEAM_CLOUD_CONTAINMENT_FORCE = 0.0001;
    TeapotView.STEAM_PARTICLE_CLOUD_DAMPENING = 0.90; // decelleration

    Constants.TeapotView = TeapotView;


    /*************************************************************************
     **                                                                     **
     **                                 BIKER                               **
     **                                                                     **
     *************************************************************************/

    var Biker = {};

    Biker.MAX_ANGULAR_VELOCITY_OF_CRANK = 3 * Math.PI; // In radians/sec.
    Biker.ANGULAR_ACCELERATION = Math.PI / 2; // In radians/(sec^2).
    Biker.MAX_ENERGY_OUTPUT_WHEN_CONNECTED_TO_GENERATOR = Constants.MAX_ENERGY_PRODUCTION_RATE; // In joules / sec
    Biker.MAX_ENERGY_OUTPUT_WHEN_RUNNING_FREE = Biker.MAX_ENERGY_OUTPUT_WHEN_CONNECTED_TO_GENERATOR / 5; // In joules / sec
    Biker.CRANK_TO_REAR_WHEEL_RATIO = 1;
    Biker.INITIAL_NUM_ENERGY_CHUNKS = 15;
    Biker.MECHANICAL_TO_THERMAL_CHUNK_RATIO = 5;
    Biker.REAR_WHEEL_RADIUS = 0.02; // In meters, must be worked out with the image.

    // Offset of the bike frame center.  Most other image offsets are relative
    // to this one.
    Biker.FRAME_CENTER_OFFSET = new Vector2(0.0, 0.01);

    // Offsets used for creating energy chunk paths.  These need to be
    // coordinated with the images.
    Biker.BIKER_BUTTOCKS_OFFSET       = new Vector2(0.02,    0.04);
    Biker.TOP_TUBE_ABOVE_CRANK_OFFSET = new Vector2(0.007,   0.015);
    Biker.BIKE_CRANK_OFFSET           = new Vector2(0.0052, -0.006);
    Biker.CENTER_OF_BACK_WHEEL_OFFSET = new Vector2(0.03,   -0.01);
    Biker.BOTTOM_OF_BACK_WHEEL_OFFSET = new Vector2(0.03,   -0.03);
    Biker.NEXT_ENERGY_SYSTEM_OFFSET   = new Vector2(0.13,   -0.01);
    Biker.NUM_LEG_IMAGES = 24;

    Constants.Biker = Biker;


    var BikerView = {};

    BikerView.PANEL_WIDTH = 0.1;
    BikerView.PANEL_HEIGHT = 0.025;
    BikerView.PANEL_OFFSET = new Vector2(-BikerView.PANEL_WIDTH / 2, -BikerView.PANEL_HEIGHT - 0.018);
    BikerView.LABEL_COLOR = '#000';
    BikerView.LABEL_FONT  = '16px Arial';
    BikerView.LABEL_FONT_FAMILY = 'Arial';
    BikerView.LABEL_FONT_SIZE = 16;

    Constants.BikerView = BikerView;


    return Constants;
});
