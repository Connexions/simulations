define(function (require, exports, module) {

    'use strict';

    var _ = require('underscore');

    var Vector2          = require('common/math/vector2');
    var Wire             = require('models/components/wire');
    var CircuitComponent = require('models/components/circuit-component');
    var BranchSet        = require('models/branch-set');

    /**
     * Constants
     */
    //var Constants = require('constants');

    /**
     * 
     */
    var CircuitInteraction = {

        setModel: function(model) {
            this.model = model;
            this.circuit = model.circuit;
            this.BranchInteraction.model = model;
            this.BranchInteraction.circuit = model.circuit;
            this.JunctionInteraction.model = model;
            this.JunctionInteraction.circuit = model.circuit;
        },

        dragJunction: function(junction, target) {
            this.JunctionInteraction.dragJunction(junction, target);
        },

        dropJunction: function(junction) {
            this.JunctionInteraction.dropJunction(junction);
        },

        dragBranch: function(branch, location) {
            this.BranchInteraction.dragBranch(branch, location);
        },

        dropBranch: function(branch) {
            this.BranchInteraction.dropBranch(branch);
        },

        BranchInteraction: {

            toStart:   new Vector2(),
            toEnd:     new Vector2(),
            _newStart: new Vector2(),
            _newEnd:   new Vector2(),

            draggingBranch: false,
            branchDragMatch: undefined,

            branchSet: new BranchSet(),

            dragBranch: function(branch, dragPt) {
                if (!this.draggingBranch) {
                    this.draggingBranch = true;
                    this.toStart.set(branch.getStartPoint()).sub(dragPt);
                    this.toEnd.set(branch.getEndPoint()).sub(dragPt);
                }
                else {
                    if (branch instanceof CircuitComponent)
                        this.dragCircuitComponent(branch, dragPt);
                    else if (branch instanceof Wire)
                        this.dragWire(branch, dragPt);
                    else
                        throw 'Unknown wire type: ' + branch;
                }
            },

            dragWire: function(wire, dragPt) {
                var newStartPosition = this._newStart.set(this.toStart).add(dragPt);
                var newEndPosition = this._newEnd.set(this.toEnd).add(dragPt);
                var startDx = newStartPosition.sub(wire.getStartPoint());
                var endDx = newEndPosition.sub(wire.getEndPoint());

                var scStart = this.circuit.getStrongConnections(wire.get('startJunction'));
                var scEnd = this.circuit.getStrongConnections(wire.get('endJunction'));
                var startSources = this.getSources(scStart, wire.get('startJunction'));
                var endSources = this.getSources(scEnd, wire.get('endJunction'));
                
                // How about removing any junctions in start and end that share a branch?
                // Is this sufficient to keep from dropping wires directly on other wires?

                this.startMatch = this.circuit.getBestDragMatch(startSources, startDx);
                this.endMatch = this.circuit.getBestDragMatch(endSources, endDx);
console.log(this.startMatch, this.endMatch)
                if (this.endMatch && this.startMatch && this.endMatch.target == this.startMatch.target) {
                    this.endMatch.destroy();
                    this.endMatch = null;
                }

                if (this.endMatch && this.startMatch && this.wouldCauseOverlap(wire, this.startMatch, this.endMatch)) {
                    this.endMatch.destroy();
                    this.endMatch = null;
                }

                if (this.startMatch && this.endMatch) {
                    var branches = this.circuit.branches;
                    for (var i = 0; i < branches.length; i++) {
                        var b = branches.at(i);
                        if (b.hasJunction(this.startMatch.target) && wire.hasJunction(this.endMatch.target)) {
                            this.startMatch.destroy();
                            this.endMatch.destroy();
                            this.startMatch = null;
                            this.endMatch = null;
                            break;
                        }
                    }
                }

                this.apply(scStart, startDx, wire.get('startJunction'), this.startMatch);
                this.apply(scEnd,   endDx,   wire.get('endJunction'),   this.endMatch);
            },

            wouldCauseOverlap: function(wire, startMatch, endMatch) {
                var neighbors = this.circuit.getJunctionNeighbors(startMatch.target);
                this._remove(neighbors, wire.get('startJunction'));
                this._remove(neighbors, wire.get('endJunction'));

                if (neighbors.indexOf(endMatch.target) !== -1)
                    return true;
                else
                    return false;
            },

            _remove: function(array, obj) {
                for (var i = 0; i < array.length; i++) {
                    if (array[i] === obj) {
                        array.splice(i, 1);
                        return;
                    }
                }
            },

            dragCircuitComponent: function(cc, dragPt) {
                if (!this.draggingBranch) {
                    this.draggingBranch = true;
                    var startJ = cc.getStartPoint();
                    this.toStart.set(startJ).sub(dragPt);
                }

                var newStartPosition = this._newStart(this.toStart).add(dragPt);
                var startDx = newStartPosition.sub(wire.getStartPoint());
                var strongComponent = circuit.getStrongConnections(cc.get('startJunction'));

                this.branchDragMatch = this.circuit.getBestDragMatch(strongComponent, dx);
                this.branchSet
                    .clear()
                    .addBranches(strongComponent)
                    .translate(this.branchDragMatch == null ? 
                        dx : 
                        this.branchDragMatch.getVector()
                    );
            },

            dropBranch: function(branch) {
                if (branch instanceof CircuitComponent) {
                    if (this.branchDragMatch) {
                        this.circuit.collapseJunctions( this.branchDragMatch.source, this.branchDragMatch.target);
                        this.branchDragMatch.destroy();
                    }
                    
                    this.branchDragMatch = null;
                    this.draggingBranch = false;
                }
                else {
                    this.draggingBranch = false;

                    if (this.startMatch) {
                        this.circuit.collapseJunctions(this.startMatch.source, this.startMatch.target);
                        this.startMatch.destroy();
                    }
                
                    if (this.endMatch) {
                        this.circuit.collapseJunctions(this.endMatch.source, this.endMatch.target);
                        this.endMatch.destroy();
                    }
                }
            },

            getSources: function(sc, j) {
                var list = this.circuit.getJunctions(sc);
                if (list.indexOf(j) === -1)
                    list.push(j);
                return list;
            },

            apply: function(sc, dx, junction, match) {
                if (!match) {
                    this.branchSet
                        .clear()
                        .addBranches(sc)
                        .addJunction(junction)
                        .translate(dx);
                }
                else {
                    console.log(match.getVector())
                    this.branchSet
                        .clear()
                        .addBranches(sc)
                        .addJunction(junction)
                        .translate(match.getVector());
                }
            }

        },

        JunctionInteraction: {



        }

    };


    // var CircuitInteraction = function(model) {
    //     this.model = model;
    //     this.circuit = model.circuit;

    //     this.junctionInteraction = new JunctionInteraction(model);
    //     this.branchInteraction = new BranchInteraction(model);
    // };

    // _.extend(CircuitInteraction.prototype, {

    //     dragJunction: function(circuit, junction, target) {
    //         this.junctionInteraction.dragJunction(circuit, junction, target);
    //     },

    //     dropJunction: function(circuit, junction) {
    //         this.junctionInteraction.dropJunction(circuit, junction);
    //     },

    //     translate: function(circuit, wire, pt) {
    //         this.branchInteraction.translate(circuit, wire, pt);
    //     },

    //     dropBranch: function(circuit, wire) {
    //         this.branchInteraction.dropBranch(circuit, wire);
    //     },

    //     translate: function(circuit, branch, location) {
    //         this.branchInteraction.translate(circuit, branch, location);
    //     },

    //     dropBranch: function(circuit, branch) {
    //         this.branchInteraction.dropBranch(circuit, branch);
    //     }

    // };

    // BranchInteraction = function(model) {
    //     this.model = model;
    //     this.circuit = model.circuit;
    // };

    // _.extend(BranchInteraction.prototype, {

        
        
    // });

    // JunctionInteraction = function(model) {
    //     this.model = model;
    //     this.circuit = model.circuit;
    // };

    // _.extend(JunctionInteraction.prototype, {

    // });

    return CircuitInteraction;
});
