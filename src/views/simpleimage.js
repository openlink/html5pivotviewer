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
PivotViewer.Views.SimpleImageController = PivotViewer.Views.IImageController.subClass({
    init: function () {

        this._items = [];
        this._collageItems = [];
        this._baseUrl = "";
        this._collageMaxLevel = 0;
        this._tileSize = 256;
        this._format = "";
        this._ratio = 1;
        this.MaxRatio = 1;
        this._loadedCount = 0;

        this._zooming = false;
        var that = this;

        //Events
        $.subscribe("/PivotViewer/ImageController/Zoom", function (evt) {
            that._zooming = evt;
        });
    },
    Setup: function (baseUrl) {
        //get base URL
        this._baseUrl = baseUrl;
        var that = this;

        // get list of image files
        $.getJSON(baseUrl + "/imagelist.json")
        .done (function (images) {
            // for each item in the collection get the image filename
            for (var i = 0; i < images.ImageFiles.length; i++) {
                var img = new Image(); 

                img.onload = function() {
                    for (var i = 0; i < that._items.length; i++) {
                        if (that._items[i].Images[0] == this) {
                            that._items[i].Width = this.width;
                            that._items[i].Height = this.height;
                            that._loadedCount ++;
                        }
                        if (that._loadedCount == that._items.length) 
                            $.publish("/PivotViewer/ImageController/Collection/Loaded", null);
                        }
                    };

                img.src = that._baseUrl + "/" + images.ImageFiles[i];
                that._items.push(new PivotViewer.Views.SimpleImageItem(images.ImageFiles[i], that._baseUrl, img.width, img.height, img));
           }
        })
        .fail (function (jqxhr, textStatus, errorThrown) {
            //Make sure throbber is removed else everyone thinks the app is still running
            $('.pv-loading').remove();

            //Throw an alert so the user knows something is wrong
            var msg = '';
            msg = msg + 'Error loading image files<br><br>';
            msg = msg + 'URL        : ' + this.url + '<br>';
            msg = msg + 'Status : ' + jqXHR.status + ' ' + errorThrown + '<br>';
            msg = msg + 'Details    : ' + jqXHR.responseText + '<br>';
            msg = msg + '<br>Pivot Viewer cannot continue until this problem is resolved<br>';
            $('.pv-wrapper').append("<div id=\"pv-imageloading-error\" class=\"pv-modal-dialog\"><div><a href=\"#pv-modal-dialog-close\" title=\"Close\" class=\"pv-modal-dialog-close\">X</a><h2>HTML5 PivotViewer</h2><p>" + msg + "</p></div></div>");
            var t=setTimeout(function(){window.open("#pv-imageloading-error","_self")},1000)
        });
    },

    // Simple images just ignore the level - same image is used whatever the zoom
    GetImages: function (id, width, height) {
      // Only return image if size is big enough 
      if (width > 8 && height > 8) {
        for (var i = 0;  this._items.length; i++){
          if (this._items[i].ImageId == id) {
            return this._items[i].Images; 
          }
        }
      }
      return null;
    },
    GetWidthForImage: function( id, height ) {
        for (var i = 0; i < this._items.length; i++) {
            if (this._items[i].ImageId == id) {
               return Math.floor(height / (this._items[i].Height/this._items[i].Width));
            }
        }
    },
    GetWidth: function( id ) {
        for (var i = 0; i < this._items.length; i++) {
            if (this._items[i].ImageId == id) {
               return this._items[i].Width;
            }
        }
    },
    GetHeight: function( id ) {
        for (var i = 0; i < this._items.length; i++) {
            if (this._items[i].ImageId == id) {
               return this._items[i].Height;
            }
        }
    },
    GetRatio: function( id ) {
        for (var i = 0; i < this._items.length; i++) {
            if (this._items[i].ImageId == id) {
               return this._items[i].Height/this._items[i].Width;
            }
        }
    }
});

PivotViewer.Views.SimpleImageItem = Object.subClass({
    init: function (ImageId, BasePath, width, height, img) {
        this.ImageId = ImageId,
        this.BasePath = BasePath,
        this.Images = [img];
        this.Width = width;
        this.Height = height;
    }
});
