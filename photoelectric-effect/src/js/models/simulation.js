define(function (require, exports, module) {

    'use strict';

    var _ = require('underscore');

    var Beam        = require('common/quantum/models/beam');
    var Photon      = require('common/quantum/models/photon');
    var PhysicsUtil = require('common/quantum/models/physics-util');

    var DischargeLampsSimulation = require('discharge-lamps/models/simulation');
    var DischargeLampsConstants  = require('discharge-lamps/constants');

    var Ammeter             = require('models/ammeter');
    var Circuit             = require('models/circuit');
    var BeamIntensityMeter  = require('models/beam-intensity-meter');
    var BeamControl         = require('models/beamcontrol');
    var PhotoelectricTarget = require('models/photoelectric-target');
    var MetalEnergyAbsorptionStrategy = require('models/metal-energy-absorption-strategy');

    /**
     * Constants
     */
    var Constants = require('constants');


    /**
     * Wraps the update function in 
     */
    var PEffectSimulation = DischargeLampsSimulation.extend({

        defaults: _.extend(DischargeLampsSimulation.prototype.defaults, {
            circuitIsPositive: true
        }),
        
        initialize: function(attributes, options) {
            DischargeLampsSimulation.prototype.initialize.apply(this, [attributes, options]);

        },

        /**
         * Initializes the models used in the simulation
         */
        initComponents: function() {
            var circuit = new Circuit({
                voltage: 0,
                wavelength: PEffectSimulation.DEFAULT_BEAM_WAVELENGTH
            });
            this.circuit = circuit;

            var beamControl = new BeamControl({
                wavelength: 400,
                intensity: 100
            });
            this.beamControl = beamControl;


            // Set the max and min voltage of the battery
            this.battery.set('maxVoltage', PEffectSimulation.MAX_VOLTAGE);
            this.battery.set('minVoltage', PEffectSimulation.MIN_VOLTAGE);

            // Create a photon beam and add a listener that will add the photons it produces to the model
            var alpha = PEffectSimulation.BEAM_ANGLE;
            var beamPosition = new Vector2(
                DischargeLampsConstants.CATHODE_LOCATION.x - Math.cos(alpha) * PEffectSimulation.BEAM_SOURCE_TO_TARGET_DISTANCE,
                DischargeLampsConstants.CATHODE_LOCATION.y - Math.sin(alpha) * PEffectSimulation.BEAM_SOURCE_TO_TARGET_DISTANCE
            );

            this.beam = new Beam({
                wavelength:          PEffectSimulation.defaultBeamWavelength,
                position:            beamPosition,
                length:              PEffectSimulation.BEAM_HEIGHT,
                beamWidth:           PEffectSimulation.BEAM_WIDTH,
                maxPhotonsPerSecond: PEffectSimulation.MAX_PHOTONS_PER_SECOND,
                photonsPerSecond:    0,
                fanout:              PEffectSimulation.BEAM_FANOUT, 
                speed:               Photon.DEFAULT_SPEED,
                enabled:             true
            }, {
                direction: new Vector2(Math.cos(PEffectSimulation.BEAM_ANGLE), Math.sin(PEffectSimulation.BEAM_ANGLE))
            });

            this.addModel(this.beam);

            this.listenTo(this.beam, 'change:photonsPerSecond', this.beamIntensityChanged);
            this.listenTo(this.beam, 'photon-produced', this.photonProduced);

            // Create the target plate.
            var this.target = new PhotoelectricTarget({
                simulation: this,
                electromotiveForce: this,
                point1: DischargeLampsConstants.ANODE_START,
                point1: DischargeLampsConstants.ANODE_END,
                potential: PEffectSimulation.DEFAULT_TARGET_POTENTIAL
            });

            // Create the right-hand plate
            var rightHandPlate = new Plate({
                simulation: this,
                electromotiveForce: this,
                point1: Constants.CATHODE_START,
                point2: Constants.CATHODE_END
            });

            this.setLeftHandPlate(this.target);
            this.setRightHandPlate(rightHandPlate);

            this.addModel(this.target);


            //----------------------------------------------------------------
            // Intrumentation
            //----------------------------------------------------------------

            // Add an ammeter to the right-hand-plate
            this.ammeter = new Ammeter();
            this.addModel(this.ammeter);

            // Add an intensity meter for the beam
            this.beamIntensityMeter = new BeamIntensityMeter();
            this.addModel(this.beamIntensityMeter);
            this.listenTo(this.beam, 'photon-produced', function(beam, photon) {
                this.beamIntensityMeter.recordPhoton();
            });
        },

        _update: function(time, deltaTime) {
            DischargeLampsSimulation.prototype._update.apply(this, arguments);

            // Check for photons hitting the cathode
            for (var i = 0; i < this.photons.length; i++) {
                var photon = this.photons.at(i);
                if (this.target.isHitByPhoton(photon)) {
                    this.target.handlePhotonCollision(photon);
                    photon.destroy();
                }
            }

            // Check for changes is state, and notify listeners of changes
            if (this.getCurrent() !== this.get('current'))
                this.set('current', this.getCurrent());
            
            if (this.getVoltage() !== this.get('voltage'))
                this.set('voltage', this.getVoltage());
            
            if (this.beam.getWavelength() !== this.get('wavelength'))
                this.set('wavelength', this.getVoltage());

            // Check for electrons that get out of the tube (Only matters if the
            // electrons leave the target at an angle)
            for (var i = this.electrons.length - 1; i >= 0; i--) {
                var electron = this.electrons.at(i);
                if (!this.getTube().getBounds().contains(electron.getPosition()))
                    electron.destroy();
            }
        },

        setRightHandPlate: function(plate) {
            DischargeLampsSimulation.prototype.setRightHandPlate.apply(this, arguments);

            this.listenTo(this.rightHandPlate, 'electron-produced', function(plate, electron) {
                this.ammeter.recordElectron();
            });
        },

        getAnodePotential: function() {
            return this.rightHandPlate.getPotential() - this.target.getPotential();
        },

        getVoltage: function() {
            return -this.getAnodePotential();
        },

        /**
         * Tells the current as a function of the photon rate of the beam and the work function
         *   of the target material.
         * Overrides parent class
         *
         * @return The current that will hit the cathode based on the electrons that are currently leaving
         *         the anode
         */
        getCurrent: function() {
            return this.getCurrentForVoltage(this.getVoltage());
        },

        getCurrentForVoltage: function(voltage) {
            var electronsPerSecondFromTarget = 0;
            var electronsPerSecondToAnode = 0;
            if (this.target.getMaterial().getEnergyAbsorptionStrategy() instanceof MetalEnergyAbsorptionStrategy) {
                // The fraction of collisions that will kick off an electron is equal to the amount of energy each
                //   photon has that is greater than the work function, divided by the absorption strategy's
                //   total energy depth, with a ceiling of 1.
                var photonEnergyBeyondWorkFunction = PhysicsUtil.wavelengthToEnergy(this.beam.getWavelength()) - this.target.getMaterial().getWorkFunction();
                var electronRateAsFractionOfPhotonRate = Math.min(
                    photonEnergyBeyondWorkFunction / MetalEnergyAbsorptionStrategy.TOTAL_ENERGY_DEPTH,
                    1
                );
                electronsPerSecondFromTarget = electronRateAsFractionOfPhotonRate * this.beam.get('photonsPerSecond');
                var retardingVoltage = voltage < 0 ? -voltage : 0;
                var fractionOfPhotonsMoreEnergeticThanRetardingVoltage = Math.max(
                    0,
                    Math.min(
                        (photonEnergyBeyondWorkFunction - retardingVoltage) / MetalEnergyAbsorptionStrategy.TOTAL_ENERGY_DEPTH, 
                        1 
                    )
                );
                electronsPerSecondToAnode = electronsPerSecondFromTarget * fractionOfPhotonsMoreEnergeticThanRetardingVoltage;
            }
            else {
                // If the stopping voltage is less than the voltage across the plates, we get a current
                //   equal to the number of photons per second. (We assume there is one electron for every photon).
                //   Otherwise, there is no current
                electronsPerSecondFromTarget = this.beam.get('photonsPerSecond');
                electronsPerSecondToAnode = electronsPerSecondFromTarget;
                var retardingVoltage = voltage < 0 ? voltage : 0;
                electronsPerSecondToAnode = this.getStoppingVoltage() < retardingVoltage ? electronsPerSecondFromTarget : 0;
            }
            // #3281: Any number of electrons <1 is effectively zero. This presents non-zero current readings when no electrons are reaching the anode.
            if (electronsPerSecondToAnode < 1)
                electronsPerSecondToAnode = 0;
            
            return electronsPerSecondToAnode * PEffectSimulation.CURRENT_JIMMY_FACTOR;
        }

        /**
         * Returns the stopping voltage for electrons kicked off the current target material
         * by the current wavelength of light
         *
         * @return The stopping voltage
         */
        getStoppingVoltage: function() {
            var photonEnergy = PhysicsUtil.wavelengthToEnergy(this.beam.getWavelength());
            var stoppingVoltage = this.getWorkFunction() - photonEnergy;
            return stoppingVoltage;
        },

        getWorkFunction: function() {
            return this.target.getMaterial().getWorkFunction();
        },

        getWavelength: function() {
            return this.beam.getWavelength();
        },

        setElectronAcceleration: function(potentialDiff, plateSeparation) {
            if (plateSeparation !== undefined) {
                DischargeLampsSimulation.prototype.setElectronAcceleration.apply(this, arguments);
            }
            else {
                DischargeLampsSimulation.prototype.setElectronAcceleration.apply(this, [
                    potentialDiff * 0.2865,
                    this.target.getPosition().distance(this.rightHandPlate.getPosition())
                ]);
            }
        },

        photonProduced: function(source, photon) {
            this.addModel(photon);
        },

        beamIntensityChanged: function(beam, photonsPerSecond) {
            this.trigger('beam-intensity-changed', this, photonsPerSecond);
        },

        /**
         * Overrides DischargeLampsSimulation.potentialChanged
         */
        potentialChanged: function() {
            var potentialDiff = this.target.getPotential() - this.rightHandPlate.getPotential();

            // Determine the acceleration that electrons will experience
            this.setElectronAcceleration(potentialDiff);
            for (var i = 0; i < this.electrons.length; i++)
                this.electrons.at(i).setAcceleration(this.electronAcceleration);

            // Calling setCurrent() ensures that the current flows in the correct direction
            this.setCurrent(current);
        },

    }, Constants.PEffectSimulation);

    return PEffectSimulation;
});
