//Data View
PivotViewer.Views.DataView = PivotViewer.Views.IPivotViewerView.subClass({
	init: function () {
		this._super();
	},
	Setup: function (width, height, offsetX, offsetY, tileRatio) { },
	Filter: function (dzTiles, currentFilter, sortFacet) { },
	GetUI: function () { return ''; },
	GetButtonImage: function () { return ''; },
	GetButtonImageSelected: function () { return ''; },
	GetViewName: function () { return 'Grid View'; },
});