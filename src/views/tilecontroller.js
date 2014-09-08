//
//  HTML5 PivotViewer
//
//  Collection loader interface - used so that different types of data sources can be used
//
//  Original Code:
//    Copyright (C) 2011 LobsterPot Solutions - http://www.lobsterpot.com.au/
//    enquiries@lobsterpot.com.au
//
//  Enhancements:
//    Copyright (C) 2012-2014 OpenLink Software - http://www.openlinksw.com/
//
//  This software is licensed under the terms of the
//  GNU General Public License v2 (see COPYING)
//

///
/// Tile Controller
/// used to create the initial tiles and their animation based on the locations set in the views
///
PivotViewer.Views.TileController = Object.subClass({
    init: function (ImageController) {
        this._tiles = [];
        this._helpers = [];
        this._helperText = "";
        this._easing = new Easing.Easer({ type: "circular", side: "both" });
        this._imageController = ImageController;
    },
    initTiles: function (pivotCollectionItems, baseCollectionPath, canvasContext) {
        //Set the initial state for the tiles
        for (var i = 0; i < pivotCollectionItems.length; i++) {
            var tile = new PivotViewer.Views.Tile(this._imageController);
            tile.facetItem = pivotCollectionItems[i];
            tile.CollectionRoot = baseCollectionPath.replace(/\\/gi, "/").replace(/\.xml/gi, "");
            this._canvasContext = canvasContext;
            tile.context = this._canvasContext;
            tileLocation = new PivotViewer.Views.TileLocation();
            tile._locations.push(tileLocation);
            this._tiles.push(tile);
        }
        return this._tiles;
    },

    AnimateTiles: function (doInitialSelection, selectedId) {
        var that = this;
        this._started = true;
        var context = null;
        var isAnimating = false;

        if (this._tiles.length > 0 && this._tiles[0].context != null) {
            context = this._tiles[0].context;

            //TODO Seen this error, investigate this for performance: http://stackoverflow.com/questions/7787219/javascript-ios5-javascript-execution-exceeded-timeout

            var isZooming = false;
            //Set tile properties
            for (var i = 0; i < this._tiles.length; i++) {
                //for each tile location...
                for (l = 0; l < this._tiles[i]._locations.length; l++) {
                     var now = PivotViewer.Utils.Now() - this._tiles[i].start,
                     end = this._tiles[i].end - this._tiles[i].start;
                     //use the easing function to determine the next position
                     if (now <= end) {
                         //at least one tile is moving
                         //isAnimating = true;
 
                         //if the position is different from the destination position then zooming is happening
                         if (this._tiles[i]._locations[l].x != this._tiles[i]._locations[l].destinationx || this._tiles[i]._locations[l].y != this._tiles[i]._locations[l].destinationy)
                             isZooming = true;
 
                         this._tiles[i]._locations[l].x = this._easing.ease(
                             now, 										// curr time
                             this._tiles[i]._locations[l].startx,                                                       // start position
                            this._tiles[i]._locations[l].destinationx - this._tiles[i]._locations[l].startx, // relative end position

                             end											// end time
                         );
 
                         this._tiles[i]._locations[l].y = this._easing.ease(
                         now,
                         this._tiles[i]._locations[l].starty,
                         this._tiles[i]._locations[l].destinationy - this._tiles[i]._locations[l].starty,
                         end
                     );
 
                         //if the width/height is different from the destination width/height then zooming is happening
                         if (this._tiles[i].width != this._tiles[i].destinationWidth || this._tiles[i].height != this._tiles[i].destinationHeight)
                             isZooming = true;
 
                         this._tiles[i].width = this._easing.ease(
                         now,
                         this._tiles[i].startwidth,
                         this._tiles[i].destinationwidth - this._tiles[i].startwidth,
                         end
                     );
 
                         this._tiles[i].height = this._easing.ease(
                         now,
                         this._tiles[i].startheight,
                         this._tiles[i].destinationheight - this._tiles[i].startheight,
                         end
                     );
                     } else {
                         this._tiles[i]._locations[l].x = this._tiles[i]._locations[l].destinationx;
                         this._tiles[i]._locations[l].y = this._tiles[i]._locations[l].destinationy;
                         this._tiles[i].width = this._tiles[i].destinationwidth;
                         this._tiles[i].height = this._tiles[i].destinationheight;
			 // if now and end are numbers when we get here then the animation 
			 // has finished
			 if (!isNaN(now) && !isNaN(end) && doInitialSelection) {
                             var selectedTile = "";
                             for ( t = 0; t < this._tiles.length; t ++ ) {
                                 if (this._tiles[t].facetItem.Id == selectedId) {
                                    selectedTile = this._tiles[t];
                                    break;
                                 }
                             }
	                     if (selectedId && selectedTile) 
                        	$.publish("/PivotViewer/Views/Canvas/Click", [{ x: selectedTile._locations[selectedTile.selectedLoc].destinationx, y: selectedTile._locations[selectedTile.selectedLoc].destinationy}]);
                                doInitialSelection = false;
                                selectedId = 0;
                        }
                     }
 
                     //check if the destination will be in the visible area
                     if (this._tiles[i]._locations[l].destinationx + this._tiles[i].destinationwidth < 0 || this._tiles[i]._locations[l].destinationx > context.canvas.width || this._tiles[i]._locations[l].destinationy + this._tiles[i].destinationheight < 0 || this._tiles[i]._locations[l].destinationy > context.canvas.height)
                         this._tiles[i].destinationVisible = false;
                     else
                         this._tiles[i].destinationVisible = true;
                 }
             }
         }

        //fire zoom event
        if (this._isZooming != isZooming) {
            this._isZooming = isZooming;
            $.publish("/PivotViewer/ImageController/Zoom", [this._isZooming]);
        }

        //If animating then (most likely) all tiles will need to be updated, so clear the entire canvas
        //if (isAnimating) {
            //Clear drawing area
            context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        //}

        //once properties set then draw
        for (var i = 0; i < this._tiles.length; i++) {
            //only draw if in visible area
            for (var l = 0; l < this._tiles[i]._locations.length; l++) {
                if (this._tiles[i]._locations[l].x + this._tiles[i].width > 0 && this._tiles[i]._locations[l].x < context.canvas.width && this._tiles[i]._locations[l].y + this._tiles[i].height > 0 && this._tiles[i]._locations[l].y < context.canvas.height) {
                if (isAnimating)
                    this._tiles[i].DrawEmpty(l);
                else
                    this._tiles[i].Draw(l);
                }
            }
        }

        //Helpers
        /*
        if (debug) {
            //Draw point if one requested
            if (this._helpers.length > 0) {
                for (var i = 0; i < this._helpers.length; i++) {
                    this._canvasContext.beginPath();
                    this._canvasContext.moveTo(this._helpers[i].x, this._helpers[i].y);
                    this._canvasContext.arc(this._helpers[i].x + 1, this._helpers[i].y + 1, 10, 0, Math.PI * 2, true);
                    this._canvasContext.fillStyle = "#FF0000";
                    this._canvasContext.fill();
                    this._canvasContext.beginPath();
                    this._canvasContext.rect(this._helpers[i].x + 25, this._helpers[i].y - 40, 50, 13);
                    this._canvasContext.fillStyle = "white";
                    this._canvasContext.fill();
                    this._canvasContext.fillStyle = "black";
                    this._canvasContext.fillText(this._helpers[i].x + ", " + this._helpers[i].y, this._helpers[i].x + 30, this._helpers[i].y - 30);
                }
            }

            if (this._helperText.length > 0) {
                this._canvasContext.beginPath();
                this._canvasContext.rect(220, 5, 500, 14);
                this._canvasContext.fillStyle = "white";
                this._canvasContext.fill();
                this._canvasContext.fillStyle = "black";
                this._canvasContext.fillText(this._helperText, 225, 14);
            }
        }
        */

        // request new frame
        if (!this._breaks) {
            requestAnimFrame(function () {
                that.AnimateTiles(doInitialSelection, selectedId);
            });
        } else {
            this._started = false;
            return;
        }
    },

    BeginAnimation: function (doInitialSelection, viewerStateSelected) {
        if (!this._started && this._tiles.length > 0) {
            this._breaks = false;
            this.AnimateTiles(doInitialSelection, viewerStateSelected);
        }
    },
    StopAnimation: function () {
        this._breaks = true;
    },
    SetLinearEasingBoth: function () {
        this._easing = new Easing.Easer({ type: "linear", side: "both" });
    },
    SetCircularEasingBoth: function () {
        this._easing = new Easing.Easer({ type: "circular", side: "both" });
    },
    SetQuarticEasingOut: function () {
        this._easing = new Easing.Easer({ type: "quartic", side: "out" });
    },
    GetMaxTileRatio: function () {
    //    return this._imageController.Height / this._imageController.MaxWidth;
        return this._imageController.MaxRatio;
    },
    DrawHelpers: function (helpers) {
        this._helpers = helpers;
    },
    DrawHelperText: function (text) {
        this._helperText = text;
    }
});

///
/// Tile
/// Used to contain the details of an individual tile, and to draw the tile on a given canvas context
///
PivotViewer.Views.Tile = Object.subClass({
    init: function (TileController) {
        if (!(this instanceof PivotViewer.Views.Tile)) {
            return new PivotViewer.Views.Tile(TileController);
        }
        this._controller = TileController;
        this._imageLoaded = false;
        this._selected = false;
        this._images = null;
        this._locations = [];
    },

    IsSelected: function () {
       return this._selected;
    },

    Draw: function (loc) {
        //Is the tile destination in visible area?
        if (this.destinationVisible) {
            this._images = this._controller.GetImages(this.facetItem.Img, this.width, this.height);
        }

        if (this._images != null) {
            if (typeof this._images == "function") {
                //A DrawLevel function returned - invoke
                this._images(this.facetItem, this.context, this._locations[loc].x + 4, this._locations[loc].y + 4, this.width - 8, this.height - 8);
            }

            else if (this._images.length > 0 && this._images[0] instanceof Image) {
                //if the collection contains an image
                var completeImageHeight = this._controller.GetHeight(this.facetItem.Img);
                var displayHeight = this.height - 8;
                var displayWidth = Math.ceil(this._controller.GetWidthForImage(this.facetItem.Img, displayHeight));
                //Narrower images need to be centered 
                blankWidth = (this.width - 8) - displayWidth;

                // Handle displaying the deepzoom image tiles (move to deepzoom.js)
                if (this._controller instanceof PivotViewer.Views.DeepZoomImageController) {
                    for (var i = 0; i < this._images.length; i++) {
                        // We need to know where individual image tiles go
                        var source = this._images[i].src;
                        var tileSize = this._controller._tileSize;
                        var n = source.match(/[0-9]+_[0-9]+/g);
                        var xPosition = parseInt(n[n.length - 1].substring(0, n[n.length - 1].indexOf("_")));
                        var yPosition = parseInt(n[n.length - 1].substring(n[n.length - 1].indexOf("_") + 1));
            
                        //Get image level
                        n = source.match (/_files\/[0-9]+\//g);
                        var imageLevel = parseInt(n[0].substring(7, n[0].length - 1));
                        var levelHeight = Math.ceil(completeImageHeight / Math.pow(2, this._controller.GetMaxLevel(this.facetItem.Img) - imageLevel));
            
                        //Image will need to be scaled to get the displayHeight
                        var scale = displayHeight / levelHeight;
                    
                        // handle overlap 
                        overlap = this._controller.GetOverlap(this.facetItem.Img);
            
                        var offsetx = (Math.floor(blankWidth/2)) + 4 + xPosition * Math.floor((tileSize - overlap)  * scale);
                        var offsety = 4 + Math.floor((yPosition * (tileSize - overlap)  * scale));
            
                        var imageTileHeight = Math.ceil(this._images[i].height * scale);
                        var imageTileWidth = Math.ceil(this._images[i].width * scale);
            
                        // Creates a grid artfact across the image so comment out for now
                        //only clearing a small portion of the canvas
                        //this.context.fillRect(offsetx + this.x, offsety + this.y, imageTileWidth, imageTileHeight);
                        this.context.drawImage(this._images[i], offsetx + this._locations[loc].x , offsety + this._locations[loc].y, imageTileWidth, imageTileHeight);
                    }
                } else {
                    var offsetx = (Math.floor(blankWidth/2)) + 4;
                    var offsety = 4;
                    this.context.drawImage(this._images[0], offsetx + this._locations[loc].x , offsety + this._locations[loc].y, displayWidth, displayHeight);
                }
                
                if (this._selected) {
                    //draw a blue border
                    this.context.beginPath();
                    var offsetx = (Math.floor(blankWidth/2)) + 4;
                    var offsety = 4;
                    this.context.rect(offsetx + this._locations[this.selectedLoc].x , offsety + this._locations[this.selectedLoc].y, displayWidth, displayHeight);
                    this.context.lineWidth = 4;
                    this.context.strokeStyle = "#92C4E1";
                    this.context.stroke();
                }
            }
        }
        else {
            this.DrawEmpty(loc);
        }
    },
    //http://simonsarris.com/blog/510-making-html5-canvas-useful
    Contains: function (mx, my) {
        var foundIt = false;
        var loc = -1;
        for ( i = 0; i < this._locations.length; i++) {
            foundIt = (this._locations[i].x <= mx) && (this._locations[i].x + this.width >= mx) &&
        (this._locations[i].y <= my) && (this._locations[i].y + this.height >= my);
            if (foundIt)
              loc = i;
        }
        return loc;
    },
    DrawEmpty: function (loc) {
        if (this._controller.DrawLevel == undefined) {
            //draw an empty square
            this.context.beginPath();
            this.context.fillStyle = "#D7DDDD";
            this.context.fillRect(this._locations[loc].x + 4, this._locations[loc].y + 4, this.width - 8, this.height - 8);
            this.context.rect(this._locations[loc].x + 4, this._locations[loc].y + 4, this.width - 8, this.height - 8);
            this.context.lineWidth = 1;
            this.context.strokeStyle = "white";
            this.context.stroke();
        } else {
            //use the controllers blank tile
            this._controller.DrawLevel(this.facetItem, this.context, this._locations[loc].x + 4, this._locations[loc].y + 4, this.width - 8, this.height - 8);
        }
    },
    CollectionRoot: "",
    now: null,
    end: null,
    width: 0,
    height: 0,
    origwidth: 0,
    origheight: 0,
    ratio: 1,
    startwidth: 0,
    startheight: 0,
    destinationwidth: 0,
    destinationheight: 0,
    destinationVisible: true,
    context: null,
    facetItem: null,
    firstFilterItemDone: false,
    selectedLoc: 0,
    Selected: function (selected) { this._selected = selected }
});
///
/// Tile Location
/// Used to contain the location of a tile as in the graph view a tile can appear multiple times
///
PivotViewer.Views.TileLocation = Object.subClass({
    init: function () {
    },
    x: 0,
    y: 0,
    startx: 0,
    starty: 0,
    destinationx: 0,
    destinationy: 0,
});
