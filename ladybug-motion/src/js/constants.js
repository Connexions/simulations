define(function (require) {

    'use strict';

    var range = require('common/math/range');

    var Constants = {}; 

    /*************************************************************************
     **                                                                     **
     **                         UNIVERSAL CONSTANTS                         **
     **                                                                     **
     *************************************************************************/

    Constants.MIN_SCENE_DIAMETER = 5; // centimeters
    Constants.ESTIMATION_SAMPLE_SIZE = 6; // number of samples


    /*************************************************************************
     **                                                                     **
     **                             UPDATE MODES                            **
     **                                                                     **
     *************************************************************************/

    Constants.UpdateMode = {
    	POSITION:     0,
    	VELOCITY:     1,
    	ACCELERATION: 2
    };

    Constants.POSITION_COLOR = '#2575BA';
    Constants.VELOCITY_COLOR = '#CD2520';
    Constants.ACCELERATION_COLOR = '#349E34';


    /*************************************************************************
     **                                                                     **
     **                               LADYBUG                               **
     **                                                                     **
     *************************************************************************/

    var Ladybug = {};

    Ladybug.DEFAULT_WIDTH  = 0.4; // centimeters
    Ladybug.DEFAULT_LENGTH = 0.6; // centimeters

    Constants.Ladybug = Ladybug;


    var LadybugView = {};

    LadybugView.WING_OPEN_VELOCITY = 2; // centimeters per second

    Constants.LadybugView = LadybugView;


    /*************************************************************************
     **                                                                     **
     **                             LADYBUG MOVER                           **
     **                                                                     **
     *************************************************************************/

    var LadybugMover = {};

    LadybugMover.LINEAR_SPEED = 0.8; // centimeters per second
    LadybugMover.CIRCLE_RADIUS = 2; // centimeters
    LadybugMover.CIRCLE_SPEED = 0.018; // not centimeters...some arbitrary value
    LadybugMover.ELLIPSE_A = 2; // centimeters
    LadybugMover.ELLIPSE_B = 1.4; // centimeters

    Constants.LadybugMover = LadybugMover;


    /*************************************************************************
     **                                                                     **
     **                          LADYBUG TRACE VIEW                         **
     **                                                                     **
     *************************************************************************/

    var LadybugTraceView = {};

    LadybugTraceView.NEW_OPACITY = 1;
    LadybugTraceView.OLD_OPACITY = 0.15;
    LadybugTraceView.SECONDS_TO_BE_OLD = 2; // seconds
    LadybugTraceView.NEW_OPACITY_RANGE = range({ 
        min: LadybugTraceView.NEW_OPACITY, 
        max: LadybugTraceView.OLD_OPACITY 
    });

    Constants.LadybugTraceView = LadybugTraceView;


    /*************************************************************************
     **                                                                     **
     **                         REMOTE CONTROL VIEW                         **
     **                                                                     **
     *************************************************************************/

    var RemoteControlView = {};

    RemoteControlView.RIGHT = 20;
    RemoteControlView.BOTTOM = 62 + 8 + 20;
    RemoteControlView.TAB_BG_COLOR = '#fff';
    RemoteControlView.TAB_BG_ALPHA = 0.2;
    RemoteControlView.TAB_ACTIVE_BG_COLOR = '#fff';
    RemoteControlView.TAB_ACTIVE_BG_ALPHA = 0.5;
    RemoteControlView.TAB_FONT = 'bold 14px Arial';
    RemoteControlView.TAB_WIDTH = 108;
    RemoteControlView.TAB_HEIGHT = 36;
    RemoteControlView.TABS = [{
        label: 'Position',
        color: Constants.POSITION_COLOR
    },{
        label: 'Velocity',
        color: Constants.VELOCITY_COLOR
    },{
        label: 'Acceleration',
        color: Constants.ACCELERATION_COLOR
    }];
    RemoteControlView.PANEL_PADDING = 10;
    RemoteControlView.PANEL_WIDTH  = 186; // pixels
    RemoteControlView.PANEL_HEIGHT = 210; // pixels
    RemoteControlView.AREA_WIDTH  = RemoteControlView.PANEL_WIDTH - 2 * RemoteControlView.PANEL_PADDING;
    RemoteControlView.AREA_HEIGHT = RemoteControlView.PANEL_WIDTH - 2 * RemoteControlView.PANEL_PADDING;
    RemoteControlView.ARROW_AREA_COLOR = '#fff';
    RemoteControlView.ARROW_AREA_ALPHA = 0.5;

    Constants.RemoteControlView = RemoteControlView;


    return Constants;
});
