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

PivotViewer.Views.LoadImageSetHelper = Object.subClass({
    init: function () {
        this._images = [],
        this._loaded = false;
    },

    //Load an array of urls
    LoadImages: function (images) {
        var that = this;
        for (var i = 0; i < images.length; i++) {
            var img = new Image();
            img.src = images[i];
            img.onload = function () {
                that._loaded = true;
            };
            this._images.push(img);
        }
    },
    GetImages: function () { return this._images; },
    IsLoaded: function () { return this._loaded; }
});
