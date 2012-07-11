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
            this._tiles.push(tile);
        }
        return this._tiles;
    },

    AnimateTiles: function () {
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
                var now = PivotViewer.Utils.Now() - this._tiles[i].start,
                end = this._tiles[i].end - this._tiles[i].start;
                //use the easing function to determine the next position
                if (now <= end) {
                    //at least one tile is moving
                    //isAnimating = true;

                    //if the position is different from the destination position then zooming is happening
                    if (this._tiles[i].x != this._tiles[i].destinationx || this._tiles[i].y != this._tiles[i].destinationy)
                        isZooming = true;

                    this._tiles[i].x = this._easing.ease(
                        now, 										// curr time
                        this._tiles[i].startx, 							// start position
                        this._tiles[i].destinationx - this._tiles[i].startx, // relative end position
                        end											// end time
                    );

                    this._tiles[i].y = this._easing.ease(
                    now,
                    this._tiles[i].starty,
                    this._tiles[i].destinationy - this._tiles[i].starty,
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
                    this._tiles[i].x = this._tiles[i].destinationx;
                    this._tiles[i].y = this._tiles[i].destinationy;
                    this._tiles[i].width = this._tiles[i].destinationwidth;
                    this._tiles[i].height = this._tiles[i].destinationheight;
                }

                //check if the destination will be in the visible area
                if (this._tiles[i].destinationx + this._tiles[i].destinationwidth < 0 || this._tiles[i].destinationx > context.canvas.width || this._tiles[i].destinationy + this._tiles[i].destinationheight < 0 || this._tiles[i].destinationy > context.canvas.height)
                    this._tiles[i].destinationVisible = false;
                else
                    this._tiles[i].destinationVisible = true;
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
            if (this._tiles[i].x + this._tiles[i].width > 0 && this._tiles[i].x < context.canvas.width && this._tiles[i].y + this._tiles[i].height > 0 && this._tiles[i].y < context.canvas.height) {
                if (isAnimating)
                    this._tiles[i].DrawEmpty();
                else
                    this._tiles[i].Draw();
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
                that.AnimateTiles();
            });
        } else {
            this._started = false;
            return;
        }
    },

    BeginAnimation: function () {
        if (!this._started && this._tiles.length > 0) {
            this._breaks = false;
            this.AnimateTiles();
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
    GetTileRaio: function () {
        return this._imageController.Height / this._imageController.Width;
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
        this._level = 0;
        this._images = null;
    },

    Draw: function () {
        //Is the tile destination in visible area?
        //If not, then re-use the old level images
        if (this.destinationVisible) {
            //Determine level
            var biggest = this.width > this.height ? this.width : this.height;
            var thisLevel = Math.ceil(Math.log(biggest) / Math.log(2));


            if (thisLevel == Infinity || thisLevel == -Infinity)
                thisLevel = 0;

            //TODO: Look at caching last image to avoid using _controller
            this._level = thisLevel;
            //if(this._level > 6)
                this._images = this._controller.GetImagesAtLevel(this.facetItem.Img, this._level);
        }

        if (this._images != null) {
            if (typeof this._images == "function") {
                //A DrawLevel function returned - invoke
                this._images(this.facetItem, this.context, this.x + 2, this.y + 2, this.width - 4, this.height - 4);
            }
            else if (this._images.length > 0 && this._images[0] instanceof Image) {
                //if the collection contains an image
                for (var i = 0; i < this._images.length; i++) {
                    //only clearing a small portion of the canvas
                    //http://www.html5rocks.com/en/tutorials/canvas/performance/
                    //this.context.fillRect(this.x, this.y, this.width, this.height);
                    this.context.drawImage(this._images[i], this.x + 2, this.y + 2, this.width - 4, this.height - 4);
                }
            }
        }
        else {
            this.DrawEmpty();
        }

        if (this._selected) {
            //draw a blue border
            this.context.beginPath();
            this.context.rect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
            this.context.lineWidth = 4;
            this.context.strokeStyle = "#92C4E1";
            this.context.stroke();
        }
    },
    //http://simonsarris.com/blog/510-making-html5-canvas-useful
    Contains: function (mx, my) {
        return (this.x <= mx) && (this.x + this.width >= mx) &&
        (this.y <= my) && (this.y + this.height >= my);
    },
    DrawEmpty: function () {
        if (this._controller.DrawLevel == undefined) {
            //draw an empty square
            this.context.beginPath();
            this.context.fillStyle = "#D7DDDD";
            this.context.fillRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
            this.context.rect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
            this.context.lineWidth = 1;
            this.context.strokeStyle = "white";
            this.context.stroke();
        } else {
            //use the controllers blank tile
            this._controller.DrawLevel(this.facetItem, this.context, this.x + 2, this.y + 2, this.width - 4, this.height - 4);
        }
    },
    CollectionRoot: "",
    now: null,
    end: null,
    x: 0,
    y: 0,
    startx: 0,
    starty: 0,
    destinationx: 0,
    destinationy: 0,
    width: 0,
    height: 0,
    startwidth: 0,
    startheight: 0,
    destinationwidth: 0,
    destinationheight: 0,
    destinationVisible: true,
    context: null,
    facetItem: null,
    Selected: function (selected) { this._selected = selected }
});