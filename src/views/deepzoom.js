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
/// Deep Zoom Image Getter
/// Retrieves and caches images
///
PivotViewer.Views.DeepZoomImageController = PivotViewer.Views.IImageController.subClass({
    init: function () {
        this._items = [];
        this._collageItems = [];
        this._baseUrl = "";
        this._collageMaxLevel = 0;
        this._tileSize = 256;
        this._format = "";
        this._ratio = 1;
        this.MaxRatio = 1;

        this._zooming = false;
        var that = this;

        //Events
        $.subscribe("/PivotViewer/ImageController/Zoom", function (evt) {
            that._zooming = evt;
        });
    },
    Setup: function (deepzoomCollection) {
        //get base URL
        this._baseUrl = deepzoomCollection.substring(0, deepzoomCollection.lastIndexOf("/"));
        this._collageUrl = deepzoomCollection.substring(deepzoomCollection.lastIndexOf("/") + 1).replace('.xml', '_files');
        var that = this;
        //load dzi and start creating array of id's and DeepZoomLevels
        $.ajax({
            type: "GET",
            url: deepzoomCollection,
            dataType: "xml",
            success: function (xml) {
                var collection = $(xml).find("Collection");
                that._tileSize = $(collection).attr("TileSize");
                that._format = $(collection).attr('Format');
                that._collageMaxLevel = $(collection).attr('MaxLevel');

                var items = $(xml).find("I");
                if (items.length == 0) {
                    $('.pv-loading').remove();

                    //Throw an alert so the user knows something is wrong
                    var msg = '';
                    msg = msg + 'No items in the DeepZoom Collection<br><br>';
                    msg = msg + 'URL        : ' + this.url + '<br>';
                    msg = msg + '<br>Pivot Viewer cannot continue until this problem is resolved<br>';
                    $('.pv-wrapper').append("<div id=\"pv-dzloading-error\" class=\"pv-modal-dialog\"><div><a href=\"#pv-modal-dialog-close\" title=\"Close\" class=\"pv-modal-dialog-close\">X</a><h2>HTML5 PivotViewer</h2><p>" + msg + "</p></div></div>");
                    var t=setTimeout(function(){window.open("#pv-dzloading-error","_self")},1000)
                    return;
                }
                
                //If collection itself contains size information, use first one for now
                var dzcSize = $(items[0]).find('Size');
                if (dzcSize.length > 0) {
                    //calculate max level
                    that.MaxWidth = parseInt(dzcSize.attr("Width"));
                    // Use height of first image for now...
                    that.Height = parseInt(dzcSize.attr("Height"));
                    that.MaxRatio = that.Height/that.MaxWidth;

                    for ( i = 0; i < items.length; i++ ) {
                        itemSize = $(items[i]).find("Size");
                        var width = parseInt(itemSize.attr("Width"));
                        var height = parseInt(itemSize.attr("Height"));
                        var maxDim = width > height ? width : height;
                        var maxLevel = Math.ceil(Math.log(maxDim) / Math.log(2));

                        that._ratio = height / width;
                        var dziSource = $(items[i]).attr('Source');
                        var itemId = $(items[i]).attr('Id');
                        var dzN = $(items[i]).attr('N');
                        var dzId = dziSource.substring(dziSource.lastIndexOf("/") + 1).replace(/\.xml/gi, "").replace(/\.dzi/gi, "");
                        var basePath = dziSource.substring(0, dziSource.lastIndexOf("/"));
                        if (basePath.length > 0)
                             basePath = basePath + '/';
                        if (width > that.MaxWidth)
                            that.MaxWidth = width;
                        if (that._ratio < that.MaxRatio)  // i.e. biggest width cf height upside down....
                            that.MaxRatio = that._ratio;

                        that._items.push(new PivotViewer.Views.DeepZoomItem(itemId, dzId, dzN, basePath, that._ratio, width, height, maxLevel, that._baseUrl, dziSource));
                    }
                }

                
                 //Loaded DeepZoom collection
                 $.publish("/PivotViewer/ImageController/Collection/Loaded", null);
             },
             error: function(jqXHR, textStatus, errorThrown) {
                //Make sure throbber is removed else everyone thinks the app is still running
                $('.pv-loading').remove();

                //Throw an alert so the user knows something is wrong
                var msg = '';
                msg = msg + 'Error loading from DeepZoom Cache<br><br>';
                msg = msg + 'URL        : ' + this.url + '<br>';
                msg = msg + 'Status : ' + jqXHR.status + ' ' + errorThrown + '<br>';
                msg = msg + 'Details    : ' + jqXHR.responseText + '<br>';
                msg = msg + '<br>Pivot Viewer cannot continue until this problem is resolved<br>';
                $('.pv-wrapper').append("<div id=\"pv-dzloading-error\" class=\"pv-modal-dialog\"><div><a href=\"#pv-modal-dialog-close\" title=\"Close\" class=\"pv-modal-dialog-close\">X</a><h2>HTML5 PivotViewer</h2><p>" + msg + "</p></div></div>");
                var t=setTimeout(function(){window.open("#pv-dzloading-error","_self")},1000)
            }
        });
    },

    GetImages: function (id, width, height) {
        //Determine level
        var biggest = width > height ? width : height;
        var thisLevel = Math.ceil(Math.log(biggest) / Math.log(2));

        if (thisLevel == Infinity || thisLevel == -Infinity)
            thisLevel = 0;

        //TODO: Look at caching last image to avoid using _controller
        this._level = thisLevel;
        return this.GetImagesAtLevel(id, thisLevel);
    },

    GetImagesAtLevel: function (id, level) {
        //if the request level is greater than the collections max then set to max
        //level = (level > _maxLevel ? _maxLevel : level);

        //For PoC max level is 8
        //level = (level > 8 ? 8 : level);
        level = (level <= 0 ? 6 : level);

        //find imageId
        for (var i = 0; i < this._items.length; i++) {
            if (this._items[i].ItemId == id) {
                level = (level > this._items[i].MaxLevel ? this._items[i].MaxLevel : level);

                //to work out collage image
                //convert image n to base 2
                //convert to array and put even and odd bits into a string
                //convert strings to base 10 - this represents the tile row and col
                var baseTwo = this._items[i].DZN.toString(2);
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

                if ((this._items[i].Levels == undefined || this._items[i].Levels.length == 0) && !this._zooming) {
                    //create 0 level
                    var imageList = this.GetImageList(i, this._baseUrl + "/" + this._items[i].BasePath + this._items[i].DZId + "_files/6/", 6); ;
                    var newLevel = new PivotViewer.Views.LoadImageSetHelper();
                    newLevel.LoadImages(imageList);
                    this._items[i].Levels.push(newLevel);
                    return null;
                }
                else if (this._items[i].Levels.length < level && !this._zooming) {
                    //requested level does not exist, and the Levels list is smaller than the requested level
                    var imageList = this.GetImageList(i, this._baseUrl + "/" + this._items[i].BasePath + this._items[i].DZId + "_files/" + level + "/", level);
                    var newLevel = new PivotViewer.Views.LoadImageSetHelper();
                    newLevel.LoadImages(imageList);
                    this._items[i].Levels.splice(level, 0, newLevel);
                }

                //get best loaded level to return
                for (var j = level; j > -1; j--) {
                    if (this._items[i].Levels[j] != undefined && this._items[i].Levels[j].IsLoaded()) {
                        return this._items[i].Levels[j].GetImages();
                    }
                    //if request level has not been requested yet
                    if (j == level && this._items[i].Levels[j] == undefined && !this._zooming) {
                        //create array of images to getagePath.replace('.dzi', '').replace('\/\/', '\/');
                        var imageList = this.GetImageList(i, this._baseUrl + "/" + this._items[i].BasePath + this._items[i].DZId + "_files/" + j + "/", j);
                        //create level
                        var newLevel = new PivotViewer.Views.LoadImageSetHelper();
                        newLevel.LoadImages(imageList);
                        this._items[i].Levels.splice(j, 0, newLevel);
                    }
                }

                return null;
            }
        }
        return null;
    },

    GetImageList: function (itemIndex, basePath, level) {
        var fileNames = [];

        var tileSize = this._tileSize;
        var tileFormat = this._format;
        var ratio = this._items[itemIndex].Ratio;
        var height = this._items[itemIndex].Height;
        var maxLevel = this._items[itemIndex].MaxLevel;

        var levelWidth = Math.ceil( (height/ratio) / Math.pow(2, maxLevel - level));
        var levelHeight = Math.ceil(height / Math.pow(2, maxLevel - level));
        //based on the width for this level, get the slices based on the DZ Tile Size
        var hslices = Math.ceil(levelWidth / tileSize);
        var vslices = Math.ceil(levelHeight / tileSize);

        //Construct list of file names based on number of vertical and horizontal images
        for (var i = 0; i < hslices; i++) {
            for (var j = 0; j < vslices; j++) {
                fileNames.push(basePath + i + "_" + j + "." + tileFormat);
            }
        }
        return fileNames;
    },

    GetWidthForImage: function( id, height ) {
        for (var i = 0; i < this._items.length; i++) {
            if (this._items[i].ItemId == id) {
               return Math.floor(height / this._items[i].Ratio);
            }
        }
    },

    GetDzi: function( id ) {
        for (var i = 0; i < this._items.length; i++) {
            if (this._items[i].ItemId == id) {
               dziName = this._baseUrl + "/" + this._items[i].BasePath + this._items[i].DZId + ".dzi";
               return dziName;
            }
        }
    },

    GetMaxLevel: function( id ) {
        for (var i = 0; i < this._items.length; i++) {
            if (this._items[i].ItemId == id) {
               return this._items[i].MaxLevel;
            }
        }
    },

    GetWidth: function( id ) {
        for (var i = 0; i < this._items.length; i++) {
            if (this._items[i].ItemId == id) {
               return this._items[i].Width;
            }
        }
    },

    GetHeight: function( id ) {
        for (var i = 0; i < this._items.length; i++) {
            if (this._items[i].ItemId == id) {
               return this._items[i].Height;
            }
        }
    },
    GetOverlap: function( id ) {
        for (var i = 0; i < this._items.length; i++) {
            if (this._items[i].ItemId == id) {
               return this._items[i].Overlap;
            }
        }
    },
    GetRatio: function( id ) {
        for (var i = 0; i < this._items.length; i++) {
            if (this._items[i].ItemId == id) {
               return this._items[i].Ratio;
            }
        }
    }
});

PivotViewer.Views.DeepZoomItem = Object.subClass({    init: function (ItemId, DZId, DZn, BasePath, Ratio, Width, Height, MaxLevel, baseUrl, dziSource) {
        this.ItemId = ItemId,
        this.DZId = DZId,
        this.DZN = parseInt(DZn),
        this.BasePath = BasePath,
        this.Levels = [];    //jch                    
        this.Ratio = Ratio;  
        this.Width = Width;
        this.Height = Height;
        this.MaxLevel = MaxLevel;
        var that = this;
        //this.Overlap = Overlap;
        // get overlap info from dzi
        $.ajax({
            type: "GET",
            url: baseUrl + "/" + dziSource,
            dataType: "xml",
            success: function (dzixml) {
                //In case we find a dzi, recalculate sizes
                var image = $(dzixml).find("Image");
                if (image.length == 0)
                    return;
        
                var jImage = $(image[0]);
                that.Overlap = jImage.attr('Overlap');
            },
            complete: function(jqXHR, textStatus) {
                //that._items.push(new PivotViewer.Views.DeepZoomItem(itemId, dzId, dzN, basePath, that._ratio, width, height, maxLevel, that._overlap));
            },
            error: function(jqXHR, textStatus, errorThrown) {
                that.Overlap = 0;
            }
        });
    }
});
