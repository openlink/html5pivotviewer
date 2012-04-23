///
/// Deep Zoom Controller
/// used to create the initial deep zoom tiles and their animation based on the locations set in the views
///
PivotViewer.Views.DeepZoomController = function () {
    var _tiles = [],
        _started = false,
        _breaks = false,
        _easing = new Easing.Easer({ type: "circular", side: "both" }),
        _imageController,
        _isZooming = false,
        _canvasContext,
        _helpers = [],
        _helperText = "";

    InitDZController = function (pivotCollectionItems, baseCollectionPath, canvasContext) {

        _imageController = new PivotViewer.Views.DeepZoomImageController();
        for (var i = 0; i < pivotCollectionItems.length; i++) {
            var tile = new PivotViewer.Views.DeepZoomTile(_imageController);
            tile.facetItem = pivotCollectionItems[i];
            tile.CollectionRoot = baseCollectionPath.replace(/\\/gi, "/").replace(/\.xml/gi, "");
            _canvasContext = canvasContext;
            tile.context = _canvasContext;
            _tiles.push(tile);
        }
        //Init DZ images
        _imageController.Init(baseCollectionPath.replace("\\", "/"));

        return _tiles;
    };

    AnimateTiles = function () {
        _started = true;

        if (_tiles.length > 0 && _tiles[0].context != null) {
            var context = _tiles[0].context;
            context.clearRect(0, 0, context.canvas.width, context.canvas.height);

            //TODO investigate this for performance: http://stackoverflow.com/questions/7787219/javascript-ios5-javascript-execution-exceeded-timeout

            var isZooming = false;
            //Set tile properties
            for (var i = 0; i < _tiles.length; i++) {
                var now = Now() - _tiles[i].start,
                end = _tiles[i].end - _tiles[i].start;
                //use the easing function to determine the next position
                if (now <= end) {

                    //if the position is different from the destination position then zooming is happening
                    if (_tiles[i].x != _tiles[i].destinationx || _tiles[i].y != _tiles[i].destinationy)
                        isZooming = true;

                    _tiles[i].x = _easing.ease(
                        now, 										// curr time
                        _tiles[i].startx, 							// start position
                        _tiles[i].destinationx - _tiles[i].startx, // relative end position
                        end											// end time
                    );

                    _tiles[i].y = _easing.ease(
                    now,
                    _tiles[i].starty,
                    _tiles[i].destinationy - _tiles[i].starty,
                    end
                );

                    //if the width/height is different from the destination width/height then zooming is happening
                    if (_tiles[i].width != _tiles[i].destinationWidth || _tiles[i].height != _tiles[i].destinationHeight)
                        isZooming = true;

                    _tiles[i].width = _easing.ease(
                    now,
                    _tiles[i].startwidth,
                    _tiles[i].destinationwidth - _tiles[i].startwidth,
                    end
                );

                    _tiles[i].height = _easing.ease(
                    now,
                    _tiles[i].startheight,
                    _tiles[i].destinationheight - _tiles[i].startheight,
                    end
                );
                } else {
                    _tiles[i].x = _tiles[i].destinationx;
                    //_tiles[i].startx = _tiles[i].destinationx;

                    _tiles[i].y = _tiles[i].destinationy;
                    //_tiles[i].starty = _tiles[i].destinationy;

                    _tiles[i].width = _tiles[i].destinationwidth;
                    //_tiles[i].startwidth = _tiles[i].destinationwidth;

                    _tiles[i].height = _tiles[i].destinationheight;
                    //_tiles[i].startheight = _tiles[i].destinationheight;
                }

                //check if the destination will be in the visible area
                if (_tiles[i].destinationx + _tiles[i].destinationwidth < 0 || _tiles[i].destinationx > context.canvas.width || _tiles[i].destinationy + _tiles[i].destinationheight < 0 || _tiles[i].destinationy > context.canvas.height)
                    _tiles[i].destinationVisible = false;
                else
                    _tiles[i].destinationVisible = true;
            }
        }

        //fire zoom event
        if (_isZooming != isZooming) {
            _isZooming = isZooming;
            $.publish("/PivotViewer/DeepZoom/Zoom", [_isZooming]);
        }

        //one properties set then draw
        for (var i = 0; i < _tiles.length; i++) {
            //only draw if in visible area
            if (_tiles[i].x + _tiles[i].width > 0 && _tiles[i].x < context.canvas.width && _tiles[i].y + _tiles[i].height > 0 && _tiles[i].y < context.canvas.height)
                _tiles[i].Draw();
        }

        //Helpers
        if (debug) {
            //Draw point if one requested
            if (_helpers.length > 0) {
                for (var i = 0; i < _helpers.length; i++) {
                    _canvasContext.beginPath();
                    _canvasContext.moveTo(_helpers[i].x, _helpers[i].y);
                    _canvasContext.arc(_helpers[i].x + 1, _helpers[i].y + 1, 10, 0, Math.PI * 2, true);
                    _canvasContext.fillStyle = "#FF0000";
                    _canvasContext.fill();
                    _canvasContext.beginPath();
                    _canvasContext.rect(_helpers[i].x + 25, _helpers[i].y - 40, 50, 13);
                    _canvasContext.fillStyle = "white";
                    _canvasContext.fill();
                    _canvasContext.fillStyle = "black";
                    _canvasContext.fillText(_helpers[i].x + ", " + _helpers[i].y, _helpers[i].x + 30, _helpers[i].y - 30);
                }
            }

            if (_helperText.length > 0) {
                _canvasContext.beginPath();
                _canvasContext.rect(220, 5, 500, 14);
                _canvasContext.fillStyle = "white";
                _canvasContext.fill();
                _canvasContext.fillStyle = "black";
                _canvasContext.fillText(_helperText, 225, 14);
            }
        }

        // request new frame
        if (!_breaks) {
            requestAnimFrame(function () {
                AnimateTiles();
            });
        } else {
            _started = false;
            return;
        }
    };

    Now = function () {
        if (Date.now)
            return Date.now();
        else
            return (new Date().getTime());
    };

    return {
        Init: InitDZController,
        BeginAnimation: function () {
            if (!_started && _tiles.length > 0) {
                _breaks = false;
                AnimateTiles();
            }
        },
        StopAnimation: function () {
            _breaks = true;
        },
        SetLinearEasingBoth: function () {
            _easing = new Easing.Easer({ type: "linear", side: "both" });
        },
        SetCircularEasingBoth: function () {
            _easing = new Easing.Easer({ type: "circular", side: "both" });
        },
        SetQuarticEasingOut: function () {
            _easing = new Easing.Easer({ type: "quartic", side: "out" });
        },
        GetTileRaio: function () {
            return _imageController.Height() / _imageController.Width();
        },
        DrawHelpers: function (helpers) {
            _helpers = helpers;
        },
        DrawHelperText: function (text) {
            _helperText = text;
        }
    };
};

///
/// Deep Zoom Tile
/// Used to contain the details of an individual tile, and to draw the tile on a given canvas context
///
PivotViewer.Views.DeepZoomTile = Object.subClass({
    init: function (DZController) {
        if (!(this instanceof PivotViewer.Views.DeepZoomTile)) {
            return new PivotViewer.Views.DeepZoomTile(DZController);
        }
        this._controller = DZController;
        this._image = new Image();
        this._imageLoaded = false;
        this._selected = false;
        this._controller = DZController;
        this._level = 0;
        this._images = null;

        this._image.onload = function () {
            this._imageLoaded = true;
        };
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
            //if (thisLevel != _level || _images == null) {
            this._level = thisLevel;
            this._images = this._controller.GetImagesAtLevel(this.facetItem.Img, this._level);
            //}
        }

        if (this._images != null) {
            //determine width and height
            //			var width = this.width; // -4;
            //			var height = this.height;// -4;
            //			if (_controller.Width() > _controller.Height())
            //				height = (_controller.Height() / _controller.Width()) * height;
            //			else
            //				width = (_controller.Height() / _controller.Width()) * width;

            for (var i = 0; i < this._images.length; i++) {
                this.context.drawImage(this._images[i], this.x + 2, this.y + 2, this.width - 4, this.height - 4);
            }
        }
        else {
            //draw an empty square
            this.context.beginPath();
            this.context.rect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
            this.context.lineWidth = 1;
            this.context.strokeStyle = "black";
            this.context.stroke();
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

///
/// Deep Zoom Image Getter
/// Retrieves and caches images
///
PivotViewer.Views.DeepZoomImageController = function () {
    var _items = [],
        _collageItems = [],
        _baseUrl = "",
        _collageUrl = "",
        _collageMaxLevel = 0,
        _tileSize = 256,
        _width = 0,
        _height = 0,
        _tileFormat = "jpg",
        _maxLevel = 0,
        _zooming = false;

    initDZ = function (deepzoomCollection) {
        //get base URL
        _baseUrl = deepzoomCollection.substring(0, deepzoomCollection.lastIndexOf("/"));
        _collageUrl = deepzoomCollection.substring(deepzoomCollection.lastIndexOf("/") + 1).replace('.xml', '_files');
        //load dzi and start creating array of id's and DeepZoomLevels
        $.ajax({
            type: "GET",
            url: deepzoomCollection,
            dataType: "xml",
            success: function (xml) {
                var items = $(xml).find("I");
                if (items.length == 0)
                    return;
                //lets assume that each of the items have the same dzi properties, so just get the first one
                var dziSource = $(items[0]).attr('Source');
                $.ajax({
                    type: "GET",
                    url: _baseUrl + "/" + dziSource,
                    dataType: "xml",
                    success: function (dzixml) {
                        var image = $(dzixml).find("Image");
                        if (image.length == 0)
                            return;

                        var jImage = $(image[0]);
                        _tileSize = jImage.attr('TileSize');
                        _tileFormat = jImage.attr('Format');
                        _collageMaxLevel = jImage.attr('MaxLevel');
                        //calculate max level
                        var size = jImage.children().first();
                        _width = parseInt(size.attr("Width"));
                        _height = parseInt(size.attr("Height"));
                        var maxDim = _width > _height ? _width : _height;
                        _maxLevel = Math.ceil(Math.log(maxDim) / Math.log(2));

                        //create all images
                        for (var i = 0; i < items.length; i++) {
                            //Create an item image collection
                            var source = $(items[i]).attr('Source');
                            var itemId = $(items[i]).attr('Id');
                            var dzN = $(items[i]).attr('N');
                            var dzId = source.substring(source.lastIndexOf("/") + 1).replace(/\.xml/gi, "").replace(/\.dzi/gi, "");
                            var basePath = source.substring(0, source.lastIndexOf("/"));
                            if (basePath.length = 0)
                                basePath = '/';
                            _items.push(new PivotViewer.Views.DeepZoomItem(itemId, dzId, dzN, basePath));
                        }

                        //Loaded DeepZoom collection
                        $.publish("/PivotViewer/DeepZoom/Collection/Loaded", null);
                    }
                });
            }
        });
    };

    getImageLevel = function (id, level) {
        //if the request level is greater than the collections max then set to max
        //level = (level > _maxLevel ? _maxLevel : level);

        //For PoC max level is 8
        level = (level > 7 ? 7 : level);
        level = (level <= 0 ? 6 : level);

        //find imageId
        for (var i = 0; i < _items.length; i++) {
            if (_items[i].ItemId == id) {


                //to work out collage image
                //convert image n to base 2
                //convert to array and put even and odd bits into a string
                //convert strings to base 10 - this represents the tile row and col
                var baseTwo = _items[i].DZN.toString(2);
                var even = "", odd = "";
                for (var b = 0; b < baseTwo.length; b++) {
                    if (b % 2 == 0)
                        even += baseTwo[b];
                    else
                        odd += baseTwo[b];
                }
                dzCol = parseInt(even, 2);
                dzRow = parseInt(odd, 2);
                //for the zoom level work out the DZ tile where it came from

                if ((_items[i].Levels == undefined || _items[i].Levels.length == 0) && !_zooming) {
                    //create 0 level
                    var imageList = getImageList(_baseUrl + "/" + _items[i].BasePath + _items[i].DZId + "_files/6/", 6); ;
                    var newLevel = new PivotViewer.Views.DeepZoomLevel();
                    newLevel.LoadImages(imageList);
                    _items[i].Levels.push(newLevel);
                    return null;
                }
                else if (_items[i].Levels.length < level && !_zooming) {
                    //requested level does not exist, and the Levels list is smaller than the requested level
                    var imageList = getImageList(_baseUrl + "/" + _items[i].BasePath + _items[i].DZId + "_files/" + level + "/", level);
                    var newLevel = new PivotViewer.Views.DeepZoomLevel();
                    newLevel.LoadImages(imageList);
                    _items[i].Levels.splice(level, 0, newLevel);
                }

                //get best loaded level to return
                for (var j = level; j > -1; j--) {
                    if (_items[i].Levels[j] != undefined && _items[i].Levels[j].IsLoaded()) {
                        return _items[i].Levels[j].GetImages();
                    }
                    //if request level has not been requested yet
                    if (j == level && _items[i].Levels[j] == undefined && !_zooming) {
                        //create array of images to getagePath.replace('.dzi', '').replace('\/\/', '\/');
                        var imageList = getImageList(_baseUrl + "/" + _items[i].BasePath + _items[i].DZId + "_files/" + j + "/", j);
                        //create level
                        var newLevel = new PivotViewer.Views.DeepZoomLevel();
                        newLevel.LoadImages(imageList);
                        _items[i].Levels.splice(j, 0, newLevel);
                    }
                }

                return null;
            }
        }
        return null;
    };

    getImageList = function (basePath, level) {
        var fileNames = [];

        var levelWidth = Math.ceil(_width / Math.pow(2, _maxLevel - level));
        var levelHeight = Math.ceil(_height / Math.pow(2, _maxLevel - level));
        //based on the width for this level, get the slices based on the DZ Tile Size
        var hslices = Math.ceil(levelWidth / _tileSize);
        var vslices = Math.ceil(levelHeight / _tileSize);

        //Construct list of file names based on number of vertical and horizontal images
        for (var i = 0; i < hslices; i++) {
            for (var j = 0; j < vslices; j++) {
                fileNames.push(basePath + i + "_" + j + "." + _tileFormat);
            }
        }
        return fileNames;
    }

    //Events
    $.subscribe("/PivotViewer/DeepZoom/Zoom", function (evt) {
        _zooming = evt;
    });

    return {
        Init: initDZ,
        GetImagesAtLevel: getImageLevel,
        Width: function () { return _width; },
        Height: function () { return _height; }
    };
};

PivotViewer.Views.DeepZoomItem = function (ItemId, DZId, DZn, BasePath) {
    var _itemId = ItemId,
        _dzId = DZId,
        _n = parseInt(DZn),
        _basePath = BasePath,
        _levels = [];
    return {
        ItemId: _itemId,
        DZId: _dzId,
        DZN: _n,
        BasePath: _basePath,
        Levels: _levels
    };
};

PivotViewer.Views.DeepZoomLevel = function () {
    var _images = [],
        _loaded = false;

    //Load an array of urls
    loadImages = function (images) {
        for (var i = 0; i < images.length; i++) {
            var img = new Image();
            img.src = images[i];
            img.onload = function () {
                _loaded = true;
            };
            _images.push(img);
        }
    };

    isLoaded = function () {
        if (!_loaded) {
            //check if the images have loaded
            var loadedCount = 0;
            for (var i = 0; i < _images.length; i++) {
                if (_images[i].complete)
                    loadedCount++;
            }
            if (loadedCount == _images.length)
                _loaded = true;
        }
        return _loaded;
    }

    return {
        LoadImages: loadImages,
        IsLoaded: function () { return _loaded; },
        GetImages: function () { return _images; }
    }
};