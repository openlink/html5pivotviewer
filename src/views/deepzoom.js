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
        this._maxLevel = 0;

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
                var items = $(xml).find("I");
                if (items.length == 0)
                    return;
                
                //If collection itself contains size information, use first one for now
                var dzcSize = $(items[0]).find('Size');
                if (dzcSize.length > 0) {
                    //calculate max level
                    that.Width = parseInt(dzcSize.attr("Width"));
                    that.Height = parseInt(dzcSize.attr("Height"));
                    var maxDim = that.Width > that.Height ? that.Width : that.Height;
                    that._maxLevel = Math.ceil(Math.log(maxDim) / Math.log(2));
                }

                //lets assume that each of the items have the same dzi properties, so just get the first one
                var dziSource = $(items[0]).attr('Source');
                $.ajax({
                    type: "GET",
                    url: that._baseUrl + "/" + dziSource,
                    dataType: "xml",
                    success: function (dzixml) {
                        //In case we find a dzi, recalculate sizes
                        var image = $(dzixml).find("Image");
                        if (image.length == 0)
                            return;

                        var jImage = $(image[0]);
                        that._tileSize = jImage.attr('TileSize');
                        that._tileFormat = jImage.attr('Format');
                        that._collageMaxLevel = jImage.attr('MaxLevel');

                        //calculate max level
                        var size = jImage.children().first();
                        that.Width = parseInt(size.attr("Width"));
                        that.Height = parseInt(size.attr("Height"));
                        var maxDim = that.Width > that.Height ? that.Width : that.Height;
                        that._maxLevel = Math.ceil(Math.log(maxDim) / Math.log(2));

                    },
                    complete: function (jqXHR, textStatus) {
                        //At this point we either have size info from collection or first dzi, so continue
                        for (var i = 0; i < items.length; i++) {
                            //Create an item image collection
                            var source = $(items[i]).attr('Source');
                            var itemId = $(items[i]).attr('Id');
                            var dzN = $(items[i]).attr('N');
                            var dzId = source.substring(source.lastIndexOf("/") + 1).replace(/\.xml/gi, "").replace(/\.dzi/gi, "");
                            var basePath = source.substring(0, source.lastIndexOf("/"));
                            if (basePath.length > 0)
                                basePath = basePath + '/';
                            that._items.push(new PivotViewer.Views.DeepZoomItem(itemId, dzId, dzN, basePath));
                        }

                        //Loaded DeepZoom collection
                        $.publish("/PivotViewer/ImageController/Collection/Loaded", null);
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        //Make sure throbber is removed else everyone thinks the app is still running
                        $('.pv-loading').remove();
                        //No need to throw alert
                    }
                });
            },
            error: function(jqXHR, textStatus, errorThrown) {
                //Make sure throbber is removed else everyone thinks the app is still running
                $('.pv-loading').remove();

                //Throw an alert so the user knows something is wrong
                var msg = '';
                msg = msg + 'Error loading from DeepZoom Cache\r\n\r\n';
                msg = msg + 'URL        : ' + this.url + '\r\n';
                msg = msg + 'Statuscode : ' + jqXHR.status + '\r\n';
                msg = msg + 'Details    : ' + errorThrown + '\r\n';
                msg = msg + '\r\nPivot Viewer cannot continue until this problem is resolved\r\r';
                window.alert (msg);
            }
        });
    },

    GetImagesAtLevel: function (id, level) {
        //if the request level is greater than the collections max then set to max
        //level = (level > _maxLevel ? _maxLevel : level);

        //For PoC max level is 8
        level = (level > 7 ? 7 : level);
        level = (level <= 0 ? 6 : level);

        //find imageId
        for (var i = 0; i < this._items.length; i++) {
            if (this._items[i].ItemId == id) {

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
                    var imageList = this.GetImageList(this._baseUrl + "/" + this._items[i].BasePath + this._items[i].DZId + "_files/6/", 6); ;
                    var newLevel = new PivotViewer.Views.LoadImageSetHelper();
                    newLevel.LoadImages(imageList);
                    this._items[i].Levels.push(newLevel);
                    return null;
                }
                else if (this._items[i].Levels.length < level && !this._zooming) {
                    //requested level does not exist, and the Levels list is smaller than the requested level
                    var imageList = this.GetImageList(this._baseUrl + "/" + this._items[i].BasePath + this._items[i].DZId + "_files/" + level + "/", level);
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
                        var imageList = this.GetImageList(this._baseUrl + "/" + this._items[i].BasePath + this._items[i].DZId + "_files/" + j + "/", j);
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

    GetImageList: function (basePath, level) {
        var fileNames = [];

        var levelWidth = Math.ceil(this.Width / Math.pow(2, this._maxLevel - level));
        var levelHeight = Math.ceil(this.Height / Math.pow(2, this._maxLevel - level));
        //based on the width for this level, get the slices based on the DZ Tile Size
        var hslices = Math.ceil(levelWidth / this._tileSize);
        var vslices = Math.ceil(levelHeight / this._tileSize);

        //Construct list of file names based on number of vertical and horizontal images
        for (var i = 0; i < hslices; i++) {
            for (var j = 0; j < vslices; j++) {
                fileNames.push(basePath + i + "_" + j + "." + this._tileFormat);
            }
        }
        return fileNames;
    }
});

PivotViewer.Views.DeepZoomItem = Object.subClass({
    init: function (ItemId, DZId, DZn, BasePath) {
        this.ItemId = ItemId,
        this.DZId = DZId,
        this.DZN = parseInt(DZn),
        this.BasePath = BasePath,
        this.Levels = [];
    }
});