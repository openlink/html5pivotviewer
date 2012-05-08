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