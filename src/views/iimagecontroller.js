//Image Controller interface - all image handlers must implement this
PivotViewer.Views.IImageController = Object.subClass({
    init: function () { },
    Setup: function (basePath) { },
    GetImagesAtLevel: function (id, level) { },
    Width: 0,
    Height: 0
});