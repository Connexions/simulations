define(function (require) {

    'use strict';

    var _ = require('underscore');

    var Vector2   = require('common/math/vector2');
    var Rectangle = require('common/math/vector2');

    var Photon = require('./photon');

    // Cached objects
    var electronPath = new Rectangle();

    /**
     * 
     */
    var ElectronAtomCollisionExpert = {

        /**
         * 
         */
        detectAndDoCollision: function(body1, body2) {
            var electron;
            var atom;

            if (body1 instanceof Atom)
                atom = body1;
            else if (body1 instanceof Electron)
                electron = body1;

            if (body2 instanceof Atom)
                atom = body2;
            else if (body2 instanceof Electron)
                electron = body2;

            if (atom && electron) {
                // Do simple check
                var prevDistSq = electron.getPreviousPosition().distanceSq(atom.get('position'));
                var atomRadSq = Math.pow(atom.get('radius') + electron.get('radius'), 2);
                var distSq = electron.get('position').distanceSq(atom.get('position'));
                if (distSq <= atomRadSq && prevDistSq > atomRadSq) {
                    atom.collideWithElectron( electron );
                    return false;
                }

                // Do more complicated check that will detect if the electron passed through the atom during
                // the time step, but isn't currently within the atom
                electronPath.set(
                    electron.getPreviousPosition().x,
                    electron.getPreviousPosition().y,
                    electron.getX() - electron.getPreviousPosition().x,
                    1
                );

                var x = atom.getX() - atom.get('radius');
                var y = atom.getY() - atom.get('radius');
                var r = atom.get('radius') * 2;

                if (electronPath.overlapsCircle(x, y, r)) {
                    atom.collideWithElectron(electron);
                    return false;
                }
            }

            return false;
        }

    };


    return ElectronAtomCollisionExpert;
});