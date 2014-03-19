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

///Image Controller interface - all image handlers must implement this
PivotViewer.Views.IImageController = Object.subClass({
    init: function () { },
    Setup: function (basePath) { },
    GetImagesAtLevel: function (id, level) { },
    Width: 0,
    Height: 0
});
